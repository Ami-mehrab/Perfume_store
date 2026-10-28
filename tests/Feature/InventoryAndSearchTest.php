<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Illuminate\Support\Str;
use Tests\TestCase;

class InventoryAndSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_save_stock_and_hidden_perfume_becomes_visible(): void
    {
        $admin = User::factory()->admin()->create();
        [$product, $variant] = $this->perfume(stock: 0, active: false);

        $this->actingAs($admin)
            ->from(route('admin.inventory.index'))
            ->patch(route('admin.inventory.update', $variant), ['stock' => 8])
            ->assertRedirect();

        $this->assertDatabaseHas('product_variants', [
            'id' => $variant->id,
            'stock' => 8,
            'is_active' => true,
        ]);
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'is_active' => true,
        ]);
    }

    public function test_shop_search_finds_by_brand_or_model_name(): void
    {
        [$bleu] = $this->perfume(
            brandName: 'Chanel',
            productName: 'Bleu de Chanel',
            stock: 5,
            active: true,
        );
        [$eros] = $this->perfume(
            brandName: 'Versace',
            productName: 'Versace Eros',
            stock: 3,
            active: true,
        );

        $this->get('/shop?q='.urlencode('Bleu de Chanel'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/catalog')
                ->has('products.data', 1)
                ->where('products.data.0.slug', $bleu->slug));

        $this->get('/shop?q='.urlencode('Chanel'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/catalog')
                ->has('products.data', 1)
                ->where('products.data.0.slug', $bleu->slug));

        $this->get('/shop?q='.urlencode('Eros'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/catalog')
                ->has('products.data', 1)
                ->where('products.data.0.slug', $eros->slug));

        $this->get('/shop?q='.urlencode('Versace'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/catalog')
                ->has('products.data', 1)
                ->where('products.data.0.slug', $eros->slug));
    }

    public function test_inactive_perfume_stays_out_of_search_until_stocked(): void
    {
        [$product, $variant] = $this->perfume(
            brandName: 'Chanel',
            productName: 'Bleu de Chanel',
            stock: 0,
            active: false,
        );

        $this->get('/shop?q='.urlencode('Bleu de Chanel'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/catalog')
                ->has('products.data', 0));

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin)
            ->patch(route('admin.inventory.update', $variant), ['stock' => 4])
            ->assertRedirect();

        $this->get('/shop?q='.urlencode('Bleu de Chanel'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/catalog')
                ->has('products.data', 1)
                ->where('products.data.0.slug', $product->fresh()->slug));
    }

    public function test_inventory_lists_stock_and_stock_out_and_search_filters_by_brand(): void
    {
        $admin = User::factory()->admin()->create();
        [, $chanelVariant] = $this->perfume(
            brandName: 'Chanel',
            productName: 'Bleu de Chanel',
            stock: 0,
            active: true,
        );
        $this->perfume(
            brandName: 'Versace',
            productName: 'Versace Eros',
            stock: 5,
            active: true,
        );

        $this->actingAs($admin)
            ->get(route('admin.inventory.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/inventory')
                ->has('variants.data', 2)
                ->where('variants.total', 2));

        $this->actingAs($admin)
            ->get(route('admin.inventory.index', ['q' => 'Chanel']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/inventory')
                ->has('variants.data', 1)
                ->where('variants.data.0.id', $chanelVariant->id)
                ->where('variants.data.0.stock', 0)
                ->where('filters.q', 'Chanel'));
    }

    /**
     * @return array{0: Product, 1: ProductVariant}
     */
    private function perfume(
        string $brandName = 'Maison',
        string $productName = 'Test Mist',
        int $stock = 1,
        bool $active = true,
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

        $variant = $product->variants()->create([
            'concentration' => 'edp',
            'size_ml' => 100,
            'sku' => 'SKU-'.Str::upper(Str::random(6)),
            'price_cents' => 500000,
            'stock' => $stock,
            'is_active' => true,
        ]);

        return [$product, $variant];
    }
}
