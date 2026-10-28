<?php

namespace App\Http\Controllers\Store;

use App\Enums\Concentration;
use App\Http\Controllers\Controller;
use App\Models\Banner;
use App\Models\Brand;
use App\Models\FragranceCollection;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\Review;
use App\Services\StoreSettings;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StorefrontController extends Controller
{
    public function __construct(private readonly StoreSettings $settings) {}

    public function home(): Response
    {
        $with = ['brand', 'collection', 'images', 'variants'];
        $active = Product::query()->active()->with($with);

        $best = (clone $active)->where('is_featured', true)->orderBy('sort_order')->limit(8)->get();

        if ($best->isEmpty()) {
            $best = (clone $active)->latest()->limit(8)->get();
        }

        return Inertia::render('store/home', [
            'featuredProducts' => $best->map->toCard(),
            'newArrivals' => (clone $active)->latest()->limit(8)->get()->map->toCard(),
            'trending' => (clone $active)->orderBy('sort_order')->limit(8)->get()->map->toCard(),
            'collections' => FragranceCollection::query()->where('is_active', true)->orderBy('sort_order')->get(['id', 'name', 'slug', 'description', 'swatch']),
            'banners' => Banner::query()
                ->where('kind', 'homepage')
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get()
                ->map->toPublicArray(),
            'promoBanners' => Banner::query()
                ->where('kind', 'promo')
                ->where('is_active', true)
                ->with([
                    'brand:id,name,slug,description',
                    'product:id,brand_id,name,slug,description',
                    'product.brand:id,name',
                    'product.images',
                    'product.variants',
                    'collection:id,slug,name,description',
                ])
                ->orderBy('sort_order')
                ->get()
                ->map->toPublicArray(),
            'seo' => $this->seo($this->settings->get('store_name'), $this->settings->get('meta_description')),
        ]);
    }

    public function shop(Request $request): Response
    {
        return $this->listing($request, __('store.shop_title'), __('store.shop_intro'));
    }

    public function brands(): Response
    {
        return Inertia::render('store/brands', [
            'brands' => Brand::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get(['id', 'name', 'slug', 'description', 'country']),
            'seo' => $this->seo(
                app()->getLocale() === 'bn' ? 'ব্র্যান্ড' : 'Brands',
                $this->settings->get('meta_description'),
            ),
        ]);
    }

    public function brand(Request $request, Brand $brand): Response
    {
        abort_unless($brand->is_active, 404);

        return $this->listing($request, $brand->name, $brand->description ?? '', $brand);
    }

    public function collection(Request $request, FragranceCollection $collection): Response
    {
        abort_unless($collection->is_active, 404);

        $name = app()->getLocale() === 'bn' && filled($collection->name_bn)
            ? $collection->name_bn
            : $collection->name;

        return $this->listing($request, $name, $collection->description ?? '', null, $collection);
    }

    public function product(Product $product): Response
    {
        abort_unless($product->is_active, 404);

        return Inertia::render('store/product', [
            'product' => function () use ($product): array {
                $product->load(['brand', 'collection', 'images', 'variants']);

                return $product->toDetail();
            },
            'reviews' => function () use ($product) {
                return Review::query()
                    ->approved()
                    ->where('product_id', $product->id)
                    ->with('user:id,name')
                    ->orderByDesc('is_featured')
                    ->latest()
                    ->get()
                    ->map->toPublicArray()
                    ->values();
            },
            'reviewSummary' => function () use ($product): array {
                $stats = Review::query()
                    ->approved()
                    ->where('product_id', $product->id)
                    ->selectRaw('count(*) as review_count, avg(rating) as rating_avg')
                    ->first();

                $count = (int) ($stats?->review_count ?? 0);
                $avg = $count > 0 ? round((float) $stats->rating_avg, 1) : null;

                return [
                    'count' => $count,
                    'average' => $avg,
                ];
            },
            'canReview' => function () use ($product): bool {
                $user = auth()->user();

                if ($user === null || ! $user->isCustomer()) {
                    return false;
                }

                return ! Review::query()
                    ->where('product_id', $product->id)
                    ->where('user_id', $user->id)
                    ->exists();
            },
            'related' => function () use ($product) {
                return Product::query()
                    ->active()
                    ->whereKeyNot($product->id)
                    ->where(function (Builder $query) use ($product): void {
                        $query->where('collection_id', $product->collection_id)
                            ->orWhere('family', $product->family);
                    })
                    ->with(['brand', 'collection', 'images', 'variants'])
                    ->limit(4)
                    ->get()
                    ->map->toCard();
            },
            'seo' => function () use ($product): array {
                $product->loadMissing('brand');

                return $this->seo($product->name.' by '.$product->brand->name, $product->description);
            },
            'jsonLd' => function () use ($product): array {
                $product->load(['brand', 'images', 'variants']);

                $payload = [
                    '@context' => 'https://schema.org',
                    '@type' => 'Product',
                    'name' => $product->name,
                    'description' => $product->description,
                    'brand' => $product->brand->name,
                    'image' => $product->images->map(fn (ProductImage $image): string => $image->url())->all(),
                    'offers' => $product->variants->map(fn (ProductVariant $variant): array => [
                        '@type' => 'Offer',
                        'sku' => $variant->sku,
                        'priceCurrency' => $this->settings->get('currency_code'),
                        'price' => number_format($variant->price_cents / 100, 2, '.', ''),
                        'availability' => ($variant->is_active && $variant->stock > 0)
                            ? 'https://schema.org/InStock'
                            : 'https://schema.org/OutOfStock',
                    ])->all(),
                ];

                $stats = Review::query()
                    ->approved()
                    ->where('product_id', $product->id)
                    ->selectRaw('count(*) as review_count, avg(rating) as rating_avg')
                    ->first();

                $count = (int) ($stats?->review_count ?? 0);

                if ($count > 0) {
                    $payload['aggregateRating'] = [
                        '@type' => 'AggregateRating',
                        'ratingValue' => round((float) $stats->rating_avg, 1),
                        'reviewCount' => $count,
                    ];
                }

                return $payload;
            },
        ]);
    }

    private function listing(
        Request $request,
        string $title,
        string $description,
        ?Brand $brand = null,
        ?FragranceCollection $collection = null,
    ): Response {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'family' => ['nullable', 'string', 'max:40'],
            'gender' => ['nullable', 'string', 'max:40'],
            'concentration' => ['nullable', 'string', 'max:40'],
            'min' => ['nullable', 'numeric', 'min:0'],
            'max' => ['nullable', 'numeric', 'min:0'],
            'sort' => ['nullable', 'in:newest,price_asc,price_desc,name'],
            'available' => ['nullable', 'boolean'],
            'house' => ['nullable', 'string', 'max:80'],
        ]);

        $query = Product::query()
            ->active()
            ->with(['brand', 'collection', 'images', 'variants']);

        if ($brand !== null) {
            $query->where('brand_id', $brand->id);
        }

        if ($collection !== null && in_array($collection->audience, ['masculine', 'feminine', 'unisex'], true)) {
            $query->where('gender', $collection->audience);
        } elseif ($collection !== null && $collection->audience !== 'all') {
            $query->where('collection_id', $collection->id);
        }

        if ($brand === null && ! empty($filters['house'])) {
            $query->whereHas('brand', fn (Builder $brandQuery) => $brandQuery->where('slug', $filters['house']));
        }

        $search = trim((string) ($filters['q'] ?? ''));

        if ($search !== '') {
            $tokens = preg_split('/\s+/u', $search, -1, PREG_SPLIT_NO_EMPTY) ?: [];
            // Ignore filler words so "Bleu de Chanel" / "Club de Nuit" still match brand + model.
            $stop = ['a', 'an', 'and', 'the', 'of', 'de', 'da', 'di', 'le', 'la', 'el', 'pour', 'for'];
            $tokens = array_values(array_filter(
                $tokens,
                fn (string $token): bool => mb_strlen($token) > 1 && ! in_array(mb_strtolower($token), $stop, true),
            ));

            if ($tokens === []) {
                $tokens = preg_split('/\s+/u', $search, -1, PREG_SPLIT_NO_EMPTY) ?: [];
            }

            foreach ($tokens as $token) {
                $like = '%'.addcslashes($token, '%_\\').'%';
                $query->where(function (Builder $inner) use ($like): void {
                    $inner->where('name', 'like', $like)
                        ->orWhere('name_bn', 'like', $like)
                        ->orWhere('description', 'like', $like)
                        ->orWhere('description_bn', 'like', $like)
                        ->orWhere('family', 'like', $like)
                        ->orWhere('top_notes', 'like', $like)
                        ->orWhere('heart_notes', 'like', $like)
                        ->orWhere('base_notes', 'like', $like)
                        ->orWhereHas('brand', function (Builder $brandQuery) use ($like): void {
                            $brandQuery->where('name', 'like', $like)
                                ->orWhere('slug', 'like', $like);
                        });
                });
            }
        }

        foreach (['family', 'gender'] as $column) {
            if (! empty($filters[$column])) {
                $query->where($column, $filters[$column]);
            }
        }

        if (! empty($filters['concentration'])) {
            $query->whereHas('variants', fn (Builder $variants) => $variants
                ->where('is_active', true)
                ->where('concentration', $filters['concentration']));
        }

        if (isset($filters['min']) && $filters['min'] !== '') {
            $query->whereHas('variants', fn (Builder $variants) => $variants->where('price_cents', '>=', (int) round(((float) $filters['min']) * 100)));
        }

        if (isset($filters['max']) && $filters['max'] !== '') {
            $query->whereHas('variants', fn (Builder $variants) => $variants->where('price_cents', '<=', (int) round(((float) $filters['max']) * 100)));
        }

        if ($request->boolean('available')) {
            $query->whereHas('variants', fn (Builder $variants) => $variants->where('is_active', true)->where('stock', '>', 0));
        }

        $sort = $filters['sort'] ?? 'newest';

        if ($sort === 'price_asc' || $sort === 'price_desc') {
            $query->withMin(['variants as min_price' => fn (Builder $variants) => $variants->where('is_active', true)], 'price_cents')
                ->orderBy('min_price', $sort === 'price_asc' ? 'asc' : 'desc');
        } elseif ($sort === 'name') {
            $query->orderBy('name');
        } else {
            $query->latest();
        }

        $products = $query->paginate(12)->withQueryString();
        $products->getCollection()->transform(fn (Product $product): array => $product->toCard());

        return Inertia::render('store/catalog', [
            'title' => $title,
            'introduction' => $description,
            'products' => $products,
            'filters' => [
                'q' => $search,
                'family' => $filters['family'] ?? '',
                'gender' => $filters['gender'] ?? '',
                'concentration' => $filters['concentration'] ?? '',
                'min' => $filters['min'] ?? '',
                'max' => $filters['max'] ?? '',
                'sort' => $sort,
                'available' => $request->boolean('available'),
                'brand' => $brand?->slug,
                'house' => $filters['house'] ?? '',
                'collection' => $collection?->slug,
            ],
            'options' => [
                'brands' => Brand::query()->where('is_active', true)->orderBy('name')->get(['name', 'slug']),
                'collections' => FragranceCollection::query()->where('is_active', true)->orderBy('name')->get(['name', 'slug']),
                'families' => ['floral', 'woody', 'amber', 'fresh', 'gourmand', 'chypre'],
                'genders' => ['feminine', 'masculine', 'unisex'],
                'concentrations' => collect(Concentration::cases())->map(fn (Concentration $concentration): array => [
                    'value' => $concentration->value,
                    'label' => $concentration->label(),
                ]),
            ],
            'seo' => $this->seo($title, $description !== '' ? $description : $this->settings->get('meta_description')),
        ]);
    }

    /**
     * @return array{title: string, description: string, canonical: string}
     */
    private function seo(string $title, string $description): array
    {
        return [
            'title' => $title,
            'description' => $description,
            'canonical' => url()->current(),
        ];
    }
}
