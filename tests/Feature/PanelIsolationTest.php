<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PanelIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_login_stays_in_admin_and_nav_routes_work(): void
    {
        User::factory()->admin()->create([
            'email' => 'admin@example.com',
            'password' => 'password',
        ]);

        $this->post('/login', [
            'email' => 'admin@example.com',
            'password' => 'password',
        ])->assertRedirect(route('admin.dashboard', absolute: false));

        $this->assertAuthenticated();

        foreach (['/admin', '/admin/orders', '/admin/products', '/admin/brands', '/admin/settings'] as $path) {
            $this->get($path)->assertOk();
        }

        // Public customer entry must stay on the customer panel (guest sign-in).
        $this->get('/customer-account')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('account/index')
                ->where('guest', true));
        $this->assertGuest();

        $admin = User::factory()->admin()->create([
            'email' => 'admin2@example.com',
            'password' => 'password',
        ]);
        $this->actingAs($admin)->get('/customer-account/orders')->assertRedirect(route('account.index'));
        $this->assertGuest();
    }

    public function test_customer_login_stays_in_customer_panel(): void
    {
        User::factory()->create([
            'email' => 'shopper@example.com',
            'password' => 'password',
        ]);

        $this->post('/customer-account/login', [
            'email' => 'shopper@example.com',
            'password' => 'password',
        ])->assertRedirect(route('account.index'));

        $this->assertAuthenticated();

        $this->get('/customer-account')->assertOk();
        $this->get('/customer-account/orders')->assertOk();
        $this->get('/customer-account/addresses')->assertOk();
        $this->get('/admin')->assertRedirect(route('account.index'));
        $this->get('/admin/orders')->assertRedirect(route('account.index'));
    }

    public function test_guests_cannot_access_protected_panels(): void
    {
        $this->get('/admin')->assertRedirect(route('admin.login'));
        $this->get('/admin/orders')->assertRedirect(route('admin.login'));
        $this->get('/customer-account/orders')->assertRedirect(route('account.index'));
        $this->get('/customer-account/addresses')->assertRedirect(route('account.index'));
        $this->get('/')->assertOk();
        $this->get('/shop')->assertOk();
        $this->get('/customer-account')->assertOk();
    }

    public function test_public_and_customer_never_enter_admin_dashboard_via_guest_login_redirect(): void
    {
        $customer = User::factory()->create([
            'email' => 'shopper@example.com',
            'password' => 'password',
        ]);

        // Customer hitting Fortify /login (admin entry) while signed in stays on customer panel.
        $this->actingAs($customer)
            ->get('/login')
            ->assertRedirect(route('account.index'));
    }

    public function test_logout_clears_session_and_lands_on_storefront(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->post('/logout')
            ->assertRedirect('/');

        $this->assertGuest();
    }
}