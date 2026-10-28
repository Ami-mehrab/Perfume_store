<?php

namespace App\Models;

use App\Enums\Concentration;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $product_id
 * @property Concentration $concentration
 * @property int $size_ml
 * @property string $sku
 * @property int $price_cents
 * @property int|null $compare_at_cents
 * @property int|null $reference_price_cents
 * @property int $stock
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'product_id',
    'concentration',
    'size_ml',
    'sku',
    'price_cents',
    'compare_at_cents',
    'reference_price_cents',
    'stock',
    'is_active',
])]
class ProductVariant extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'concentration' => Concentration::class,
            'size_ml' => 'integer',
            'price_cents' => 'integer',
            'compare_at_cents' => 'integer',
            'reference_price_cents' => 'integer',
            'stock' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function label(): string
    {
        return $this->concentration->label().' · '.$this->size_ml.' ml';
    }

    /**
     * @return array<string, mixed>
     */
    public function toStoreArray(): array
    {
        return [
            'id' => $this->id,
            'concentration' => $this->concentration->value,
            'concentration_label' => $this->concentration->label(),
            'size_ml' => $this->size_ml,
            'sku' => $this->sku,
            'price_cents' => $this->price_cents,
            'compare_at_cents' => $this->compare_at_cents,
            'stock' => $this->stock,
            'is_active' => $this->is_active,
            'in_stock' => $this->is_active && $this->stock > 0,
            'label' => $this->label(),
        ];
    }
}
