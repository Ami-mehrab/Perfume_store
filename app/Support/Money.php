<?php

namespace App\Support;

final class Money
{
    public static function toCents(mixed $amount): int
    {
        if (! is_numeric($amount)) {
            return 0;
        }

        return (int) round(((float) $amount) * 100);
    }

    public static function major(int $cents): string
    {
        return number_format($cents / 100, 2, '.', '');
    }
}
