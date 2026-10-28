<?php

namespace Tests\Feature\Store;

use App\Models\Address;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerAddressTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_save_an_address(): void
    {
        $customer = User::factory()->create();

        $this->actingAs($customer)
            ->post('/customer-account/addresses', [
                'label' => 'Home',
                'recipient_name' => 'Mahrab Hossen',
                'phone' => '01700000000',
                'line1' => '12 Gulshan Avenue',
                'line2' => 'Apt 4',
                'city' => 'Dhaka',
                'region' => 'Dhaka',
                'postal_code' => '1212',
                'country' => 'Bangladesh',
                'is_default' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('addresses', [
            'user_id' => $customer->id,
            'recipient_name' => 'Mahrab Hossen',
            'line1' => '12 Gulshan Avenue',
            'city' => 'Dhaka',
            'is_default' => 1,
        ]);

        $this->actingAs($customer)
            ->get('/customer-account/addresses')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('account/addresses')
                ->has('addresses', 1));
    }

    public function test_legacy_account_addresses_post_still_saves(): void
    {
        $customer = User::factory()->create();

        $response = $this->actingAs($customer)
            ->post('/account/addresses', [
                'label' => 'Office',
                'recipient_name' => 'Mahrab Hossen',
                'phone' => '01700000001',
                'line1' => 'Banani Road 11',
                'city' => 'Dhaka',
                'country' => 'Bangladesh',
                'is_default' => true,
            ]);

        $this->assertTrue(
            Address::query()->where('user_id', $customer->id)->exists(),
            'Address was not saved. Response status: '.$response->status().' location: '.$response->headers->get('Location')
        );
    }

    public function test_saved_addresses_appear_on_the_customer_panel(): void
    {
        $customer = User::factory()->create();
        Address::query()->create([
            'user_id' => $customer->id,
            'label' => 'Home',
            'recipient_name' => 'Mahrab Hossen',
            'phone' => '01700000000',
            'line1' => '12 Gulshan Avenue',
            'line2' => null,
            'city' => 'Dhaka',
            'region' => 'Dhaka',
            'postal_code' => '1212',
            'country' => 'Bangladesh',
            'is_default' => true,
        ]);

        $this->actingAs($customer)
            ->get('/customer-account/addresses')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('account/addresses')
                ->has('addresses', 1)
                ->where('addresses.0.recipient_name', 'Mahrab Hossen')
                ->where('addresses.0.city', 'Dhaka'));
    }
}