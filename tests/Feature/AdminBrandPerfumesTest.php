<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminBrandPerfumesTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_open_perfumes_filtered_by_brand(): void
    {
        $admin = User::factory()->admin()->create();
        $dior = Brand::query()->create([
            'name' => 'Dior',
            'slug' => 'dior-'.Str::lower(Str::random(4)),
            'is_active' => true,
            'sort_order' => 1,
        ]);
        $chanel = Brand::query()->create([
            'name' => 'Chanel',
            'slug' => 'chanel-'.Str::lower(Str::random(4)),
            'is_active' => true,
            'sort_order' => 2,
        ]);

        $sauvage = Product::query()->create([
            'brand_id' => $dior->id,
            'name' => 'Sauvage',
            'slug' => 'sauvage-'.Str::lower(Str::random(4)),
            'description' => 'Woody.',
            'family' => 'woody',
            'gender' => 'masculine',
            'swatch' => '#1f2937',
            'top_notes' => ['Bergamot'],
            'heart_notes' => ['Pepper'],
            'base_notes' => ['Ambroxan'],
            'is_active' => true,
            'sort_order' => 1,
        ]);
        Product::query()->create([
            'brand_id' => $chanel->id,
            'name' => 'Bleu de Chanel',
            'slug' => 'bleu-'.Str::lower(Str::random(4)),
            'description' => 'Fresh.',
            'family' => 'fresh',
            'gender' => 'masculine',
            'swatch' => '#1e3a5f',
            'top_notes' => ['Citrus'],
            'heart_notes' => ['Ginger'],
            'base_notes' => ['Cedar'],
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $this->actingAs($admin)
            ->get(route('admin.products.index', ['brand' => $dior->slug]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/products/index')
                ->has('products.data', 1)
                ->where('products.data.0.slug', $sauvage->slug)
                ->where('brandFilter.slug', $dior->slug)
                ->where('brandFilter.name', 'Dior'));
    }
}
