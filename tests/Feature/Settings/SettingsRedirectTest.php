<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsRedirectTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_settings_urls_stay_on_account_panel(): void
    {
        $customer = User::factory()->create();

        $this->actingAs($customer)
            ->get('/settings/profile')
            ->assertRedirect(route('account.index'));

        $this->actingAs($customer)
            ->get('/settings/security')
            ->assertRedirect(route('account.index'));
    }

    public function test_admin_settings_urls_go_to_admin_store_settings(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->get('/settings/profile')
            ->assertRedirect(route('admin.settings.edit'));
    }

    public function test_customer_account_nav_targets_never_hit_admin(): void
    {
        $customer = User::factory()->create();

        foreach (['/customer-account', '/customer-account/orders', '/customer-account/addresses', '/wishlist', '/orders/track'] as $path) {
            $this->actingAs($customer)
                ->get($path)
                ->assertOk();
        }
    }

    public function test_panels_never_cross(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create();

        $this->actingAs($admin)
            ->get('/customer-account')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('account/index')
                ->where('guest', true));
        $this->assertGuest();

        $admin = User::factory()->admin()->create([
            'email' => 'admin-panel@example.com',
        ]);
        $this->actingAs($admin)->get('/admin')->assertOk();
        $this->actingAs($customer)->get('/admin')->assertRedirect(route('account.index'));
        $this->actingAs($customer)->get('/customer-account')->assertOk();
    }
}