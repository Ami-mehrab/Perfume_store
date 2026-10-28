<?php

namespace App\Http\Controllers\Store;

use App\Enums\ReviewStatus;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReviewController extends Controller
{
    public function store(Request $request, Product $product): RedirectResponse
    {
        abort_unless($product->is_active, 404);

        $user = $request->user();
        abort_unless($user !== null && $user->isCustomer(), 403);

        $data = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'body' => ['required', 'string', 'min:10', 'max:2000'],
        ]);

        $existing = Review::query()
            ->where('product_id', $product->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existing !== null) {
            return back()->withErrors([
                'body' => 'You already reviewed this perfume. An admin will publish it when ready.',
            ]);
        }

        Review::query()->create([
            'product_id' => $product->id,
            'user_id' => $user->id,
            'rating' => $data['rating'],
            'body' => $data['body'],
            'status' => ReviewStatus::Pending,
            'is_featured' => false,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Thanks — your review was sent for approval.',
        ]);

        return back();
    }
}
