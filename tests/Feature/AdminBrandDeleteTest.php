<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminBrandDeleteTest extends TestCase
{
    use RefreshDatabase;

    public function test_empty_brand_can_be_deleted(): void
    {
        $admin = User::factory()->admin()->create();
        $brand = Brand::query()->create([
            'name' => 'Empty House',
            'slug' => 'empty-house',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $this->actingAs($admin)
            ->delete(route('admin.brands.destroy', $brand))
            ->assertRedirect();

        $this->assertDatabaseMissing('brands', ['id' => $brand->id]);
    }

    public function test_zero_stock_brand_and_perfumes_can_be_deleted(): void
    {
        $admin = User::factory()->admin()->create();
        $brand = Brand::query()->create([
            'name' => 'Zero Stock House',
            'slug' => 'zero-stock-house',
            'is_active' => true,
            'sort_order' => 1,
        ]);
        $product = Product::query()->create([
            'brand_id' => $brand->id,
            'name' => 'Quiet Mist',
            'slug' => 'quiet-mist',
            'description' => 'A soft trail.',
            'family' => 'floral',
            'gender' => 'unisex',
            'swatch' => '#9d174d',
            'top_notes' => [],
            'heart_notes' => [],
            'base_notes' => [],
            'is_featured' => false,
            'is_active' => true,
            'sort_order' => 1,
        ]);
        ProductVariant::query()->create([
            'product_id' => $product->id,
            'sku' => 'ZERO-EDP-50',
            'concentration' => 'edp',
            'size_ml' => 50,
            'price_cents' => 320000,
            'stock' => 0,
            'is_active' => true,
        ]);

        $this->actingAs($admin)
            ->delete(route('admin.brands.destroy', $brand))
            ->assertRedirect();

        $this->assertDatabaseMissing('brands', ['id' => $brand->id]);
        $this->assertDatabaseMissing('products', ['id' => $product->id]);
    }

    public function test_brand_with_stock_cannot_be_deleted(): void
    {
        $admin = User::factory()->admin()->create();
        $brand = Brand::query()->create([
            'name' => 'Stocked House',
            'slug' => 'stocked-house',
            'is_active' => true,
            'sort_order' => 1,
        ]);
        $product = Product::query()->create([
            'brand_id' => $brand->id,
            'name' => 'Full Bottle',
            'slug' => 'full-bottle',
            'description' => 'Still in stock.',
            'family' => 'floral',
            'gender' => 'unisex',
            'swatch' => '#9d174d',
            'top_notes' => [],
            'heart_notes' => [],
            'base_notes' => [],
            'is_featured' => false,
            'is_active' => true,
            'sort_order' => 1,
        ]);
        ProductVariant::query()->create([
            'product_id' => $product->id,
            'sku' => 'FULL-EDP-50',
            'concentration' => 'edp',
            'size_ml' => 50,
            'price_cents' => 320000,
            'stock' => 4,
            'is_active' => true,
        ]);

        $this->actingAs($admin)
            ->from(route('admin.brands.index'))
            ->delete(route('admin.brands.destroy', $brand))
            ->assertRedirect(route('admin.brands.index'));

        $this->assertDatabaseHas('brands', ['id' => $brand->id]);
        $this->assertDatabaseHas('products', ['id' => $product->id]);
    }

    public function test_collections_page_uses_collections_heading(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->get(route('admin.collections.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('admin/collections'));
    }
}
