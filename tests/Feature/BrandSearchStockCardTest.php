<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BrandSearchStockCardTest extends TestCase
{
    use RefreshDatabase;

    public function test_zero_stock_perfume_appears_in_brand_search_and_house_filter(): void
    {
        [$product, $brand] = $this->perfume(
            brandName: 'Chanel',
            productName: 'Bleu de Chanel',
            stock: 0,
            active: true,
            compareAtCents: 1000000,
            priceCents: 600000,
        );

        $this->get('/shop?q='.urlencode('Chanel'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/catalog')
                ->has('products.data', 1)
                ->where('products.data.0.slug', $product->slug)
                ->where('products.data.0.in_stock', false)
                ->where('products.data.0.discount_percent', 40));

        $this->get('/shop?q='.urlencode('Bleu de Chanel'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/catalog')
                ->has('products.data', 1)
                ->where('products.data.0.slug', $product->slug));

        $this->get('/shop?house='.$brand->slug)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/catalog')
                ->has('products.data', 1)
                ->where('products.data.0.slug', $product->slug)
                ->where('products.data.0.in_stock', false));
    }

    public function test_activating_hidden_brand_products_makes_them_searchable(): void
    {
        [$product] = $this->perfume(
            brandName: 'Versace',
            productName: 'Versace Eros',
            stock: 0,
            active: false,
        );

        $this->assertFalse($product->fresh()->is_active);

        // Same repair the activate-products migration applies on deploy.
        Product::query()
            ->whereHas('brand', fn ($query) => $query->where('is_active', true))
            ->where('is_active', false)
            ->update(['is_active' => true]);

        $this->assertTrue($product->fresh()->is_active);

        $this->get('/shop?q='.urlencode('Versace'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/catalog')
                ->has('products.data', 1)
                ->where('products.data.0.slug', $product->slug)
                ->where('products.data.0.in_stock', false));
    }

    /**
     * @return array{0: Product, 1: Brand}
     */
    private function perfume(
        string $brandName,
        string $productName,
        int $stock,
        bool $active,
        int $compareAtCents = 0,
        int $priceCents = 500000,
    ): array {
        $brand = Brand::query()->create([
            'name' => $brandName,
            'slug' => Str::slug($brandName).'-'.Str::lower(Str::random(4)),
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $product = Product::query()->create([
            'brand_id' => $brand->id,
            'name' => $productName,
            'slug' => Str::slug($productName).'-'.Str::lower(Str::random(4)),
            'description' => 'A test perfume.',
            'family' => 'woody',
            'gender' => 'unisex',
            'swatch' => '#6b3f2a',
            'top_notes' => ['Bergamot'],
            'heart_notes' => ['Cedar'],
            'base_notes' => ['Musk'],
            'is_featured' => false,
            'is_active' => $active,
            'sort_order' => 1,
        ]);

        $product->variants()->create([
            'concentration' => 'edp',
            'size_ml' => 100,
            'sku' => 'SKU-'.Str::upper(Str::random(6)),
            'price_cents' => $priceCents,
            'compare_at_cents' => $compareAtCents > 0 ? $compareAtCents : null,
            'stock' => $stock,
            'is_active' => true,
        ]);

        return [$product->fresh(['brand', 'variants']), $brand];
    }
}
