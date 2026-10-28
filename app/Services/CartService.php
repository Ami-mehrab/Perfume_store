<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Coupon;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class CartService
{
    private bool $lookedUp = false;

    private ?Cart $cached = null;

    /** @var array<string, mixed>|null */
    private ?array $cachedPayload = null;

    public function __construct(private readonly Pricing $pricing) {}

    public function find(): ?Cart
    {
        if ($this->lookedUp) {
            return $this->cached;
        }

        $this->lookedUp = true;
        $userId = Auth::id();

        if ($userId) {
            return $this->cached = Cart::query()->where('user_id', $userId)->first();
        }

        $cartId = session('cart_id');

        if (! is_numeric($cartId)) {
            return $this->cached = null;
        }

        return $this->cached = Cart::query()->whereKey((int) $cartId)->whereNull('user_id')->first();
    }

    public function current(): Cart
    {
        $existing = $this->find();

        if ($existing !== null) {
            return $existing;
        }

        $userId = Auth::id();
        $cart = Cart::query()->create([
            'user_id' => $userId ? (int) $userId : null,
        ]);

        if (! $userId) {
            session(['cart_id' => $cart->id]);
        }

        $this->lookedUp = true;
        $this->cached = $cart;
        $this->cachedPayload = null;

        return $cart;
    }

    public function count(): int
    {
        $cart = $this->find();

        if ($cart === null) {
            return 0;
        }

        return (int) $cart->items()->sum('quantity');
    }

    public function add(ProductVariant $variant, int $quantity): void
    {
        $this->assertPurchasable($variant, $quantity);

        $cart = $this->current();
        $this->cachedPayload = null;
        $item = $cart->items()->where('product_variant_id', $variant->id)->first();
        $next = ($item->quantity ?? 0) + $quantity;
        $this->assertPurchasable($variant, $next);

        if ($item === null) {
            $cart->items()->create([
                'product_variant_id' => $variant->id,
                'quantity' => $quantity,
            ]);

            return;
        }

        $item->update(['quantity' => $next]);
    }

    public function update(CartItem $item, int $quantity): void
    {
        $cart = $this->find();

        if ($cart === null || $item->cart_id !== $cart->id) {
            abort(404);
        }

        $variant = $item->variant;

        if ($variant === null) {
            $item->delete();

            return;
        }

        $this->assertPurchasable($variant, $quantity);
        $item->update(['quantity' => $quantity]);
        $this->cachedPayload = null;
    }

    public function remove(CartItem $item): void
    {
        $cart = $this->find();

        if ($cart === null || $item->cart_id !== $cart->id) {
            abort(404);
        }

        $item->delete();
        $this->cachedPayload = null;
    }

    public function applyCoupon(string $code): void
    {
        $cart = $this->current();
        $coupon = Coupon::query()->whereRaw('upper(code) = ?', [strtoupper(trim($code))])->first();

        if ($coupon === null) {
            throw ValidationException::withMessages([
                'coupon' => 'We could not find that coupon.',
            ]);
        }

        $cart->load('items.variant');
        $subtotal = $this->subtotal($cart);
        $reason = $coupon->rejectionReason($subtotal);

        if ($reason !== null) {
            throw ValidationException::withMessages([
                'coupon' => $reason,
            ]);
        }

        $cart->update(['coupon_id' => $coupon->id]);
        $this->cachedPayload = null;
    }

    public function removeCoupon(): void
    {
        $this->find()?->update(['coupon_id' => null]);
        $this->cachedPayload = null;
    }

    public function refresh(): void
    {
        $this->cachedPayload = null;
    }

    public function subtotal(Cart $cart): int
    {
        return (int) $cart->items->sum(function (CartItem $item): int {
            return $item->variant->price_cents * $item->quantity;
        });
    }

    public function quote(Cart $cart): PriceQuote
    {
        $cart->loadMissing('coupon', 'items.variant');

        return $this->pricing->quote($this->subtotal($cart), $cart->coupon);
    }

    /**
     * @return array<string, mixed>
     */
    public function payload(): array
    {
        if ($this->cachedPayload !== null) {
            return $this->cachedPayload;
        }

        return $this->cachedPayload = $this->buildPayload();
    }

    /**
     * @return array<string, mixed>
     */
    private function buildPayload(): array
    {
        $cart = $this->find();

        if ($cart === null) {
            return [
                'items' => [],
                'quote' => $this->pricing->quote(0, null)->toArray(),
            ];
        }

        $cart->load([
            'coupon',
            'items.variant.product.brand',
            'items.variant.product.images',
        ]);

        $items = $cart->items->map(function (CartItem $item): array {
            $variant = $item->variant;
            $product = $variant->product;
            $image = $product->images->first();

            return [
                'id' => $item->id,
                'quantity' => $item->quantity,
                'variant_id' => $variant->id,
                'sku' => $variant->sku,
                'label' => $variant->label(),
                'unit_price_cents' => $variant->price_cents,
                'line_total_cents' => $variant->price_cents * $item->quantity,
                'stock' => $variant->stock,
                'available' => $variant->is_active && $product->is_active,
                'product_name' => $product->name,
                'product_name_bn' => $product->name_bn,
                'size_ml' => $variant->size_ml,
                'product_slug' => $product->slug,
                'brand' => $product->brand->name,
                'swatch' => $product->swatch,
                'image' => $image instanceof ProductImage ? $image->url() : null,
                'image_alt' => $image instanceof ProductImage ? $image->alt : $product->name,
            ];
        })->values();

        return [
            'items' => $items,
            'quote' => $this->quote($cart)->toArray(),
        ];
    }

    public function mergeForUser(User $user): void
    {
        $guestId = session('cart_id');

        if (! is_numeric($guestId)) {
            return;
        }

        $guest = Cart::query()->whereKey((int) $guestId)->whereNull('user_id')->first();

        if ($guest === null) {
            session()->forget('cart_id');

            return;
        }

        $userCart = Cart::query()->firstOrCreate(['user_id' => $user->id]);
        $guest->load('items');

        foreach ($guest->items as $item) {
            $existing = $userCart->items()->where('product_variant_id', $item->product_variant_id)->first();
            $variant = ProductVariant::query()->find($item->product_variant_id);

            if ($variant === null) {
                continue;
            }

            $quantity = min($variant->stock, ($existing->quantity ?? 0) + $item->quantity);
            $quantity = min($quantity, (int) app(StoreSettings::class)->get('max_qty_per_line'));

            if ($quantity < 1) {
                continue;
            }

            if ($existing === null) {
                $userCart->items()->create([
                    'product_variant_id' => $variant->id,
                    'quantity' => $quantity,
                ]);
            } else {
                $existing->update(['quantity' => $quantity]);
            }
        }

        if ($userCart->coupon_id === null && $guest->coupon_id !== null) {
            $userCart->update(['coupon_id' => $guest->coupon_id]);
        }

        $guest->delete();
        session()->forget('cart_id');
    }

    private function assertPurchasable(ProductVariant $variant, int $quantity): void
    {
        $variant->loadMissing('product');
        $max = (int) app(StoreSettings::class)->get('max_qty_per_line');

        if ($quantity < 1 || $quantity > $max) {
            throw ValidationException::withMessages([
                'quantity' => __('store.qty_range', ['max' => $max]),
            ]);
        }

        if (! $variant->is_active || ! $variant->product->is_active) {
            throw ValidationException::withMessages([
                'quantity' => __('store.unavailable'),
            ]);
        }

        if ($variant->stock < $quantity) {
            throw ValidationException::withMessages([
                'quantity' => $variant->stock < 1
                    ? __('store.out')
                    : __('store.only', ['stock' => $variant->stock]),
            ]);
        }
    }
}
