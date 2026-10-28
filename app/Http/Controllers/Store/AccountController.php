<?php

namespace App\Http\Controllers\Store;

use App\Enums\OrderStatus;
use App\Enums\ReturnStatus;
use App\Http\Controllers\Controller;
use App\Models\Address;
use App\Models\Order;
use App\Models\ReturnRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        // Public Sign in / registration entry must never bounce into /admin.
        // Staff sessions are cleared so a visitor can sign in as a customer.
        if ($user !== null && $user->isAdmin()) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            $user = null;
        }

        if ($user === null) {
            return Inertia::render('account/index', [
                'guest' => true,
                'orders' => [],
                'addressCount' => 0,
            ]);
        }

        return Inertia::render('account/index', [
            'guest' => false,
            'orders' => $user->orders()->latest('placed_at')->limit(5)->get(['id', 'number', 'tracking_token', 'status', 'payment_status', 'total_cents', 'currency_code', 'placed_at']),
            'addressCount' => $user->addresses()->count(),
        ]);
    }

    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $existing = User::query()->where('email', $credentials['email'])->first();

        // This form is customer-only. Staff must use /admin/login.
        if ($existing !== null && $existing->isAdmin()) {
            throw ValidationException::withMessages([
                'email' => __('store.customer_only'),
            ]);
        }

        // Drop any prior staff session so the storefront never keeps an admin login.
        if (Auth::check()) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        if (! Auth::attempt($credentials, true)) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        $shopper = Auth::user();

        if (! $shopper instanceof User || $shopper->isAdmin()) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            throw ValidationException::withMessages([
                'email' => __('store.customer_only'),
            ]);
        }

        $request->session()->regenerate();
        $request->session()->forget('url.intended');

        return redirect()->route('account.index');
    }

    public function orders(Request $request): Response
    {
        return Inertia::render('account/orders', [
            'orders' => $request->user()->orders()->latest('placed_at')->paginate(10),
        ]);
    }

    public function show(Request $request, string $number): Response
    {
        $order = $this->ownedOrder($request, $number);
        $order->load('items', 'returns', 'refunds');

        return Inertia::render('account/order', [
            'order' => $order->toPublicArray(),
        ]);
    }

    public function confirmation(Request $request, Order $order): Response
    {
        $order->load('items', 'returns');
        session()->forget('checkout.idempotency_key');

        return Inertia::render('store/confirmation', [
            'order' => $order->toPublicArray(),
            'seo' => [
                'title' => 'Order '.$order->number,
                'description' => 'Your Aurelle order confirmation.',
                'canonical' => url()->current(),
            ],
        ]);
    }

    public function showTracker(): Response
    {
        return Inertia::render('store/track', [
            'order' => null,
            'seo' => [
                'title' => 'Track an order',
                'description' => 'Look up an Aurelle order with its number and email.',
                'canonical' => url()->current(),
            ],
        ]);
    }

    public function track(Request $request): Response|RedirectResponse
    {
        $data = $request->validate([
            'number' => ['required', 'string', 'max:40'],
            'contact' => ['required', 'string', 'max:255'],
        ]);

        $order = Order::query()
            ->where('number', strtoupper(trim($data['number'])))
            ->with('items', 'returns')
            ->first();

        if ($order === null || ! $this->contactMatches($order, $data['contact'])) {
            return back()->withErrors([
                'number' => __('store.track_miss'),
            ])->withInput();
        }

        return Inertia::render('store/track', [
            'order' => $order->toPublicArray(),
            'seo' => [
                'title' => 'Order '.$order->number,
                'description' => 'Order tracking for '.$order->number,
                'canonical' => route('orders.track'),
            ],
        ]);
    }

    public function requestReturn(Request $request, string $number): RedirectResponse
    {
        $order = $this->ownedOrder($request, $number);
        $data = $request->validate([
            'reason' => ['required', 'string', 'min:10', 'max:1000'],
        ]);

        if ($order->status !== OrderStatus::Delivered) {
            return back()->withErrors(['reason' => 'Returns open once an order is delivered.']);
        }

        $open = $order->returns()->where('status', '!=', ReturnStatus::Rejected)->exists();

        if ($open) {
            return back()->withErrors(['reason' => 'A return is already open for this order.']);
        }

        ReturnRequest::query()->create([
            'order_id' => $order->id,
            'user_id' => $request->user()->id,
            'status' => ReturnStatus::Requested,
            'reason' => $data['reason'],
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Return request sent.']);

        return back();
    }

    public function addresses(Request $request): Response
    {
        $addresses = $request->user()
            ->addresses()
            ->latest('id')
            ->get()
            ->map(fn (Address $address): array => [
                'id' => $address->id,
                'label' => $address->label,
                'recipient_name' => $address->recipient_name,
                'phone' => $address->phone,
                'line1' => $address->line1,
                'line2' => $address->line2,
                'city' => $address->city,
                'region' => $address->region,
                'postal_code' => $address->postal_code,
                'country' => $address->country,
                'is_default' => (bool) $address->is_default,
            ])
            ->values()
            ->all();

        return Inertia::render('account/addresses', [
            'addresses' => $addresses,
        ]);
    }

    public function storeAddress(Request $request): RedirectResponse
    {
        $data = $this->addressData($request);
        $user = $request->user();

        $data['is_default'] = $request->boolean('is_default') || ! $user->addresses()->exists();

        if ($data['is_default']) {
            $user->addresses()->update(['is_default' => false]);
        }

        $user->addresses()->create($data);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Address saved.']);

        return redirect()->route('account.addresses');
    }

    public function updateAddress(Request $request, Address $address): RedirectResponse
    {
        abort_unless($address->user_id === $request->user()->id, 404);
        $data = $this->addressData($request);

        if ($request->boolean('is_default')) {
            $request->user()->addresses()->whereKeyNot($address->id)->update(['is_default' => false]);
            $data['is_default'] = true;
        }

        $address->update($data);

        return back();
    }

    public function destroyAddress(Request $request, Address $address): RedirectResponse
    {
        abort_unless($address->user_id === $request->user()->id, 404);
        $address->delete();

        return back();
    }

    private function contactMatches(Order $order, string $contact): bool
    {
        $contact = trim($contact);

        if (str_contains($contact, '@')) {
            return strcasecmp($order->email, $contact) === 0;
        }

        $given = $this->phoneDigits($contact);
        $stored = $this->phoneDigits($order->phone);

        return $given !== '' && $given === $stored;
    }

    private function phoneDigits(string $value): string
    {
        $digits = preg_replace('/\D+/', '', $value) ?? '';

        if (str_starts_with($digits, '880') && strlen($digits) > 10) {
            $digits = substr($digits, 3);
        }

        if (str_starts_with($digits, '0')) {
            $digits = substr($digits, 1);
        }

        return $digits;
    }

    private function ownedOrder(Request $request, string $number): Order
    {
        return Order::query()
            ->where('number', $number)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();
    }

    /**
     * @return array<string, mixed>
     */
    private function addressData(Request $request): array
    {
        return $request->validate([
            'label' => ['required', 'string', 'max:40'],
            'recipient_name' => ['required', 'string', 'max:120'],
            'phone' => ['required', 'string', 'min:6', 'max:30'],
            'line1' => ['required', 'string', 'max:180'],
            'line2' => ['nullable', 'string', 'max:180'],
            'city' => ['required', 'string', 'max:80'],
            'region' => ['nullable', 'string', 'max:80'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'country' => ['required', 'string', 'max:80'],
            'is_default' => ['nullable', 'boolean'],
        ]);
    }
}
