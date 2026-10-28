<?php

namespace App\Models;

use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $order_id
 * @property string $gateway
 * @property string|null $transaction_id
 * @property string|null $validation_id
 * @property int $amount_cents
 * @property PaymentStatus $status
 * @property array<string, mixed>|null $payload
 * @property Carbon|null $processed_at
 */
#[Fillable([
    'order_id',
    'gateway',
    'transaction_id',
    'validation_id',
    'amount_cents',
    'status',
    'payload',
    'processed_at',
])]
class Payment extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount_cents' => 'integer',
            'status' => PaymentStatus::class,
            'payload' => 'array',
            'processed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Order, $this>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
