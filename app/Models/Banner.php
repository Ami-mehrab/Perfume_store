<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $kind
 * @property string|null $eyebrow
 * @property string $title
 * @property string|null $subtitle
 * @property string|null $image_path
 * @property string|null $link_url
 * @property string|null $placement
 * @property int|null $product_id
 * @property int|null $collection_id
 * @property int|null $brand_id
 * @property bool $is_active
 * @property int $sort_order
 */
#[Fillable([
    'kind',
    'eyebrow',
    'title',
    'subtitle',
    'image_path',
    'link_url',
    'placement',
    'product_id',
    'collection_id',
    'brand_id',
    'is_active',
    'sort_order',
])]
class Banner extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
            'product_id' => 'integer',
            'collection_id' => 'integer',
            'brand_id' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return BelongsTo<FragranceCollection, $this>
     */
    public function collection(): BelongsTo
    {
        return $this->belongsTo(FragranceCollection::class, 'collection_id');
    }

    /**
     * @return BelongsTo<Brand, $this>
     */
    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
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

    public function resolvedLinkUrl(): ?string
    {
        if ($this->kind === 'promo') {
            if ($this->brand_id && $this->relationLoaded('brand') && $this->brand) {
                return '/brands/'.$this->brand->slug;
            }

            if ($this->product_id && $this->relationLoaded('product') && $this->product) {
                return '/products/'.$this->product->slug;
            }

            if ($this->collection_id && $this->relationLoaded('collection') && $this->collection) {
                return '/collections/'.$this->collection->slug;
            }

            if ($this->brand_id) {
                $slug = Brand::query()->whereKey($this->brand_id)->value('slug');

                return $slug ? '/brands/'.$slug : '/brands';
            }

            if ($this->product_id) {
                $slug = Product::query()->whereKey($this->product_id)->value('slug');

                return $slug ? '/products/'.$slug : '/shop';
            }

            if ($this->collection_id) {
                $slug = FragranceCollection::query()->whereKey($this->collection_id)->value('slug');

                return $slug ? '/collections/'.$slug : '/shop';
            }
        }

        return $this->link_url ?: '/shop';
    }

    /**
     * @return array<string, mixed>
     */
    public function toPublicArray(): array
    {
        $eyebrow = $this->eyebrow;
        $title = $this->title;
        $subtitle = $this->subtitle;
        $image = $this->imageUrl();
        $priceCents = null;
        $cta = null;

        if ($this->kind === 'promo') {
            if ($this->relationLoaded('brand') && $this->brand) {
                $brand = $this->brand;
                $eyebrow = $eyebrow ?: 'Brand';
                $title = filled($title) ? $title : $brand->name;
                $subtitle = $subtitle ?: Str::limit((string) ($brand->description ?? ''), 90);
                $cta = 'Shop '.$brand->name;
            } elseif ($this->relationLoaded('product') && $this->product) {
                $product = $this->product;
                $eyebrow = $eyebrow ?: $product->brand?->name;
                $title = filled($title) ? $title : $product->name;
                $subtitle = $subtitle ?: Str::limit(strip_tags((string) $product->description), 90);
                $priceCents = $product->relationLoaded('variants')
                    ? ($product->variants->first(fn (ProductVariant $item): bool => $item->is_active && $item->stock > 0)
                        ?? $product->variants->first(fn (ProductVariant $item): bool => $item->is_active)
                        ?? $product->variants->first())?->price_cents
                    : null;

                if ($image === null && $product->relationLoaded('images')) {
                    $firstImage = $product->images->first();
                    $image = $firstImage instanceof ProductImage ? $firstImage->url() : null;
                }

                $cta = 'Shop now';
            } elseif ($this->relationLoaded('collection') && $this->collection) {
                $collection = $this->collection;
                $eyebrow = $eyebrow ?: 'Collection';
                $title = filled($title) ? $title : $collection->name;
                $subtitle = $subtitle ?: Str::limit((string) ($collection->description ?? ''), 90);
                $cta = 'Shop collection';
            }
        }

        return [
            'id' => $this->id,
            'eyebrow' => $eyebrow,
            'title' => $title,
            'subtitle' => $subtitle,
            'image' => $image,
            'link_url' => $this->resolvedLinkUrl(),
            'placement' => $this->placement,
            'price_cents' => $priceCents,
            'cta' => $cta,
        ];
    }
}
