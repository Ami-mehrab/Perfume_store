<?php

namespace App\Console\Commands;

use App\Models\Brand;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class ImportCatalogCommand extends Command
{
    protected $signature = 'store:import-catalog {path?}';

    protected $description = 'Import the bilingual catalog as unpublished drafts. Existing slugs are left unchanged.';

    public function handle(): int
    {
        $path = $this->argument('path');
        $path = is_string($path) && $path !== '' ? $path : database_path('data/catalog-20.json');

        if (! is_file($path)) {
            $this->error('Catalog file not found.');

            return self::FAILURE;
        }

        $decoded = json_decode((string) file_get_contents($path), true);

        if (! is_array($decoded) || ! is_array($decoded['products'] ?? null)) {
            $this->error('Catalog has no products.');

            return self::FAILURE;
        }

        $created = 0;
        $skipped = 0;

        foreach ($decoded['products'] as $index => $row) {
            if (! is_array($row)) {
                continue;
            }

            $slug = (string) ($row['slug'] ?? '');

            if ($slug === '' || Product::query()->where('slug', $slug)->exists()) {
                $skipped++;

                continue;
            }

            $brand = is_array($row['brand'] ?? null) ? $row['brand'] : [];
            $brandName = (string) ($brand['en'] ?? 'House');
            $house = Brand::query()->firstOrCreate(
                ['slug' => Str::slug($brandName)],
                ['name' => $brandName, 'is_active' => true, 'sort_order' => 0],
            );

            $notes = is_array($row['key_notes'] ?? null) ? $row['key_notes'] : [];
            $englishNotes = $this->strings($notes['en'] ?? []);
            $profile = is_array($row['scent_profile'] ?? null) ? $row['scent_profile'] : [];
            $name = is_array($row['name'] ?? null) ? $row['name'] : [];
            $description = is_array($row['description'] ?? null) ? $row['description'] : [];
            $variant = is_array($row['suggested_variants'][0] ?? null) ? $row['suggested_variants'][0] : [];

            $product = Product::query()->create([
                'brand_id' => $house->id,
                'name' => (string) ($name['en'] ?? $slug),
                'name_bn' => is_string($name['bn'] ?? null) ? $name['bn'] : null,
                'slug' => $slug,
                'description' => (string) ($description['en'] ?? ''),
                'description_bn' => is_string($description['bn'] ?? null) ? $description['bn'] : null,
                'story' => is_string($profile['en'] ?? null) ? $profile['en'] : null,
                'family' => $this->family((string) ($profile['en'] ?? '')),
                'gender' => match ((string) ($row['audience'] ?? '')) {
                    'women' => 'feminine',
                    'unisex' => 'unisex',
                    default => 'masculine',
                },
                'swatch' => '#9d174d',
                'top_notes' => array_slice($englishNotes, 0, 1) ?: ['—'],
                'heart_notes' => array_slice($englishNotes, 1, 1) ?: ['—'],
                'base_notes' => array_slice($englishNotes, 2) ?: ['—'],
                'is_featured' => false,
                'is_active' => false,
                'sort_order' => is_int($index) ? $index : 0,
            ]);

            ProductVariant::query()->create([
                'product_id' => $product->id,
                'concentration' => $this->concentration((string) ($row['concentration'] ?? 'EDP')),
                'size_ml' => (int) ($variant['volume_ml'] ?? 100),
                'sku' => (string) ($variant['sku'] ?? 'SEED-'.$slug),
                'price_cents' => 0,
                'compare_at_cents' => null,
                'reference_price_cents' => $this->reference($row),
                'stock' => 0,
                'is_active' => true,
            ]);

            $created++;
        }

        $this->info("Imported {$created} drafts. Skipped {$skipped} existing slugs.");

        return self::SUCCESS;
    }

    /**
     * @return list<string>
     */
    private function strings(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        return array_values(array_filter($value, is_string(...)));
    }

    private function family(string $profile): string
    {
        $text = strtolower($profile);

        return match (true) {
            str_contains($text, 'floral') || str_contains($text, 'rose') => 'floral',
            str_contains($text, 'fresh') || str_contains($text, 'citrus') || str_contains($text, 'aquatic') => 'fresh',
            str_contains($text, 'vanilla') || str_contains($text, 'sweet') || str_contains($text, 'gourmand') => 'gourmand',
            str_contains($text, 'amber') => 'amber',
            str_contains($text, 'chypre') => 'chypre',
            default => 'woody',
        };
    }

    private function concentration(string $value): string
    {
        return match (strtoupper($value)) {
            'EDT' => 'edt',
            'EDC' => 'cologne',
            'PARFUM' => 'parfum',
            'EXTRAIT' => 'extrait',
            default => 'edp',
        };
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function reference(array $row): ?int
    {
        $reference = is_array($row['reference'] ?? null) ? $row['reference'] : [];
        $price = $reference['price_bdt_for_suggested_size'] ?? null;

        if (! is_numeric($price)) {
            return null;
        }

        return (int) $price * 100;
    }
}
