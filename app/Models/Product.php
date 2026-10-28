<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $brand_id
 * @property int|null $collection_id
 * @property string $name
 * @property string|null $name_bn
 * @property string $slug
 * @property string $description
 * @property string|null $description_bn
 * @property string|null $story
 * @property string $family
 * @property string $gender
 * @property string $swatch
 * @property array<int, string> $top_notes
 * @property array<int, string> $heart_notes
 * @property array<int, string> $base_notes
 * @property bool $is_featured
 * @property bool $is_active
 * @property int $sort_order
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'brand_id',
    'collection_id',
    'name',
    'name_bn',
    'slug',
    'description',
    'description_bn',
    'story',
    'family',
    'gender',
    'swatch',
    'top_notes',
    'heart_notes',
    'base_notes',
    'is_featured',
    'is_active',
    'sort_order',
])]
class Product extends Model
{
    public function getRouteKeyName(): string
    {
        return 'slug';
    }
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'top_notes' => 'array',
            'heart_notes' => 'array',
            'base_notes' => 'array',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * @param  Builder<Product>  $query
     * @return Builder<Product>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * @return BelongsTo<Brand, $this>
     */
    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    /**
     * @return BelongsTo<FragranceCollection, $this>
     */
    public function collection(): BelongsTo
    {
        return $this->belongsTo(FragranceCollection::class, 'collection_id');
    }

    /**
     * @return HasMany<ProductVariant, $this>
     */
    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class)->orderBy('price_cents');
    }

    /**
     * @return HasMany<ProductImage, $this>
     */
    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    /**
     * @return HasMany<Review, $this>
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function toCard(): array
    {
        $variant = $this->variants->first(fn (ProductVariant $item): bool => $item->is_active && $item->stock > 0)
            ?? $this->variants->first(fn (ProductVariant $item): bool => $item->is_active)
            ?? $this->variants->first();
        $image = $this->images->first();

        $discountPercent = null;
        foreach ($this->variants as $size) {
            $compare = $size->compare_at_cents;
            $price = $size->price_cents;

            if ($compare === null || $price <= 0 || $compare <= $price) {
                continue;
            }

            $percent = (int) round((($compare - $price) / $compare) * 100);

            if ($percent > 0) {
                $discountPercent = max($discountPercent ?? 0, $percent);
            }
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'name_bn' => $this->name_bn,
            'slug' => $this->slug,
            'swatch' => $this->swatch,
            'family' => $this->family,
            'gender' => $this->gender,
            'brand' => $this->brand?->name,
            'collection' => $this->collection?->name,
            'image' => $image instanceof ProductImage ? $image->url() : null,
            'image_alt' => $image instanceof ProductImage ? $image->alt : $this->name,
            'variant_id' => $variant?->id,
            'price_cents' => $variant?->price_cents,
            'compare_at_cents' => $variant?->compare_at_cents,
            'discount_percent' => $discountPercent,
            'in_stock' => $this->variants->contains(fn (ProductVariant $item): bool => $item->is_active && $item->stock > 0),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function toDetail(): array
    {
        return [
            ...$this->toCard(),
            'description' => $this->description,
            'description_bn' => $this->description_bn,
            'story' => $this->story,
            'top_notes' => $this->top_notes,
            'heart_notes' => $this->heart_notes,
            'base_notes' => $this->base_notes,
            'images' => $this->images->map(fn (ProductImage $image): array => [
                'id' => $image->id,
                'url' => $image->url(),
                'alt' => $image->alt,
            ])->values(),
            'variants' => $this->variants->map->toStoreArray()->values(),
        ];
    }
}
