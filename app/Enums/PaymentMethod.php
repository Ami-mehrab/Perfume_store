<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Cod = 'cod';
    case Sslcommerz = 'sslcommerz';

    public function label(): string
    {
        return match ($this) {
            self::Cod => 'Cash on delivery',
            self::Sslcommerz => 'Card or mobile banking',
        };
    }
}
