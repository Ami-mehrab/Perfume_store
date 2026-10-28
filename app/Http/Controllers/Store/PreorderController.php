<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\PreorderRequest;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PreorderController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'variant_id' => ['nullable', 'integer', 'exists:product_variants,id'],
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['required', 'string', 'min:6', 'max:30'],
        ]);

        $product = Product::query()->findOrFail((int) $data['product_id']);
        $variant = null;

        if (! empty($data['variant_id'])) {
            $variant = ProductVariant::query()
                ->where('product_id', $product->id)
                ->findOrFail((int) $data['variant_id']);

            if ($variant->is_active && $variant->stock > 0 && $product->is_active) {
                throw ValidationException::withMessages([
                    'phone' => __('store.preorder_in_stock'),
                ]);
            }
        }

        PreorderRequest::query()->create([
            'product_id' => $product->id,
            'product_variant_id' => $variant?->id,
            'product_name' => $product->name,
            'size_ml' => $variant?->size_ml,
            'name' => $data['name'],
            'phone' => $data['phone'],
            'status' => 'new',
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('store.preorder_sent')]);

        return back();
    }
}
