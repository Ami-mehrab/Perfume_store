<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $number
 * @property string $idempotency_key
 * @property string $tracking_token
 * @property int|null $user_id
 * @property int|null $coupon_id
 * @property string $email
 * @property string $customer_name
 * @property string $phone
 * @property OrderStatus $status
 * @property PaymentStatus $payment_status
 * @property PaymentMethod $payment_method
 * @property string $currency_code
 * @property int $subtotal_cents
 * @property int $discount_cents
 * @property int $shipping_cents
 * @property int $total_cents
 * @property string|null $coupon_code
 * @property array<string, string|null> $shipping_address
 * @property string|null $notes
 * @property Carbon|null $stock_restored_at
 * @property Carbon $placed_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'number',
    'idempotency_key',
    'tracking_token',
    'user_id',
    'coupon_id',
    'email',
    'customer_name',
    'phone',
    'status',
    'payment_status',
    'payment_method',
    'currency_code',
    'subtotal_cents',
    'discount_cents',
    'shipping_cents',
    'total_cents',
    'coupon_code',
    'shipping_address',
    'notes',
    'stock_restored_at',
    'placed_at',
])]
class Order extends Model
{
    public function getRouteKeyName(): string
    {
        return 'tracking_token';
    }
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
            'payment_status' => PaymentStatus::class,
            'payment_method' => PaymentMethod::class,
            'shipping_address' => 'array',
            'subtotal_cents' => 'integer',
            'discount_cents' => 'integer',
            'shipping_cents' => 'integer',
            'total_cents' => 'integer',
            'stock_restored_at' => 'datetime',
            'placed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Coupon, $this>
     */
    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    /**
     * @return HasMany<OrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * @return HasMany<Payment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * @return HasMany<ReturnRequest, $this>
     */
    public function returns(): HasMany
    {
        return $this->hasMany(ReturnRequest::class);
    }

    /**
     * @return HasMany<Refund, $this>
     */
    public function refunds(): HasMany
    {
        return $this->hasMany(Refund::class);
    }

    public function restoreStock(): void
    {
        if ($this->stock_restored_at !== null) {
            return;
        }

        $this->loadMissing('items');

        foreach ($this->items as $item) {
            if ($item->product_variant_id === null) {
                continue;
            }

            ProductVariant::query()
                ->whereKey($item->product_variant_id)
                ->increment('stock', $item->quantity);
        }

        $this->forceFill(['stock_restored_at' => now()])->save();
    }

    /**
     * @return array<string, mixed>
     */
    public function toPublicArray(): array
    {
        return [
            'number' => $this->number,
            'tracking_token' => $this->tracking_token,
            'email' => $this->email,
            'customer_name' => $this->customer_name,
            'phone' => $this->phone,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'payment_status' => $this->payment_status->value,
            'payment_status_label' => $this->payment_status->label(),
            'payment_method' => $this->payment_method->value,
            'payment_method_label' => $this->payment_method->label(),
            'currency_code' => $this->currency_code,
            'subtotal_cents' => $this->subtotal_cents,
            'discount_cents' => $this->discount_cents,
            'shipping_cents' => $this->shipping_cents,
            'total_cents' => $this->total_cents,
            'coupon_code' => $this->coupon_code,
            'shipping_address' => $this->shipping_address,
            'notes' => $this->notes,
            'placed_at' => $this->placed_at->toIso8601String(),
            'items' => $this->items->map(fn (OrderItem $item): array => $item->toPublicArray())->values(),
            'can_request_return' => $this->status === OrderStatus::Delivered
                && $this->returns->where('status', '!=', \App\Enums\ReturnStatus::Rejected)->isEmpty(),
        ];
    }
}
