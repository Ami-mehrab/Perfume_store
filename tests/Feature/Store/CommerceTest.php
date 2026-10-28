<?php

namespace Tests\Feature\Store;

use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Models\Brand;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use App\Enums\CouponType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class CommerceTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_never_grants_admin_access(): void
    {
        $this->post(route('register.store'), [
            'name' => 'A Shopper',
            'email' => 'shopper@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'admin',
        ]);

        $user = User::query()->where('email', 'shopper@example.com')->firstOrFail();
        $user->forceFill(['email_verified_at' => now()])->save();

        $this->assertSame(UserRole::Customer, $user->role);
        $this->actingAs($user)->get(route('admin.dashboard'))->assertRedirect(route('account.index'));
    }

    public function test_admin_can_open_the_atelier(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->get(route('admin.dashboard'))->assertOk();
    }

    public function test_checkout_uses_server_prices_and_prevents_overselling(): void
    {
        $variant = $this->variant(stock: 1, priceCents: 25000);

        $this->post(route('cart.store'), [
            'variant_id' => $variant->id,
            'quantity' => 2,
        ])->assertSessionHasErrors('quantity');

        $this->assertSame(0, Order::query()->count());

        $this->post(route('cart.store'), [
            'variant_id' => $variant->id,
            'quantity' => 1,
        ])->assertOk();

        $variant->update(['price_cents' => 30000]);

        $this->post(route('checkout.store'), $this->payload('cod'))->assertRedirect();

        $order = Order::query()->with('items')->firstOrFail();
        $this->assertSame(30000, $order->items->first()->unit_price_cents);
        $this->assertSame(30000, $order->subtotal_cents);
        $this->assertSame(PaymentStatus::Unpaid, $order->payment_status);
        $this->assertSame('pending', $order->status->value);
        $this->assertSame(0, $variant->fresh()->stock);

        $this->post(route('cart.store'), [
            'variant_id' => $variant->id,
            'quantity' => 1,
        ])->assertSessionHasErrors('quantity');
    }

    public function test_the_same_checkout_cannot_create_two_orders(): void
    {
        $variant = $this->variant(stock: 4, priceCents: 10000);
        $payload = $this->payload('cod');

        $this->post(route('cart.store'), [
            'variant_id' => $variant->id,
            'quantity' => 1,
        ]);

        $this->post(route('checkout.store'), $payload)->assertRedirect();
        $this->post(route('checkout.store'), $payload)->assertRedirect();

        $this->assertSame(1, Order::query()->count());
        $this->assertSame(3, $variant->fresh()->stock);
    }

    public function test_a_coupon_changes_the_server_total(): void
    {
        $variant = $this->variant(stock: 3, priceCents: 20000);
        Coupon::query()->create([
            'code' => 'WELCOME10',
            'type' => CouponType::Percent,
            'value' => 10,
            'min_subtotal_cents' => 0,
            'is_active' => true,
        ]);

        $this->post(route('cart.store'), [
            'variant_id' => $variant->id,
            'quantity' => 1,
        ]);
        $this->post(route('cart.coupon'), ['code' => 'welcome10'])->assertSessionHasNoErrors();
        $this->post(route('checkout.store'), $this->payload('cod'))->assertRedirect();

        $order = Order::query()->firstOrFail();

        $this->assertSame(2000, $order->discount_cents);
        $this->assertSame('WELCOME10', $order->coupon_code);
        $this->assertSame(20000 - 2000 + 8000, $order->total_cents);
    }

    public function test_quick_order_charges_the_selected_delivery_and_reduces_a_coupon(): void
    {
        $variant = $this->variant(stock: 1, priceCents: 760000);
        Coupon::query()->create([
            'code' => 'WELCOME10',
            'type' => CouponType::Percent,
            'value' => 10,
            'min_subtotal_cents' => 0,
            'is_active' => true,
        ]);

        $this->post(route('cart.store'), [
            'variant_id' => $variant->id,
            'quantity' => 1,
        ]);
        $this->post(route('cart.coupon'), ['code' => 'WELCOME10'])->assertSessionHasNoErrors();
        $this->post(route('checkout.store'), [
            'name' => 'Guest Shopper',
            'phone' => '01700000000',
            'line1' => 'House 12',
            'city' => 'Chattogram',
            'country' => 'Bangladesh',
            'notes' => 'Call on arrival',
            'payment_method' => 'cod',
            'shipping_zone' => 'outside',
            'idempotency_key' => '22222222-2222-4222-8222-222222222222',
        ])->assertRedirect();

        $order = Order::query()->firstOrFail();

        $this->assertSame(76000, $order->discount_cents);
        $this->assertSame(15000, $order->shipping_cents);
        $this->assertSame(760000 - 76000 + 15000, $order->total_cents);
        $this->assertSame(0, $variant->fresh()->stock);
    }

    public function test_an_out_of_stock_size_can_be_requested(): void
    {
        $variant = $this->variant(stock: 0, priceCents: 10000);

        $this->post(route('preorders.store'), [
            'product_id' => $variant->product_id,
            'variant_id' => $variant->id,
            'name' => 'Guest Shopper',
            'phone' => '01711111111',
        ])->assertRedirect();

        $this->assertDatabaseHas('preorder_requests', [
            'product_variant_id' => $variant->id,
            'phone' => '01711111111',
            'size_ml' => 50,
            'status' => 'new',
        ]);

        $stocked = $this->variant(stock: 2, priceCents: 10000);
        $this->post(route('preorders.store'), [
            'product_id' => $stocked->product_id,
            'variant_id' => $stocked->id,
            'name' => 'Guest Shopper',
            'phone' => '01711111111',
        ])->assertSessionHasErrors('phone');
    }

    public function test_a_signed_in_customer_sees_the_order_but_cannot_cancel(): void
    {
        $customer = User::factory()->create();
        $variant = $this->variant(stock: 2, priceCents: 10000);

        $this->actingAs($customer)->post(route('cart.store'), [
            'variant_id' => $variant->id,
            'quantity' => 1,
        ]);
        $this->actingAs($customer)->post(route('checkout.store'), [
            ...$this->payload('cod'),
            'idempotency_key' => '33333333-3333-4333-8333-333333333333',
        ])->assertRedirect();

        $order = Order::query()->firstOrFail();
        $this->assertSame($customer->id, $order->user_id);

        $this->actingAs($customer)
            ->get(route('orders.confirmation', $order->tracking_token))
            ->assertOk()
            ->assertSee($order->number)
            ->assertDontSee('cancel', false);

        $this->actingAs($customer)
            ->get(route('account.orders.show', $order->number))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('account/order'));

        $this->assertSame('pending', $order->fresh()->status->value);
        $this->assertSame(1, $variant->fresh()->stock);
    }

    public function test_an_admin_can_delete_an_order_and_the_perfume(): void
    {
        $admin = User::factory()->admin()->create();
        $variant = $this->variant(stock: 2, priceCents: 5000);

        $this->post(route('cart.store'), [
            'variant_id' => $variant->id,
            'quantity' => 1,
        ]);
        $this->post(route('checkout.store'), [
            ...$this->payload('cod'),
            'idempotency_key' => '55555555-5555-4555-8555-555555555555',
        ])->assertRedirect();

        $order = Order::query()->firstOrFail();

        $this->actingAs($admin)
            ->delete(route('admin.orders.destroy', $order))
            ->assertRedirect(route('admin.orders.index'));

        $this->assertSame(0, Order::query()->count());
        $this->assertSame(2, $variant->fresh()->stock);

        $this->actingAs($admin)
            ->delete(route('admin.products.destroy', $variant->product))
            ->assertRedirect(route('admin.products.index'));

        $this->assertSame(0, Product::query()->count());
    }

    public function test_admin_order_detail_stays_under_admin_orders(): void
    {
        $admin = User::factory()->admin()->create();
        $variant = $this->variant(stock: 1, priceCents: 8000);
        $this->post(route('cart.store'), [
            'variant_id' => $variant->id,
            'quantity' => 1,
        ]);
        $this->post(route('checkout.store'), [
            ...$this->payload('cod'),
            'idempotency_key' => '44444444-4444-4444-8444-444444444444',
        ])->assertRedirect();

        $order = Order::query()->firstOrFail();

        $this->actingAs($admin)
            ->get('/admin/orders/'.$order->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('admin/orders/show'));

        // Public tracking URL remains on the storefront confirmation page.
        $this->get('/orders/'.$order->tracking_token)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('store/confirmation'));
    }

    public function test_card_payment_is_not_accepted(): void
    {
        $variant = $this->variant(stock: 2, priceCents: 15000);
        $this->post(route('cart.store'), ['variant_id' => $variant->id, 'quantity' => 1]);
        $this->post(route('checkout.store'), $this->payload('sslcommerz'))
            ->assertSessionHasErrors('payment_method');

        $this->assertSame(0, Order::query()->count());
        $this->assertSame(2, $variant->fresh()->stock);
    }

    public function test_online_checkout_without_credentials_does_not_take_stock(): void
    {
        $variant = $this->variant(stock: 2, priceCents: 9000);

        $this->post(route('cart.store'), ['variant_id' => $variant->id, 'quantity' => 1]);
        $this->post(route('checkout.store'), $this->payload('sslcommerz'))
            ->assertSessionHasErrors('payment_method');

        $this->assertSame(0, Order::query()->count());
        $this->assertSame(2, $variant->fresh()->stock);
    }

    public function test_order_tracking_requires_the_matching_email(): void
    {
        $variant = $this->variant(stock: 2, priceCents: 8000);
        $this->post(route('cart.store'), ['variant_id' => $variant->id, 'quantity' => 1]);
        $this->post(route('checkout.store'), $this->payload('cod'));
        $order = Order::query()->firstOrFail();

        $this->post(route('orders.track.store'), [
            'number' => $order->number,
            'email' => 'someone-else@example.com',
        ])->assertSessionHasErrors('number');

        $this->post(route('orders.track.store'), [
            'number' => strtolower($order->number),
            'email' => 'guest@example.com',
        ])->assertOk();
    }

    public function test_shop_search_finds_visible_perfumes_by_brand_and_name_tokens(): void
    {
        $brand = Brand::query()->create([
            'name' => 'Dior',
            'slug' => 'dior-'.Str::lower(Str::random(4)),
            'is_active' => true,
        ]);

        $visible = Product::query()->create([
            'brand_id' => $brand->id,
            'name' => 'Sauvage',
            'slug' => 'sauvage-'.Str::lower(Str::random(4)),
            'description' => 'A fresh woody scent.',
            'family' => 'fresh',
            'gender' => 'masculine',
            'swatch' => '#1f2937',
            'top_notes' => ['Bergamot'],
            'heart_notes' => ['Pepper'],
            'base_notes' => ['Ambroxan'],
            'is_active' => true,
        ]);

        $visible->variants()->create([
            'concentration' => 'edp',
            'size_ml' => 50,
            'sku' => 'SKU-'.Str::upper(Str::random(6)),
            'price_cents' => 500000,
            'stock' => 1,
            'is_active' => true,
        ]);

        $hidden = Product::query()->create([
            'brand_id' => $brand->id,
            'name' => 'Sauvage Elixir',
            'slug' => 'sauvage-elixir-'.Str::lower(Str::random(4)),
            'description' => 'Hidden draft.',
            'family' => 'fresh',
            'gender' => 'masculine',
            'swatch' => '#111827',
            'top_notes' => ['Spice'],
            'heart_notes' => ['Lavender'],
            'base_notes' => ['Licorice'],
            'is_active' => false,
        ]);

        $hidden->variants()->create([
            'concentration' => 'edp',
            'size_ml' => 60,
            'sku' => 'SKU-'.Str::upper(Str::random(6)),
            'price_cents' => 700000,
            'stock' => 5,
            'is_active' => true,
        ]);

        $this->get('/shop?q='.urlencode('Dior Sauvage'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('store/catalog')
                ->has('products.data', 1)
                ->where('products.data.0.slug', $visible->slug));
    }

    private function variant(int $stock, int $priceCents): ProductVariant
    {
        $brand = Brand::query()->create([
            'name' => 'Maison',
            'slug' => 'maison-'.Str::lower(Str::random(6)),
            'is_active' => true,
        ]);

        $product = Product::query()->create([
            'brand_id' => $brand->id,
            'name' => 'Noir Santal',
            'slug' => 'noir-'.Str::lower(Str::random(6)),
            'description' => 'A wood perfume.',
            'family' => 'woody',
            'gender' => 'unisex',
            'swatch' => '#6b3f2a',
            'top_notes' => ['Bergamot'],
            'heart_notes' => ['Sandalwood'],
            'base_notes' => ['Amber'],
            'is_active' => true,
        ]);

        return $product->variants()->create([
            'concentration' => 'edp',
            'size_ml' => 50,
            'sku' => 'SKU-'.Str::upper(Str::random(6)),
            'price_cents' => $priceCents,
            'stock' => $stock,
            'is_active' => true,
        ]);
    }

    /**
     * @return array<string, string>
     */
    private function payload(string $method): array
    {
        return [
            'name' => 'Guest Shopper',
            'email' => 'guest@example.com',
            'phone' => '01700000000',
            'line1' => 'House 12',
            'city' => 'Dhaka',
            'country' => 'Bangladesh',
            'payment_method' => $method,
            'idempotency_key' => '11111111-1111-4111-8111-111111111111',
        ];
    }
}
