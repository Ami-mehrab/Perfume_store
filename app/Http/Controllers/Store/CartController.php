<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Models\ProductVariant;
use App\Services\CartService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function __construct(private readonly CartService $carts) {}

    public function show(): Response
    {
        return Inertia::render('store/cart', [
            'cart' => $this->carts->payload(),
            'seo' => [
                'title' => 'Your bag',
                'description' => 'Review the bottles in your bag before checkout.',
                'canonical' => url()->current(),
            ],
        ]);
    }

    public function store(Request $request): Response
    {
        $data = $request->validate([
            'variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $variant = ProductVariant::query()->with('product')->findOrFail((int) $data['variant_id']);
        $this->carts->add($variant, (int) $data['quantity']);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('store.added')]);

        if (! $request->boolean('quiet')) {
            Inertia::flash('openCart', true);
        }

        return $this->cartState();
    }

    public function update(Request $request, CartItem $item): Response
    {
        $data = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $this->carts->update($item, (int) $data['quantity']);

        return $this->cartState();
    }

    public function destroy(CartItem $item): Response
    {
        $this->carts->remove($item);

        return $this->cartState();
    }

    public function coupon(Request $request): Response
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:40'],
        ]);

        $this->carts->applyCoupon($data['code']);
        Inertia::flash('toast', ['type' => 'success', 'message' => __('store.coupon_applied')]);

        return $this->cartState();
    }

    public function removeCoupon(): Response
    {
        $this->carts->removeCoupon();

        return $this->cartState();
    }

    public function shipping(Request $request): Response
    {
        $data = $request->validate([
            'zone' => ['required', Rule::in(['inside', 'outside'])],
        ]);

        session(['shipping_zone' => $data['zone']]);
        $this->carts->refresh();

        return $this->cartState();
    }

    /**
     * Send only the bag back to the page the shopper is already on.
     */
    private function cartState(): Response
    {
        $component = $this->currentComponent();

        if ($component === 'store/cart') {
            return $this->show();
        }

        return Inertia::render($component);
    }

    private function currentComponent(): string
    {
        $component = request()->header('X-Inertia-Partial-Component');

        return is_string($component) && $component !== '' ? $component : 'store/cart';
    }
}
