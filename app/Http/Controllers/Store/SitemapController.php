<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\FragranceCollection;
use App\Models\Product;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    public function __invoke(): Response
    {
        $urls = collect([
            ['loc' => route('home'), 'priority' => '1.0'],
            ['loc' => route('shop'), 'priority' => '0.9'],
            ['loc' => route('orders.track'), 'priority' => '0.3'],
        ]);

        foreach (FragranceCollection::query()->where('is_active', true)->get() as $collection) {
            $urls->push(['loc' => route('collections.show', $collection), 'priority' => '0.7']);
        }

        foreach (Brand::query()->where('is_active', true)->get() as $brand) {
            $urls->push(['loc' => route('brands.show', $brand), 'priority' => '0.6']);
        }

        foreach (Product::query()->active()->get() as $product) {
            $urls->push([
                'loc' => route('products.show', $product),
                'priority' => '0.8',
                'lastmod' => $product->updated_at?->toAtomString(),
            ]);
        }

        $xml = view('sitemap', ['urls' => $urls])->render();

        return response($xml, 200, ['Content-Type' => 'application/xml']);
    }
}
