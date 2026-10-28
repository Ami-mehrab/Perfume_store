<?php

namespace App\Models;

use App\Enums\CouponType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $code
 * @property CouponType $type
 * @property int $value
 * @property int $min_subtotal_cents
 * @property int|null $max_uses
 * @property int $uses_count
 * @property Carbon|null $starts_at
 * @property Carbon|null $ends_at
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'code',
    'type',
    'value',
    'min_subtotal_cents',
    'max_uses',
    'uses_count',
    'starts_at',
    'ends_at',
    'is_active',
])]
class Coupon extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => CouponType::class,
            'value' => 'integer',
            'min_subtotal_cents' => 'integer',
            'max_uses' => 'integer',
            'uses_count' => 'integer',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function rejectionReason(int $subtotalCents): ?string
    {
        if (! $this->is_active) {
            return 'This coupon is not active.';
        }

        if ($this->starts_at !== null && $this->starts_at->isFuture()) {
            return 'This coupon is not available yet.';
        }

        if ($this->ends_at !== null && $this->ends_at->isPast()) {
            return 'This coupon has expired.';
        }

        if ($this->max_uses !== null && $this->uses_count >= $this->max_uses) {
            return 'This coupon has reached its usage limit.';
        }

        if ($subtotalCents < $this->min_subtotal_cents) {
            return 'Add a little more to use this coupon.';
        }

        return null;
    }

    public function discountFor(int $subtotalCents): int
    {
        if ($this->type === CouponType::Percent) {
            return (int) round($subtotalCents * (min(100, $this->value) / 100));
        }

        return min($this->value, $subtotalCents);
    }
}
