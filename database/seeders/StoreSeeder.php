<?php

namespace Database\Seeders;

use App\Enums\CouponType;
use App\Enums\UserRole;
use App\Models\Banner;
use App\Models\Brand;
use App\Models\Coupon;
use App\Models\FragranceCollection;
use App\Models\Product;
use App\Models\User;
use App\Services\StoreSettings;
use App\Support\Money;
use App\Support\Slugs;
use Illuminate\Database\Seeder;

class StoreSeeder extends Seeder
{
    public function run(): void
    {
        app(StoreSettings::class)->update(StoreSettings::DEFAULTS);
        $this->syncBangla();

        if (Product::query()->exists()) {
            $this->seedUsers();

            return;
        }

        $brands = collect([
            ['Maison Aurelle', 'Bangladesh', 'The house line. Quiet woods, salt, and flowers.'],
            ['Atelier Nocturne', 'France', 'Night perfumes built around smoke, resin, and skin.'],
            ['Cèdre Studio', 'Japan', 'Clean citrus, rain, and pale woods.'],
            ['Lune & Resin', 'Morocco', 'Amber, oud, and sun-warmed spices.'],
        ])->mapWithKeys(function (array $brand): array {
            $model = Brand::query()->create([
                'name' => $brand[0],
                'slug' => Slugs::unique(Brand::class, $brand[0]),
                'country' => $brand[1],
                'description' => $brand[2],
                'is_active' => true,
            ]);

            return [$brand[0] => $model];
        });

        $collections = collect([
            ['The Signature', '#6b3f2a', 'The bottles we return to.', true],
            ['First Light', '#c4a574', 'Citrus, salt, and morning air.', true],
            ['After Dusk', '#2c2420', 'Smoke, petals, and low light.', true],
            ['Rare Resins', '#8a5a32', 'Oud, amber, and sweet woods.', false],
        ])->mapWithKeys(function (array $collection, int $index): array {
            $model = FragranceCollection::query()->create([
                'name' => $collection[0],
                'slug' => Slugs::unique(FragranceCollection::class, $collection[0]),
                'description' => $collection[2],
                'swatch' => $collection[1],
                'is_featured' => $collection[3],
                'is_active' => true,
                'sort_order' => $index,
            ]);

            return [$collection[0] => $model];
        });

        $perfumes = [
            ['Noir Santal', 'Maison Aurelle', 'The Signature', 'woody', 'unisex', '#6b3f2a', 'Sandalwood smoked over black pepper, then softened with iris.', 'An evening wood that stays close to the skin. Composed for people who prefer a trail to a shout.', ['Bergamot', 'Black pepper'], ['Sandalwood', 'Iris'], ['Cedar', 'Amber'], true, [['edp', 30, 3200, 10], ['edp', 50, 4800, 14], ['extrait', 30, 6900, 5]]],
            ['Fleur de Sel', 'Maison Aurelle', 'First Light', 'fresh', 'feminine', '#d7c4a3', 'Salted petals, lemon leaf, and a pale musk.', 'Bright without being sharp. The salt keeps the flowers from turning sweet.', ['Lemon leaf', 'Neroli'], ['Peony', 'Sea salt'], ['White musk', 'Driftwood'], true, [['edt', 50, 3600, 16], ['edp', 50, 4600, 9], ['edp', 100, 7200, 6]]],
            ['Oud Mirage', 'Lune & Resin', 'Rare Resins', 'amber', 'unisex', '#8a4b2f', 'A clear oud, not a heavy one, lifted by saffron and dried rose.', 'Resin with air around it. Wear it when the day starts to cool.', ['Saffron', 'Cardamom'], ['Rose', 'Oud'], ['Amber', 'Vanilla'], true, [['edp', 30, 5400, 7], ['parfum', 50, 9800, 4]]],
            ['Citrus Veil', 'Cèdre Studio', 'First Light', 'fresh', 'masculine', '#e0b15a', 'Yuzu, petitgrain, and a cool cedar shadow.', 'A shirt-fresh citrus that dries down to wood instead of sugar.', ['Yuzu', 'Petitgrain'], ['Tea', 'Juniper'], ['Cedar', 'Vetiver'], false, [['edt', 50, 3400, 18], ['edp', 100, 6400, 8]]],
            ['Rose Smoke', 'Atelier Nocturne', 'After Dusk', 'floral', 'feminine', '#7a3b45', 'Rose absolute through a ribbon of incense smoke.', 'Not a bouquet. A single rose left in a closed room.', ['Pink pepper', 'Bergamot'], ['Damask rose', 'Incense'], ['Patchouli', 'Musk'], true, [['edp', 30, 4200, 8], ['edp', 50, 5900, 6], ['extrait', 15, 7600, 3]]],
            ['Vetiver Rain', 'Cèdre Studio', 'First Light', 'woody', 'masculine', '#5e6b52', 'Vetiver after rain, with grapefruit peel and moss.', 'Green, rooty, and clean. It smells like a garden path, not a cologne counter.', ['Grapefruit', 'Ginger'], ['Vetiver', 'Violet leaf'], ['Oakmoss', 'Cedar'], false, [['edt', 50, 3800, 11], ['edp', 50, 5100, 7]]],
            ['Vanilla Relic', 'Atelier Nocturne', 'After Dusk', 'gourmand', 'unisex', '#c08a45', 'Vanilla bean, tonka, and a bitter cocoa edge.', 'Sweetness with a spine. The cocoa keeps it from becoming dessert.', ['Cocoa', 'Mandarin'], ['Vanilla', 'Tonka'], ['Benzoin', 'Sandalwood'], true, [['edp', 30, 3900, 12], ['edp', 50, 5400, 9]]],
            ['Bergamot Hour', 'Maison Aurelle', 'The Signature', 'fresh', 'unisex', '#d9b56a', 'An hour of bergamot, stretched with white tea and soft musk.', 'The house cologne. Easy in heat, still present at dinner.', ['Bergamot', 'Mint'], ['White tea', 'Lavender'], ['Musk', 'Blond wood'], false, [['cologne', 100, 4200, 15], ['edt', 50, 3600, 10]]],
            ['Amber Library', 'Lune & Resin', 'Rare Resins', 'amber', 'unisex', '#a86b3c', 'Old paper, labdanum, and a thread of honey.', 'Warmth without syrup. It blooms on wool and skin alike.', ['Orange', 'Cinnamon'], ['Labdanum', 'Honey'], ['Amber', 'Cedar'], false, [['parfum', 30, 6200, 5], ['parfum', 50, 8600, 4]]],
            ['Jasmine After Dark', 'Atelier Nocturne', 'After Dusk', 'floral', 'feminine', '#f2efe6', 'Night jasmine, green and narcotic, cooled by tuberose.', 'Indolic in the best way: alive, not perfumey.', ['Green leaf', 'Pear'], ['Jasmine', 'Tuberose'], ['Sandalwood', 'Musk'], true, [['edp', 30, 4500, 6], ['extrait', 30, 8200, 2]]],
        ];

        foreach ($perfumes as $index => $perfume) {
            /** @var Brand $brand */
            $brand = $brands[$perfume[1]];
            /** @var FragranceCollection $collection */
            $collection = $collections[$perfume[2]];

            $product = Product::query()->create([
                'brand_id' => $brand->id,
                'collection_id' => $collection->id,
                'name' => $perfume[0],
                'slug' => Slugs::unique(Product::class, $perfume[0]),
                'description' => $perfume[5 + 1],
                'story' => $perfume[7],
                'family' => $perfume[3],
                'gender' => $perfume[4],
                'swatch' => $perfume[5],
                'top_notes' => $perfume[8],
                'heart_notes' => $perfume[9],
                'base_notes' => $perfume[10],
                'is_featured' => $perfume[11],
                'is_active' => true,
                'sort_order' => $index,
            ]);

            foreach ($perfume[12] as $variant) {
                $product->variants()->create([
                    'concentration' => $variant[0],
                    'size_ml' => $variant[1],
                    'sku' => strtoupper(str_replace('-', '', $product->slug)).'-'.strtoupper($variant[0]).'-'.$variant[1],
                    'price_cents' => Money::toCents($variant[2]),
                    'stock' => $variant[3],
                    'is_active' => true,
                ]);
            }
        }

        Coupon::query()->create([
            'code' => 'WELCOME10',
            'type' => CouponType::Percent,
            'value' => 10,
            'min_subtotal_cents' => 0,
            'max_uses' => 100,
            'is_active' => true,
        ]);

        Banner::query()->create([
            'kind' => 'homepage',
            'eyebrow' => 'The house',
            'title' => 'Samples ride along with every bottle.',
            'subtitle' => 'A small vial of another perfume, chosen from what is open that week.',
            'link_url' => '/shop',
            'is_active' => true,
            'sort_order' => 0,
        ]);

        $firstProductId = Product::query()->orderBy('id')->value('id');
        $firstCollectionId = FragranceCollection::query()->orderBy('id')->value('id');

        Banner::query()->create([
            'kind' => 'promo',
            'title' => 'Best sellers showcase',
            'image_path' => 'banners/promo-best-sellers.jpg',
            'placement' => 'best_sellers',
            'product_id' => $firstProductId,
            'is_active' => true,
            'sort_order' => 0,
        ]);

        Banner::query()->create([
            'kind' => 'promo',
            'title' => 'Trending collection',
            'image_path' => 'banners/promo-trending.jpg',
            'placement' => 'trending',
            'collection_id' => $firstCollectionId,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $this->syncBangla();
        $this->seedUsers();
    }

    private function syncBangla(): void
    {
        $copy = [
            'Noir Santal' => ['নোয়ার স্যান্ডাল', 'কালো মরিচের ওপর ধোঁয়াটে চন্দন, তারপর আইরিসের নরম ছোঁয়া।'],
            'Fleur de Sel' => ['ফ্ল্যর দ্য সেল', 'লবণাক্ত পাপড়ি, লেবু পাতা ও হালকা মাস্ক।'],
            'Oud Mirage' => ['উদ মিরাজ', 'স্বচ্ছ উদ, জাফরান ও শুকনো গোলাপে হালকা।'],
            'Citrus Veil' => ['সাইট্রাস ভেইল', 'ইউজু, পেটিগ্রেইন ও ঠান্ডা সিডারের ছায়া।'],
            'Rose Smoke' => ['রোজ স্মোক', 'ধূপের ধোঁয়ার ভেতর দিয়ে গোলাপ।'],
            'Vetiver Rain' => ['ভেটিভার রেইন', 'বৃষ্টির পর ভেটিভার, গ্রেপফ্রুটের খোসা ও মস।'],
            'Vanilla Relic' => ['ভ্যানিলা রেলিক', 'ভ্যানিলা বিন, টঙ্কা ও তেতো কোকোর কিনারা।'],
            'Bergamot Hour' => ['বার্গামট আওয়ার', 'এক ঘণ্টার বার্গামট, সাদা চা ও নরম মাস্কে মেশানো।'],
            'Amber Library' => ['অ্যাম্বার লাইব্রেরি', 'পুরনো কাগজ, ল্যাবডানাম ও এক ফোঁটা মধু।'],
            'Jasmine After Dark' => ['জেসমিন আফটার ডার্ক', 'রাতের জেসমিন, সবুজ ও গাঢ়, টিউবারোজে ঠান্ডা।'],
        ];

        foreach ($copy as $name => [$bangla, $description]) {
            Product::query()->where('name', $name)->update([
                'name_bn' => $bangla,
                'description_bn' => $description,
            ]);
        }
    }

    private function seedUsers(): void
    {
        if (app()->environment('production')) {
            return;
        }

        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@aurelle.test'],
            [
                'name' => 'Aurelle Admin',
                'password' => 'password',
                'email_verified_at' => now(),
            ],
        );
        $admin->forceFill(['role' => UserRole::Admin])->save();

        $customer = User::query()->updateOrCreate(
            ['email' => 'customer@aurelle.test'],
            [
                'name' => 'Sample Customer',
                'password' => 'password',
                'email_verified_at' => now(),
            ],
        );
        $customer->forceFill(['role' => UserRole::Customer])->save();
    }
}
