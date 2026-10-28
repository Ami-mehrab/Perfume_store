<?php

namespace App\Services;

use App\Models\Coupon;

class Pricing
{
    public function __construct(private readonly StoreSettings $settings) {}

    public function quote(int $subtotalCents, ?Coupon $coupon, ?string $zone = null): PriceQuote
    {
        $discount = 0;
        $code = null;
        $error = null;

        if ($coupon !== null) {
            $error = $coupon->rejectionReason($subtotalCents);

            if ($error === null) {
                $discount = $coupon->discountFor($subtotalCents);
                $code = $coupon->code;
            }
        }

        $merchandise = max(0, $subtotalCents - $discount);
        $resolved = $this->zone($zone);
        $shipping = $this->settings->cents($resolved === 'outside' ? 'shipping_outside_dhaka' : 'shipping_inside_dhaka');

        return new PriceQuote(
            subtotal: $subtotalCents,
            discount: $discount,
            shipping: $shipping,
            total: $merchandise + $shipping,
            couponCode: $code,
            couponError: $error,
            shippingZone: $resolved,
        );
    }

    private function zone(?string $zone): string
    {
        $value = $zone ?? session('shipping_zone');

        return $value === 'outside' ? 'outside' : 'inside';
    }
}
