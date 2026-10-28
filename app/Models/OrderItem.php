<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property int $order_id
 * @property int|null $product_variant_id
 * @property string $product_name
 * @property string|null $brand_name
 * @property string $sku
 * @property string $concentration
 * @property string $concentration_label
 * @property int $size_ml
 * @property int $unit_price_cents
 * @property int $quantity
 * @property int $line_total_cents
 * @property string|null $image_path
 */
#[Fillable([
    'order_id',
    'product_variant_id',
    'product_name',
    'brand_name',
    'sku',
    'concentration',
    'concentration_label',
    'size_ml',
    'unit_price_cents',
    'quantity',
    'line_total_cents',
    'image_path',
])]
class OrderItem extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'size_ml' => 'integer',
            'unit_price_cents' => 'integer',
            'quantity' => 'integer',
            'line_total_cents' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Order, $this>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function imageUrl(): ?string
    {
        if ($this->image_path === null || $this->image_path === '') {
            return null;
        }

        if (str_starts_with($this->image_path, 'http://') || str_starts_with($this->image_path, 'https://') || str_starts_with($this->image_path, '/')) {
            return $this->image_path;
        }

        return Storage::disk('public')->url($this->image_path);
    }

    /**
     * @return array<string, mixed>
     */
    public function toPublicArray(): array
    {
        return [
            'product_name' => $this->product_name,
            'brand_name' => $this->brand_name,
            'sku' => $this->sku,
            'concentration' => $this->concentration,
            'concentration_label' => $this->concentration_label,
            'size_ml' => $this->size_ml,
            'unit_price_cents' => $this->unit_price_cents,
            'quantity' => $this->quantity,
            'line_total_cents' => $this->line_total_cents,
            'image' => $this->imageUrl(),
        ];
    }
}
