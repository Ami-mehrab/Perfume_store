<?php

namespace App\Services;

class PriceQuote
{
    public function __construct(
        public readonly int $subtotal,
        public readonly int $discount,
        public readonly int $shipping,
        public readonly int $total,
        public readonly ?string $couponCode,
        public readonly ?string $couponError,
        public readonly string $shippingZone = 'inside',
    ) {}

    /**
     * @return array<string, int|string|null>
     */
    public function toArray(): array
    {
        return [
            'subtotal_cents' => $this->subtotal,
            'discount_cents' => $this->discount,
            'shipping_cents' => $this->shipping,
            'total_cents' => $this->total,
            'coupon_code' => $this->couponCode,
            'coupon_error' => $this->couponError,
            'shipping_zone' => $this->shippingZone,
        ];
    }
}
