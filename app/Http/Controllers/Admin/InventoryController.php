<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductVariant;
use App\Services\StoreSettings;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function index(Request $request, StoreSettings $settings): Response
    {
        $threshold = (int) $settings->get('low_stock_threshold');
        $search = trim((string) $request->string('q'));

        $query = ProductVariant::query()
            ->with([
                'product:id,name,slug,brand_id',
                'product.brand:id,name',
            ])
            ->orderBy('stock')
            ->orderBy('id');

        if ($search !== '') {
            $like = '%'.addcslashes($search, '%_\\').'%';
            $query->where(function (Builder $inner) use ($like): void {
                $inner->where('sku', 'like', $like)
                    ->orWhereHas('product', function (Builder $product) use ($like): void {
                        $product->where('name', 'like', $like)
                            ->orWhere('name_bn', 'like', $like)
                            ->orWhereHas('brand', fn (Builder $brand) => $brand->where('name', 'like', $like));
                    });
            });
        }

        return Inertia::render('admin/inventory', [
            'variants' => $query->paginate(30)->withQueryString(),
            'threshold' => $threshold,
            'filters' => [
                'q' => $search,
            ],
        ]);
    }

    public function update(Request $request, ProductVariant $variant): RedirectResponse
    {
        $data = $request->validate([
            'stock' => ['required', 'integer', 'min:0'],
        ]);

        $variant->loadMissing('product');
        $variant->update([
            'stock' => $data['stock'],
            // A size with stock should be sellable at checkout.
            'is_active' => $data['stock'] > 0 ? true : $variant->is_active,
        ]);

        // Stocking a hidden perfume makes it visible in public search/shop.
        if ($data['stock'] > 0 && $variant->product !== null && ! $variant->product->is_active) {
            $variant->product->update(['is_active' => true]);
            Inertia::flash('toast', [
                'type' => 'success',
                'message' => 'Stock saved. This perfume is now visible in the shop.',
            ]);

            return back();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Stock updated.']);

        return back();
    }
}
