<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CheckoutService
{
    public function __construct(
        private readonly CartService $carts,
        private readonly Pricing $pricing,
        private readonly StoreSettings $settings,
    ) {}

    /**
     * @param  array<string, mixed>  $customer
     */
    public function place(array $customer, PaymentMethod $method, string $idempotencyKey): Order
    {
        try {
            return DB::transaction(function () use ($customer, $method, $idempotencyKey): Order {
                $existing = Order::query()->where('idempotency_key', $idempotencyKey)->lockForUpdate()->first();

                if ($existing !== null) {
                    return $existing;
                }

                $cart = $this->carts->find();

                if ($cart === null || $cart->items()->count() === 0) {
                    throw ValidationException::withMessages([
                        'cart' => 'Your bag is empty.',
                    ]);
                }

                $cart->load('items.variant.product.brand', 'items.variant.product.images');
                $variantIds = $cart->items->pluck('product_variant_id')->all();
                $variants = ProductVariant::query()->whereIn('id', $variantIds)->lockForUpdate()->get()->keyBy('id');

                $subtotal = 0;
                /** @var array<int, ProductVariant> $lockedVariants */
                $lockedVariants = [];

                foreach ($cart->items as $item) {
                    $variant = $variants->get($item->product_variant_id);
                    $lockedVariants[$item->id] = $this->guardLine($item, $variant);
                    $subtotal += $lockedVariants[$item->id]->price_cents * $item->quantity;
                }

                $coupon = null;

                if ($cart->coupon_id !== null) {
                    $coupon = Coupon::query()->whereKey($cart->coupon_id)->lockForUpdate()->first();
                }

                $quote = $this->pricing->quote($subtotal, $coupon);

                if ($coupon !== null && $quote->couponError !== null) {
                    throw ValidationException::withMessages([
                        'coupon' => $quote->couponError,
                    ]);
                }

                $number = $this->nextNumber();
                $user = $customer['user'] ?? null;

                $order = Order::query()->create([
                    'number' => $number,
                    'idempotency_key' => $idempotencyKey,
                    'tracking_token' => Str::random(48),
                    'user_id' => $user instanceof User ? $user->id : null,
                    'coupon_id' => $quote->couponCode !== null ? $coupon?->id : null,
                    'email' => (string) $customer['email'],
                    'customer_name' => (string) $customer['name'],
                    'phone' => (string) $customer['phone'],
                    'status' => OrderStatus::Pending,
                    'payment_status' => $method === PaymentMethod::Cod ? PaymentStatus::Unpaid : PaymentStatus::Pending,
                    'payment_method' => $method,
                    'currency_code' => $this->settings->get('currency_code'),
                    'subtotal_cents' => $quote->subtotal,
                    'discount_cents' => $quote->discount,
                    'shipping_cents' => $quote->shipping,
                    'total_cents' => $quote->total,
                    'coupon_code' => $quote->couponCode,
                    'shipping_address' => $customer['address'],
                    'notes' => $customer['notes'] ?? null,
                    'placed_at' => now(),
                ]);

                foreach ($cart->items as $item) {
                    $variant = $lockedVariants[$item->id];
                    $product = $variant->product;
                    $image = $product->images->first();

                    OrderItem::query()->create([
                        'order_id' => $order->id,
                        'product_variant_id' => $variant->id,
                        'product_name' => $product->name,
                        'brand_name' => $product->brand->name,
                        'sku' => $variant->sku,
                        'concentration' => $variant->concentration->value,
                        'concentration_label' => $variant->concentration->label(),
                        'size_ml' => $variant->size_ml,
                        'unit_price_cents' => $variant->price_cents,
                        'quantity' => $item->quantity,
                        'line_total_cents' => $variant->price_cents * $item->quantity,
                        'image_path' => $image instanceof \App\Models\ProductImage ? $image->path : null,
                    ]);

                    $variant->decrement('stock', $item->quantity);
                }

                if ($coupon !== null && $quote->couponCode !== null) {
                    $coupon->increment('uses_count');
                }

                $cart->items()->delete();
                $cart->update(['coupon_id' => null]);

                return $order->load('items');
            });
        } catch (UniqueConstraintViolationException) {
            $order = Order::query()->where('idempotency_key', $idempotencyKey)->first();

            if ($order !== null) {
                return $order->load('items');
            }

            throw ValidationException::withMessages([
                'cart' => 'We could not place that order. Please try again.',
            ]);
        }
    }

    private function guardLine(CartItem $item, ?ProductVariant $variant): ProductVariant
    {
        if ($variant === null || ! $variant->is_active || ! $variant->product->is_active) {
            throw ValidationException::withMessages([
                'cart' => 'A bottle in your bag is no longer available.',
            ]);
        }

        if ($variant->stock < $item->quantity) {
            $name = $variant->product->name;

            throw ValidationException::withMessages([
                'cart' => "{$name} ({$variant->label()}) only has {$variant->stock} left.",
            ]);
        }

        return $variant;
    }

    private function nextNumber(): string
    {
        do {
            $number = 'AR-'.now()->format('ymd').'-'.strtoupper(Str::random(5));
        } while (Order::query()->where('number', $number)->exists());

        return $number;
    }
}
