<?php

namespace App\Services;

use App\Models\Setting;
use App\Support\Money;
use Illuminate\Support\Facades\Cache;

class StoreSettings
{
    /**
     * @var array<string, string>
     */
    public const DEFAULTS = [
        'store_name' => 'Aurelle',
        'tagline' => 'Perfume, composed slowly',
        'tagline_bn' => 'আস্তে করে তৈরি সুগন্ধি',
        'announcement' => 'Complimentary samples with every bottle',
        'announcement_bn' => 'প্রতিটি বোতলের সাথে ফ্রি স্যাম্পল',
        'currency_code' => 'BDT',
        'currency_symbol' => '৳',
        'currency_decimals' => '2',
        'shipping_flat' => '120',
        'shipping_inside_dhaka' => '80',
        'shipping_outside_dhaka' => '150',
        'free_shipping_over' => '5000',
        'cod_enabled' => '1',
        'online_payments_enabled' => '0',
        'delivery_estimate' => '2–5 business days',
        'delivery_estimate_bn' => '২–৫ কার্যদিবস',
        'default_country' => 'Bangladesh',
        'contact_email' => 'hello@aurelle.test',
        'contact_phone' => '+880 1700 000000',
        'address' => 'House 12, Road 4, Gulshan, Dhaka',
        'about' => 'Aurelle is a house of quiet perfume. We bottle woods, resins, flowers, and citrus in small batches, then let you wear them at your own pace.',
        'about_bn' => 'অরেল একটি শান্ত সুগন্ধির ঘর। কাঠ, রেজিন, ফুল ও সাইট্রাস ছোট ব্যাচে বোতলজাত হয়, আর আপনি সেগুলো নিজের মতো পরেন।',
        'meta_description' => 'Shop Aurelle perfumes: eau de parfum, extrait, and discovery sizes, composed in small batches and delivered across Bangladesh.',
        'meta_description_bn' => 'অরেল পারফিউম কিনুন। ছোট ব্যাচের সুগন্ধি, সারা বাংলাদেশে ডেলিভারি।',
        'facebook_url' => '',
        'instagram_url' => '',
        'twitter_url' => '',
        'youtube_url' => '',
        'whatsapp_phone' => '',
        'messenger_url' => 'https://m.me/aurelle',
        'warranty_text' => 'Sealed bottles that arrive damaged can be replaced. Contact us within 3 days of delivery with a photo of the parcel.',
        'warranty_text_bn' => 'সিল করা বোতল ক্ষতিগ্রস্ত অবস্থায় পৌঁছালে বদলে দেওয়া হয়। ডেলিভারির ৩ দিনের মধ্যে পার্সেলের ছবিসহ যোগাযোগ করুন।',
        'returns_text' => 'Unopened bottles can be returned within 7 days. Opened perfume cannot be returned.',
        'returns_text_bn' => 'না-খোলা বোতল ৭ দিনের মধ্যে ফেরত দেওয়া যায়। খোলা পারফিউম ফেরত হয় না।',
        'low_stock_threshold' => '5',
        'max_qty_per_line' => '6',
    ];

    /**
     * @return array<string, string>
     */
    public function all(): array
    {
        /** @var array<string, string> $stored */
        $stored = Cache::remember('store.settings', 3600, function (): array {
            return Setting::query()->pluck('value', 'key')->map(fn (mixed $value): string => (string) $value)->all();
        });

        return [...self::DEFAULTS, ...$stored];
    }

    public function get(string $key): string
    {
        return $this->all()[$key] ?? self::DEFAULTS[$key] ?? '';
    }

    public function cents(string $key): int
    {
        return Money::toCents($this->get($key));
    }

    public function enabled(string $key): bool
    {
        return in_array($this->get($key), ['1', 'true', 'yes', 'on'], true);
    }

    /**
     * @param  array<string, string|null>  $values
     */
    public function update(array $values): void
    {
        foreach ($values as $key => $value) {
            if (! array_key_exists($key, self::DEFAULTS)) {
                continue;
            }

            Setting::query()->updateOrCreate(
                ['key' => $key],
                ['value' => $value ?? ''],
            );
        }

        Cache::forget('store.settings');
    }

    /**
     * @return array<string, mixed>
     */
    public function publicPayload(): array
    {
        return [
            'name' => $this->get('store_name'),
            'tagline' => $this->text('tagline'),
            'announcement' => $this->text('announcement'),
            'currency_code' => $this->get('currency_code'),
            'currency_symbol' => $this->get('currency_symbol'),
            'currency_decimals' => (int) $this->get('currency_decimals'),
            'delivery_estimate' => $this->text('delivery_estimate'),
            'default_country' => $this->get('default_country'),
            'contact_email' => $this->get('contact_email'),
            'contact_phone' => $this->get('contact_phone'),
            'address' => $this->get('address'),
            'about' => $this->text('about'),
            'meta_description' => $this->text('meta_description'),
            'facebook_url' => $this->get('facebook_url'),
            'instagram_url' => $this->get('instagram_url'),
            'twitter_url' => $this->get('twitter_url'),
            'youtube_url' => $this->get('youtube_url'),
            'whatsapp_phone' => $this->get('whatsapp_phone') !== '' ? $this->get('whatsapp_phone') : $this->get('contact_phone'),
            'messenger_url' => $this->get('messenger_url'),
            'warranty_text' => $this->text('warranty_text'),
            'returns_text' => $this->text('returns_text'),
            'cod_enabled' => $this->enabled('cod_enabled'),
            'online_payments_enabled' => $this->enabled('online_payments_enabled'),
            'free_shipping_over_cents' => $this->cents('free_shipping_over'),
            'shipping_flat_cents' => $this->cents('shipping_flat'),
            'shipping_inside_cents' => $this->cents('shipping_inside_dhaka'),
            'shipping_outside_cents' => $this->cents('shipping_outside_dhaka'),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function editable(): array
    {
        $all = $this->all();
        $editable = [];

        foreach (self::DEFAULTS as $key => $default) {
            $editable[$key] = $all[$key] ?? $default;
        }

        return $editable;
    }

    private function text(string $key): string
    {
        if (app()->getLocale() === 'bn') {
            $translated = trim($this->get($key.'_bn'));

            if ($translated !== '') {
                return $translated;
            }
        }

        return $this->get($key);
    }
}
