<?php

namespace App\Http\Controllers\Store;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Address;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use App\Services\CartService;
use App\Services\CheckoutService;
use App\Services\StoreSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function __construct(
        private readonly CartService $carts,
        private readonly CheckoutService $checkout,
        private readonly StoreSettings $settings,
    ) {}

    public function show(Request $request): Response
    {
        $key = session('checkout.idempotency_key');

        if (! is_string($key) || $key === '') {
            $key = (string) Str::uuid();
            session(['checkout.idempotency_key' => $key]);
        }

        $addresses = [];
        $shopper = $this->shopper($request);

        if ($shopper !== null) {
            $addresses = $shopper->addresses()->latest()->get();
        }

        return Inertia::render('store/checkout', [
            'cart' => $this->carts->payload(),
            'idempotencyKey' => $key,
            'addresses' => $addresses,
            'payments' => [
                'cod' => $this->settings->enabled('cod_enabled'),
            ],
            'seo' => [
                'title' => 'Checkout',
                'description' => 'Secure checkout for Aurelle.',
                'canonical' => url()->current(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        if (! $request->filled('email')) {
            $request->merge(['email' => null]);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['required', 'string', 'min:6', 'max:30'],
            'line1' => ['required', 'string', 'max:180'],
            'line2' => ['nullable', 'string', 'max:180'],
            'city' => ['required', 'string', 'max:80'],
            'region' => ['nullable', 'string', 'max:80'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'country' => ['required', 'string', 'max:80'],
            'notes' => ['nullable', 'string', 'max:500'],
            'payment_method' => ['required', Rule::in(['cod'])],
            'shipping_zone' => ['nullable', Rule::in(['inside', 'outside'])],
            'idempotency_key' => ['required', 'uuid'],
            'create_account' => ['nullable', 'boolean'],
            'password' => ['nullable', 'confirmed', Password::defaults()],
            'save_address' => ['nullable', 'boolean'],
            'address_label' => ['nullable', 'string', 'max:40'],
        ]);

        $zone = ($data['shipping_zone'] ?? session('shipping_zone')) === 'outside' ? 'outside' : 'inside';
        session(['shipping_zone' => $zone]);

        $user = $this->shopper($request);

        if ($user !== null) {
            $data['email'] = $user->email;
        } elseif ($request->boolean('create_account')) {
            if (empty($data['email'])) {
                throw ValidationException::withMessages([
                    'email' => 'An email is required to create an account.',
                ]);
            }

            if (empty($data['password'])) {
                throw ValidationException::withMessages([
                    'password' => 'Choose a password to create your account.',
                ]);
            }

            if (User::query()->where('email', $data['email'])->exists()) {
                throw ValidationException::withMessages([
                    'email' => 'An account with this email already exists. Please sign in.',
                ]);
            }

            $user = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
            ]);
            $user->forceFill([
                'role' => \App\Enums\UserRole::Customer,
                'email_verified_at' => now(),
            ])->save();
            Auth::login($user);
        } elseif (empty($data['email'])) {
            $digits = preg_replace('/\D+/', '', (string) $data['phone']);
            $data['email'] = 'guest-'.($digits !== null && $digits !== '' ? $digits : 'guest').'@orders.aurelle.test';
        }

        $method = PaymentMethod::from($data['payment_method']);
        $this->assertMethodAvailable($method);

        $order = $this->checkout->place([
            'user' => $user,
            'email' => $data['email'],
            'name' => $data['name'],
            'phone' => $data['phone'],
            'notes' => $data['notes'] ?? null,
            'address' => [
                'recipient_name' => $data['name'],
                'phone' => $data['phone'],
                'line1' => $data['line1'],
                'line2' => $data['line2'] ?? null,
                'city' => $data['city'],
                'region' => $data['region'] ?? null,
                'postal_code' => $data['postal_code'] ?? null,
                'country' => $data['country'],
            ],
        ], $method, $data['idempotency_key']);

        if ($order->status === \App\Enums\OrderStatus::Cancelled) {
            session()->forget('checkout.idempotency_key');

            throw ValidationException::withMessages([
                'payment_method' => 'That checkout is no longer active. Please review your bag and try again.',
            ]);
        }

        if ($user !== null && $request->boolean('save_address')) {
            $this->saveAddress($user, $data);
        }

        if ($method === PaymentMethod::Cod) {
            if ($order->payments()->where('gateway', 'cod')->doesntExist()) {
                Payment::query()->create([
                    'order_id' => $order->id,
                    'gateway' => 'cod',
                    'amount_cents' => $order->total_cents,
                    'status' => PaymentStatus::Unpaid,
                    'processed_at' => now(),
                ]);
            }

            session()->forget('checkout.idempotency_key');

            return redirect()->route('orders.confirmation', $order->tracking_token);
        }

        throw ValidationException::withMessages([
            'payment_method' => 'Only cash on delivery is available right now.',
        ]);
    }

    private function shopper(Request $request): ?User
    {
        $user = $request->user();

        if ($user === null || $user->isAdmin()) {
            return null;
        }

        return $user;
    }

    private function assertMethodAvailable(PaymentMethod $method): void
    {
        if ($method === PaymentMethod::Cod && ! $this->settings->enabled('cod_enabled')) {
            throw ValidationException::withMessages([
                'payment_method' => 'Cash on delivery is not available right now.',
            ]);
        }

    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function saveAddress(User $user, array $data): void
    {
        if (! $user->addresses()->where('is_default', true)->exists()) {
            $data['is_default'] = true;
        }

        $user->addresses()->create([
            'label' => $data['address_label'] ?? 'Home',
            'recipient_name' => $data['name'],
            'phone' => $data['phone'],
            'line1' => $data['line1'],
            'line2' => $data['line2'] ?? null,
            'city' => $data['city'],
            'region' => $data['region'] ?? null,
            'postal_code' => $data['postal_code'] ?? null,
            'country' => $data['country'],
            'is_default' => (bool) ($data['is_default'] ?? false),
        ]);
    }
}
