<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Wishlist;
use App\Services\WishlistService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WishlistController extends Controller
{
    public function __construct(private readonly WishlistService $wishlists) {}

    public function index(): Response
    {
        $products = Product::query()
            ->active()
            ->whereIn('id', $this->wishlists->ids() ?: [0])
            ->with(['brand', 'collection', 'images', 'variants'])
            ->get()
            ->map->toCard();

        return Inertia::render('store/wishlist', [
            'products' => $products,
            'seo' => [
                'title' => 'Wishlist',
                'description' => 'Perfumes you have saved.',
                'canonical' => url()->current(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
        ]);

        $product = Product::query()->findOrFail((int) $data['product_id']);
        $saved = $this->wishlists->toggle($product);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $saved ? 'Saved to your wishlist.' : 'Removed from your wishlist.',
        ]);

        return back();
    }

    public function destroy(Product $product): RedirectResponse
    {
        Wishlist::query()
            ->where('product_id', $product->id)
            ->where(function ($query): void {
                $userId = auth()->id();

                if ($userId) {
                    $query->where('user_id', $userId);

                    return;
                }

                $query->where('guest_token', session('wishlist_token'));
            })
            ->delete();

        return back();
    }
}
