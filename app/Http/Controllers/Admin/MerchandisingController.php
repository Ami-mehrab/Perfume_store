<?php

namespace App\Http\Controllers\Admin;

use App\Enums\CouponType;
use App\Http\Controllers\Controller;
use App\Models\Banner;
use App\Models\Brand;
use App\Models\Coupon;
use App\Models\FragranceCollection;
use App\Models\OrderItem;
use App\Models\Product;
use App\Support\Money;
use App\Support\Slugs;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MerchandisingController extends Controller
{
    public function brands(): Response
    {
        return Inertia::render('admin/brands', [
            'brands' => Brand::query()->withCount('products')->orderBy('sort_order')->get(),
        ]);
    }

    public function storeBrand(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
            'country' => ['nullable', 'string', 'max:80'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        Brand::query()->create([
            ...$data,
            'slug' => Slugs::unique(Brand::class, $data['name']),
            'is_active' => $request->boolean('is_active'),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Brand saved.']);

        return back();
    }

    public function updateBrand(Request $request, Brand $brand): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
            'country' => ['nullable', 'string', 'max:80'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $brand->update([
            ...$data,
            'slug' => Slugs::unique(Brand::class, $data['name'], $brand->id),
            'is_active' => $request->boolean('is_active'),
        ]);

        return back();
    }

    public function destroyBrand(Brand $brand): RedirectResponse
    {
        $products = $brand->products()->with('variants:id,product_id,stock')->get();
        $stock = (int) $products->sum(fn ($product): int => (int) $product->variants->sum('stock'));

        // Empty brands, or brands whose bottles are all at 0 stock, can be removed.
        if ($stock > 0) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'This brand still has bottles in stock. Set stock to 0 on those perfumes first, or delete the perfumes.',
            ]);

            return back();
        }

        $variantIds = $products->flatMap(fn ($product) => $product->variants->pluck('id'))->all();

        if ($variantIds !== [] && OrderItem::query()->whereIn('product_variant_id', $variantIds)->exists()) {
            foreach ($products as $product) {
                $product->update(['is_active' => false]);
            }

            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Some perfumes are on past orders, so they were hidden instead. Delete unused perfumes from Perfumes, then delete the brand.',
            ]);

            return back();
        }

        DB::transaction(function () use ($brand, $products): void {
            foreach ($products as $product) {
                $product->delete();
            }

            $brand->delete();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Brand deleted.']);

        return back();
    }

    public function collections(): Response
    {
        return Inertia::render('admin/collections', [
            'collections' => FragranceCollection::query()
                ->whereNotNull('audience')
                ->orderBy('sort_order')
                ->get()
                ->map(fn (FragranceCollection $section): array => [
                    'id' => $section->id,
                    'name' => $section->name,
                    'name_bn' => $section->name_bn,
                    'slug' => $section->slug,
                    'audience' => $section->audience,
                    'is_active' => $section->is_active,
                    'sort_order' => $section->sort_order,
                    'image' => $section->imageUrl(),
                ]),
        ]);
    }

    public function storeCollection(Request $request): RedirectResponse
    {
        $data = $this->collectionData($request);
        $section = FragranceCollection::query()->create([
            ...$data,
            'slug' => Slugs::unique(FragranceCollection::class, $data['name']),
        ]);
        $this->storeSectionImage($request, $section);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Collection saved.']);

        return back();
    }

    public function updateCollection(Request $request, FragranceCollection $collection): RedirectResponse
    {
        $data = $this->collectionData($request);
        $collection->update([
            ...$data,
            'slug' => Slugs::unique(FragranceCollection::class, $data['name'], $collection->id),
        ]);
        $this->storeSectionImage($request, $collection);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Collection updated.']);

        return back();
    }

    public function destroyCollection(FragranceCollection $collection): RedirectResponse
    {
        if ($collection->products()->exists()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'This collection still has perfumes. Move or delete those perfumes first.',
            ]);

            return back();
        }

        $collection->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Collection deleted.']);

        return back();
    }

    public function coupons(): Response
    {
        return Inertia::render('admin/coupons', [
            'coupons' => Coupon::query()->latest()->get(),
        ]);
    }

    public function storeCoupon(Request $request): RedirectResponse
    {
        Coupon::query()->create($this->couponData($request));
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Coupon saved.']);

        return back();
    }

    public function updateCoupon(Request $request, Coupon $coupon): RedirectResponse
    {
        $coupon->update($this->couponData($request, $coupon));

        return back();
    }

    public function destroyCoupon(Coupon $coupon): RedirectResponse
    {
        $coupon->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Coupon deleted.']);

        return back();
    }

    public function banners(): Response
    {
        $mapBanner = fn (Banner $banner): array => [
            'id' => $banner->id,
            'kind' => $banner->kind,
            'title' => $banner->title,
            'subtitle' => $banner->subtitle,
            'eyebrow' => $banner->eyebrow,
            'is_active' => $banner->is_active,
            'image' => $banner->imageUrl(),
            'placement' => $banner->placement,
            'product_id' => $banner->product_id,
            'collection_id' => $banner->collection_id,
            'brand_id' => $banner->brand_id,
            'link_url' => $banner->resolvedLinkUrl(),
        ];

        return Inertia::render('admin/banners', [
            'banners' => Banner::query()
                ->where('kind', 'homepage')
                ->orderBy('sort_order')
                ->get()
                ->map($mapBanner),
            'promoBanners' => Banner::query()
                ->where('kind', 'promo')
                ->with(['product:id,name', 'collection:id,name', 'brand:id,name'])
                ->orderBy('sort_order')
                ->get()
                ->map(fn (Banner $banner): array => [
                    ...$mapBanner($banner),
                    'product_name' => $banner->product?->name,
                    'collection_name' => $banner->collection?->name,
                    'brand_name' => $banner->brand?->name,
                ]),
            'products' => Product::query()->orderBy('name')->get(['id', 'name']),
            'collections' => FragranceCollection::query()->orderBy('name')->get(['id', 'name']),
            'brands' => Brand::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function storeBanner(Request $request): RedirectResponse
    {
        $data = $this->bannerData($request, requireImage: true);
        $banner = Banner::query()->create($data);
        $this->storeBannerImage($request, $banner);
        Inertia::flash('toast', [
            'type' => 'success',
            'message' => ($data['kind'] ?? 'homepage') === 'promo' ? 'Promotional banner saved.' : 'Banner saved.',
        ]);

        return back();
    }

    public function updateBanner(Request $request, Banner $banner): RedirectResponse
    {
        $banner->update($this->bannerData($request, requireImage: false, existing: $banner));
        $this->storeBannerImage($request, $banner);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Banner updated.']);

        return back();
    }

    public function destroyBanner(Banner $banner): RedirectResponse
    {
        $banner->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Banner deleted.']);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function collectionData(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'name_bn' => ['nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
            'audience' => ['required', 'in:masculine,feminine,unisex,all'],
            'swatch' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'is_featured' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        unset($data['image']);
        $data['is_featured'] = $request->boolean('is_featured');
        $data['is_active'] = $request->boolean('is_active');
        $data['sort_order'] = (int) ($data['sort_order'] ?? 0);

        return $data;
    }

    private function storeSectionImage(Request $request, FragranceCollection $section): void
    {
        if (! $request->hasFile('image')) {
            return;
        }

        $section->update([
            'image_path' => $request->file('image')->store('sections', 'public'),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function couponData(Request $request, ?Coupon $coupon = null): array
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:40', Rule::unique('coupons', 'code')->ignore($coupon)],
            'type' => ['required', Rule::enum(CouponType::class)],
            'value' => ['required', 'numeric', 'min:0'],
            'min_subtotal' => ['nullable', 'numeric', 'min:0'],
            'max_uses' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $type = CouponType::from($data['type']);

        return [
            'code' => strtoupper($data['code']),
            'type' => $type,
            'value' => $type === CouponType::Percent ? (int) $data['value'] : Money::toCents($data['value']),
            'min_subtotal_cents' => Money::toCents($data['min_subtotal'] ?? 0),
            'max_uses' => $data['max_uses'] ?? null,
            'starts_at' => $data['starts_at'] ?? null,
            'ends_at' => $data['ends_at'] ?? null,
            'is_active' => $request->boolean('is_active'),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function bannerData(Request $request, bool $requireImage = false, ?Banner $existing = null): array
    {
        $kind = $existing?->kind ?? $request->input('kind', 'homepage');

        $rules = [
            'kind' => ['nullable', 'in:homepage,promo'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'image' => [$requireImage ? 'required' : 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ];

        if ($kind === 'promo') {
            $rules['title'] = ['required', 'string', 'max:120'];
            $rules['subtitle'] = ['nullable', 'string', 'max:180'];
            $rules['eyebrow'] = ['nullable', 'string', 'max:60'];
            $rules['placement'] = ['nullable', 'in:best_sellers,trending'];
            $rules['link_type'] = ['required', 'in:brand,product,collection'];
            $rules['brand_id'] = ['nullable', 'required_if:link_type,brand', 'exists:brands,id'];
            $rules['product_id'] = ['nullable', 'required_if:link_type,product', 'exists:products,id'];
            $rules['collection_id'] = ['nullable', 'required_if:link_type,collection', 'exists:collections,id'];
        }

        $request->validate($rules);

        $fileName = $request->file('image')?->getClientOriginalName();
        $title = $kind === 'promo'
            ? (string) $request->input('title', $existing?->title ?: 'Promo')
            : ($fileName !== null && $fileName !== ''
                ? pathinfo($fileName, PATHINFO_FILENAME)
                : ($existing?->title ?: 'Banner'));

        $data = [
            'kind' => $kind === 'promo' ? 'promo' : 'homepage',
            'eyebrow' => $kind === 'promo' ? ($request->input('eyebrow') ?: null) : $existing?->eyebrow,
            'title' => $title,
            'subtitle' => $kind === 'promo' ? ($request->input('subtitle') ?: null) : $existing?->subtitle,
            'is_active' => $request->has('is_active') ? $request->boolean('is_active') : ($existing?->is_active ?? true),
            'sort_order' => (int) $request->input('sort_order', $existing?->sort_order ?? 0),
        ];

        if ($data['kind'] === 'promo') {
            $linkType = $request->input('link_type');
            $data['placement'] = $request->input('placement', 'trending') ?: 'trending';
            $data['link_url'] = null;
            $data['brand_id'] = $linkType === 'brand' ? (int) $request->input('brand_id') : null;
            $data['product_id'] = $linkType === 'product' ? (int) $request->input('product_id') : null;
            $data['collection_id'] = $linkType === 'collection' ? (int) $request->input('collection_id') : null;
        } else {
            $data['placement'] = null;
            $data['brand_id'] = null;
            $data['product_id'] = null;
            $data['collection_id'] = null;
            $data['link_url'] = $existing?->link_url ?: '/shop';
        }

        return $data;
    }

    private function storeBannerImage(Request $request, Banner $banner): void
    {
        if (! $request->hasFile('image')) {
            return;
        }

        $banner->update([
            'image_path' => $request->file('image')->store('banners', 'public'),
        ]);
    }
}
