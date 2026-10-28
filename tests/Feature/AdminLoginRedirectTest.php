<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminLoginRedirectTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_login_lands_on_admin_dashboard(): void
    {
        User::factory()->admin()->create([
            'email' => 'boss@example.com',
            'password' => 'password',
        ]);

        $response = $this->post(route('login.store'), [
            'email' => 'boss@example.com',
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('admin.dashboard', absolute: false));
        $this->get(route('admin.dashboard'))->assertOk();
    }

    public function test_customer_admin_login_shows_generic_credentials_error(): void
    {
        User::factory()->create([
            'email' => 'shopper@example.com',
            'password' => 'password',
        ]);

        $this->from('/admin/login')
            ->post(route('login.store'), [
                'email' => 'shopper@example.com',
                'password' => 'password',
            ])
            ->assertRedirect('/admin/login')
            ->assertSessionHasErrors([
                'email' => __('auth.failed'),
            ]);

        $this->assertGuest();
    }

    public function test_admin_visiting_customer_sign_in_sees_guest_form_not_admin(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->get(route('account.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('account/index')
                ->where('guest', true));

        $this->assertGuest();
    }

    public function test_customer_sees_customer_panel(): void
    {
        $customer = User::factory()->create();

        $this->actingAs($customer)
            ->get(route('account.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('account/index')
                ->where('guest', false));
    }

    public function test_admin_can_open_admin_nav_routes_without_leaving_the_panel(): void
    {
        $admin = User::factory()->admin()->create();

        foreach (['admin.dashboard', 'admin.products.index', 'admin.brands.index', 'admin.orders.index', 'admin.settings.edit'] as $route) {
            $this->actingAs($admin)
                ->get(route($route))
                ->assertOk();
        }
    }

    public function test_admin_cannot_open_customer_account_pages(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->get(route('account.orders'))
            ->assertRedirect(route('account.index'));

        $this->assertGuest();

        $admin = User::factory()->admin()->create([
            'email' => 'boss2@example.com',
        ]);

        $this->actingAs($admin)
            ->get(route('account.addresses'))
            ->assertRedirect(route('account.index'));

        $this->assertGuest();
    }

    public function test_customer_visiting_admin_is_sent_to_customer_panel(): void
    {
        $customer = User::factory()->create();

        $this->actingAs($customer)
            ->get(route('admin.dashboard'))
            ->assertRedirect(route('account.index'));
    }

    public function test_guest_can_open_admin_login_pages(): void
    {
        $this->get('/login')->assertOk();
        $this->get('/admin/login')->assertOk();
    }

    public function test_customer_opening_admin_login_is_signed_out_and_sees_the_form(): void
    {
        $customer = User::factory()->create();

        $this->actingAs($customer)
            ->get('/admin/login')
            ->assertOk();

        $this->assertGuest();
    }

    public function test_customer_opening_fortify_login_stays_on_customer_panel(): void
    {
        $customer = User::factory()->create();

        $this->actingAs($customer)
            ->get('/login')
            ->assertRedirect(route('account.index'));

        $this->actingAs($customer)
            ->get('/admin/login')
            ->assertOk();

        $this->assertGuest();
    }

    public function test_admin_opening_login_goes_to_the_panel(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->get('/login')
            ->assertRedirect(route('admin.dashboard'));

        $this->actingAs($admin)
            ->get('/admin/login')
            ->assertRedirect(route('admin.dashboard'));
    }

    public function test_guest_customer_panel_stays_on_the_customer_end(): void
    {
        $this->get('/account')->assertRedirect('/customer-account');

        $this->get('/customer-account')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('account/index')
                ->where('guest', true));
    }

    public function test_signed_in_customer_sees_their_account_dashboard(): void
    {
        $customer = User::factory()->create(['name' => 'Mahrab Hossen']);

        $this->actingAs($customer)
            ->get('/customer-account')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('account/index')
                ->where('guest', false)
                ->where('auth.user.role', 'customer')
                ->where('auth.user.name', 'Mahrab Hossen'));
    }

    public function test_admin_session_on_storefront_exposes_admin_role_not_customer(): void
    {
        $admin = User::factory()->admin()->create(['name' => 'Aurelle Admin']);

        $this->actingAs($admin)
            ->get('/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('auth.user.role', 'admin')
                ->where('auth.user.name', 'Aurelle Admin'));
    }

    public function test_admin_cannot_sign_in_through_the_customer_account_form(): void
    {
        User::factory()->admin()->create([
            'email' => 'boss@example.com',
            'password' => 'password',
        ]);

        $this->from('/customer-account')
            ->post('/customer-account/login', [
                'email' => 'boss@example.com',
                'password' => 'password',
            ])
            ->assertRedirect('/customer-account')
            ->assertSessionHasErrors('email');

        $this->assertGuest();
    }
}