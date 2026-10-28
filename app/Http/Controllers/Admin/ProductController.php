<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Concentration;
use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\FragranceCollection;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Support\Money;
use App\Support\Slugs;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $brandSlug = $request->string('brand')->trim()->toString();
        $brand = $brandSlug !== ''
            ? Brand::query()->where('slug', $brandSlug)->first(['id', 'name', 'slug'])
            : null;

        $products = Product::query()
            ->with('brand')
            ->withSum('variants', 'stock')
            ->when($request->string('q')->trim()->toString(), function ($query, string $search): void {
                $query->where('name', 'like', '%'.addcslashes($search, '%_\\').'%');
            })
            ->when($brand !== null, fn ($query) => $query->where('brand_id', $brand->id))
            ->latest()
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('admin/products/index', [
            'products' => $products,
            'filters' => [
                'q' => $request->string('q')->toString(),
                'brand' => $brand?->slug ?? '',
            ],
            'brandFilter' => $brand ? [
                'name' => $brand->name,
                'slug' => $brand->slug,
            ] : null,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/products/form', [
            'product' => null,
            ...$this->options(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $product = DB::transaction(function () use ($request, $data): Product {
            $product = Product::query()->create($this->attributes($data));
            $this->syncVariants($product, $data['variants']);
            $this->storeImages($product, $request);

            return $product;
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Perfume created.']);

        return to_route('admin.products.edit', $product);
    }

    public function edit(Product $product): Response
    {
        $product->load('variants', 'images', 'brand', 'collection');

        return Inertia::render('admin/products/form', [
            'product' => [
                'id' => $product->id,
                'slug' => $product->slug,
                'name' => $product->name,
                'name_bn' => $product->name_bn,
                'brand_id' => $product->brand_id,
                'collection_id' => $product->collection_id,
                'description' => $product->description,
                'description_bn' => $product->description_bn,
                'story' => $product->story,
                'family' => $product->family,
                'gender' => $product->gender,
                'swatch' => $product->swatch,
                'top_notes' => implode(', ', $product->top_notes),
                'heart_notes' => implode(', ', $product->heart_notes),
                'base_notes' => implode(', ', $product->base_notes),
                'is_featured' => $product->is_featured,
                'is_active' => $product->is_active,
                'variants' => $product->variants->map(fn (ProductVariant $variant): array => [
                    'id' => $variant->id,
                    'concentration' => $variant->concentration->value,
                    'size_ml' => $variant->size_ml,
                    'sku' => $variant->sku,
                    'price' => Money::major($variant->price_cents),
                    'compare_at' => $variant->compare_at_cents !== null ? Money::major($variant->compare_at_cents) : '',
                    'reference' => $variant->reference_price_cents !== null ? Money::major($variant->reference_price_cents) : '',
                    'stock' => $variant->stock,
                    'is_active' => $variant->is_active,
                ]),
                'images' => $product->images->map(fn (ProductImage $image): array => [
                    'id' => $image->id,
                    'url' => $image->url(),
                    'alt' => $image->alt,
                ]),
            ],
            ...$this->options(),
        ]);
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        $data = $this->validated($request, $product);
        DB::transaction(function () use ($request, $product, $data): void {
            $product->update($this->attributes($data, $product));
            $this->syncVariants($product, $data['variants']);
            $this->storeImages($product, $request);

            foreach ((array) $request->input('remove_images', []) as $imageId) {
                $image = $product->images()->whereKey($imageId)->first();
                $image?->delete();
            }
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Perfume updated.']);

        return to_route('admin.products.edit', $product->fresh());
    }

    public function destroy(Product $product): RedirectResponse
    {
        $used = OrderItem::query()->whereIn('product_variant_id', $product->variants()->pluck('id'))->exists();

        if ($used) {
            $product->update(['is_active' => false]);
            Inertia::flash('toast', ['type' => 'success', 'message' => 'This perfume is on past orders, so it was hidden instead of deleted.']);

            return back();
        }

        $product->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Perfume deleted.']);

        return to_route('admin.products.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Product $product = null): array
    {
        $request->merge([
            'collection_id' => $request->input('collection_id') ?: null,
            'is_featured' => $request->boolean('is_featured'),
            'is_active' => $request->boolean('is_active'),
        ]);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'name_bn' => ['nullable', 'string', 'max:160'],
            'slug' => ['nullable', 'string', 'max:180'],
            'brand_id' => ['required', 'exists:brands,id'],
            'collection_id' => ['nullable', 'exists:collections,id'],
            'description' => ['required', 'string', 'max:5000'],
            'description_bn' => ['nullable', 'string', 'max:5000'],
            'story' => ['nullable', 'string', 'max:5000'],
            'family' => ['required', Rule::in(['floral', 'woody', 'amber', 'fresh', 'gourmand', 'chypre'])],
            'gender' => ['required', Rule::in(['feminine', 'masculine', 'unisex'])],
            'swatch' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'top_notes' => ['required', 'string', 'max:500'],
            'heart_notes' => ['required', 'string', 'max:500'],
            'base_notes' => ['required', 'string', 'max:500'],
            'is_featured' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'variants' => ['required', 'array', 'min:1'],
            'variants.*.id' => ['nullable', 'integer'],
            'variants.*.concentration' => ['required', Rule::enum(Concentration::class)],
            'variants.*.size_ml' => ['required', 'integer', 'min:1', 'max:500'],
            'variants.*.sku' => ['required', 'string', 'max:80', 'distinct'],
            'variants.*.price' => ['required', 'numeric', 'min:0'],
            'variants.*.compare_at' => ['nullable', 'numeric', 'min:0'],
            'variants.*.stock' => ['required', 'integer', 'min:0'],
            'variants.*.is_active' => ['nullable', 'boolean'],
            'images' => ['nullable', 'array'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'remove_images' => ['nullable', 'array'],
        ]);

        foreach ($data['variants'] as $variant) {
            $sku = $variant['sku'];
            $id = $variant['id'] ?? null;
            $exists = ProductVariant::query()
                ->where('sku', $sku)
                ->when($id, fn ($query) => $query->whereKeyNot($id))
                ->exists();

            if ($exists) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'variants' => "SKU {$sku} is already used.",
                ]);
            }
        }

        $data['slug'] = Slugs::unique(Product::class, $data['slug'] ?: $data['name'], $product?->id);

        return $data;
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function attributes(array $data, ?Product $product = null): array
    {
        return [
            'brand_id' => $data['brand_id'],
            'collection_id' => $data['collection_id'] ?: null,
            'name' => $data['name'],
            'name_bn' => $data['name_bn'] ?: null,
            'slug' => $data['slug'],
            'description' => $data['description'],
            'description_bn' => $data['description_bn'] ?: null,
            'story' => $data['story'] ?? null,
            'family' => $data['family'],
            'gender' => $data['gender'],
            'swatch' => $data['swatch'],
            'top_notes' => $this->notes($data['top_notes']),
            'heart_notes' => $this->notes($data['heart_notes']),
            'base_notes' => $this->notes($data['base_notes']),
            'is_featured' => (bool) ($data['is_featured'] ?? false),
            'is_active' => (bool) ($data['is_active'] ?? false),
            'sort_order' => $product->sort_order ?? 0,
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $variants
     */
    private function syncVariants(Product $product, array $variants): void
    {
        $kept = [];

        foreach ($variants as $variant) {
            $payload = [
                'concentration' => $variant['concentration'],
                'size_ml' => $variant['size_ml'],
                'sku' => $variant['sku'],
                'price_cents' => Money::toCents($variant['price']),
                'compare_at_cents' => ($variant['compare_at'] ?? '') === '' || $variant['compare_at'] === null
                    ? null
                    : Money::toCents($variant['compare_at']),
                'stock' => $variant['stock'],
                'is_active' => filter_var($variant['is_active'] ?? false, FILTER_VALIDATE_BOOL),
            ];

            if (! empty($variant['id'])) {
                $model = $product->variants()->whereKey($variant['id'])->firstOrFail();
                $model->update($payload);
            } else {
                $model = $product->variants()->create($payload);
            }

            $kept[] = $model->id;
        }

        $product->variants()->whereNotIn('id', $kept)->get()->each(function (ProductVariant $variant): void {
            if (OrderItem::query()->where('product_variant_id', $variant->id)->exists()) {
                $variant->update(['is_active' => false]);

                return;
            }

            $variant->delete();
        });
    }

    private function storeImages(Product $product, Request $request): void
    {
        foreach ((array) $request->file('images', []) as $index => $file) {
            if ($file === null) {
                continue;
            }

            $path = $file->store('products', 'public');
            $product->images()->create([
                'path' => $path,
                'alt' => $product->name,
                'sort_order' => $product->images()->count() + $index,
            ]);
        }
    }

    /**
     * @return array<int, string>
     */
    private function notes(string $value): array
    {
        return collect(preg_split('/[,|]/', $value) ?: [])
            ->map(fn (string $note): string => trim($note))
            ->filter()
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function options(): array
    {
        return [
            'brands' => Brand::query()->orderBy('name')->get(['id', 'name']),
            'collections' => FragranceCollection::query()->orderBy('name')->get(['id', 'name']),
            'families' => ['floral', 'woody', 'amber', 'fresh', 'gourmand', 'chypre'],
            'genders' => ['feminine', 'masculine', 'unisex'],
            'concentrations' => collect(Concentration::cases())->map(fn (Concentration $concentration): array => [
                'value' => $concentration->value,
                'label' => $concentration->label(),
            ]),
        ];
    }
}
