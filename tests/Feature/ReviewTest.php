<?php

namespace Tests\Feature;

use App\Enums\ReviewStatus;
use App\Models\Brand;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ReviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_submit_pending_review(): void
    {
        $customer = User::factory()->create();
        $product = $this->perfume();

        $this->actingAs($customer)
            ->from(route('products.show', $product))
            ->post(route('products.reviews.store', $product), [
                'rating' => 5,
                'body' => 'Soft trail, lasts all evening.',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('reviews', [
            'product_id' => $product->id,
            'user_id' => $customer->id,
            'rating' => 5,
            'status' => ReviewStatus::Pending->value,
            'is_featured' => false,
        ]);
    }

    public function test_pending_reviews_stay_hidden_on_product_page(): void
    {
        $product = $this->perfume();
        $customer = User::factory()->create();

        Review::query()->create([
            'product_id' => $product->id,
            'user_id' => $customer->id,
            'rating' => 4,
            'body' => 'Waiting for staff approval.',
            'status' => ReviewStatus::Pending,
            'is_featured' => false,
        ]);

        $this->get(route('products.show', $product))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/product')
                ->where('reviewSummary.count', 0)
                ->where('reviewSummary.average', null)
                ->has('reviews', 0));
    }

    public function test_approved_reviews_show_rating_count_and_list(): void
    {
        $product = $this->perfume();
        $customer = User::factory()->create(['name' => 'Maya']);

        Review::query()->create([
            'product_id' => $product->id,
            'user_id' => $customer->id,
            'rating' => 5,
            'body' => 'Beautiful dry-down, worth featuring.',
            'status' => ReviewStatus::Approved,
            'is_featured' => true,
        ]);

        $this->get(route('products.show', $product))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/product')
                ->where('reviewSummary.count', 1)
                ->where('reviewSummary.average', 5)
                ->has('reviews', 1)
                ->where('reviews.0.author', 'Maya')
                ->where('reviews.0.is_featured', true));
    }

    public function test_admin_can_approve_feature_and_delete_reviews(): void
    {
        $admin = User::factory()->admin()->create();
        $product = $this->perfume();
        $customer = User::factory()->create();
        $review = Review::query()->create([
            'product_id' => $product->id,
            'user_id' => $customer->id,
            'rating' => 3,
            'body' => 'Nice but short lasting.',
            'status' => ReviewStatus::Pending,
            'is_featured' => false,
        ]);

        $this->actingAs($admin)
            ->get(route('admin.reviews.index'))
            ->assertOk();

        $this->actingAs($admin)
            ->patch(route('admin.reviews.update', $review), [
                'status' => ReviewStatus::Approved->value,
                'is_featured' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('reviews', [
            'id' => $review->id,
            'status' => ReviewStatus::Approved->value,
            'is_featured' => true,
        ]);

        $this->actingAs($admin)
            ->delete(route('admin.reviews.destroy', $review))
            ->assertRedirect();

        $this->assertDatabaseMissing('reviews', ['id' => $review->id]);
    }

    public function test_inventory_page_is_available_again(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->get(route('admin.inventory.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('admin/inventory'));
    }

    private function perfume(): Product
    {
        $brand = Brand::query()->create([
            'name' => 'Maison Review',
            'slug' => 'maison-review',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        return Product::query()->create([
            'brand_id' => $brand->id,
            'name' => 'Review Mist',
            'slug' => 'review-mist',
            'description' => 'A soft trail for testing.',
            'family' => 'floral',
            'gender' => 'unisex',
            'swatch' => '#9d174d',
            'top_notes' => ['Bergamot'],
            'heart_notes' => ['Rose'],
            'base_notes' => ['Musk'],
            'is_featured' => false,
            'is_active' => true,
            'sort_order' => 1,
        ]);
    }
}
