import { useForm } from '@inertiajs/react';
import { Card, inputClass, Label, PageHeader } from '@/components/admin/ui';

const groups: { title: string; description: string; keys: string[] }[] = [
    {
        title: 'Header',
        description: 'The shop name in the menu, the line above the search box, and the thin announcement at the very top.',
        keys: ['store_name', 'tagline', 'tagline_bn', 'announcement', 'announcement_bn'],
    },
    {
        title: 'Money and delivery',
        description: 'Fees are in taka. Inside Dhaka and outside Dhaka are the delivery charges added when an order is placed.',
        keys: ['currency_code', 'currency_symbol', 'currency_decimals', 'shipping_inside_dhaka', 'shipping_outside_dhaka', 'cod_enabled', 'delivery_estimate', 'delivery_estimate_bn', 'max_qty_per_line'],
    },
    {
        title: 'Footer and chat',
        description: 'Footer about text, social links (empty links stay hidden), WhatsApp, and Messenger.',
        keys: ['default_country', 'contact_email', 'contact_phone', 'address', 'facebook_url', 'instagram_url', 'twitter_url', 'youtube_url', 'whatsapp_phone', 'messenger_url', 'about', 'about_bn'],
    },
    {
        title: 'Perfume page',
        description: 'Warranty and shipping text on each perfume. Delivery time is also shown there.',
        keys: ['warranty_text', 'warranty_text_bn', 'returns_text', 'returns_text_bn'],
    },
    {
        title: 'Search and stock',
        description: 'The search description switches with the language. Low stock is the number that flags a size on the overview.',
        keys: ['meta_description', 'meta_description_bn', 'low_stock_threshold'],
    },
];

const labels: Record<string, string> = {
    store_name: 'Store name',
    tagline: 'Tagline',
    tagline_bn: 'Tagline in Bangla',
    announcement: 'Announcement bar',
    announcement_bn: 'Announcement in Bangla',
    currency_code: 'Currency code',
    currency_symbol: 'Currency symbol',
    currency_decimals: 'Decimal places',
    shipping_flat: 'Flat delivery fee',
    shipping_inside_dhaka: 'Delivery inside Dhaka',
    shipping_outside_dhaka: 'Delivery outside Dhaka',
    free_shipping_over: 'Free delivery from',
    cod_enabled: 'Cash on delivery',
    online_payments_enabled: 'Card and mobile banking',
    delivery_estimate: 'Delivery estimate',
    delivery_estimate_bn: 'Delivery estimate in Bangla',
    default_country: 'Default country',
    contact_email: 'Email',
    contact_phone: 'Phone',
    address: 'Address',
    about: 'About the house',
    about_bn: 'About the house in Bangla',
    meta_description: 'Search description',
    meta_description_bn: 'Search description in Bangla',
    facebook_url: 'Facebook page URL',
    instagram_url: 'Instagram URL',
    twitter_url: 'X (Twitter) URL',
    youtube_url: 'YouTube channel URL',
    whatsapp_phone: 'WhatsApp number',
    messenger_url: 'Messenger link',
    warranty_text: 'Warranty text',
    warranty_text_bn: 'Warranty text in Bangla',
    returns_text: 'Shipping and returns',
    returns_text_bn: 'Shipping and returns in Bangla',
    low_stock_threshold: 'Low stock at or below',
    max_qty_per_line: 'Maximum bottles per size in one order',
};

const toggles = new Set(['cod_enabled']);
const areas = new Set(['about', 'about_bn', 'meta_description', 'meta_description_bn', 'address', 'warranty_text', 'warranty_text_bn', 'returns_text', 'returns_text_bn']);

export default function Settings({
    settings,
}: {
    settings: Record<string, string>;
}) {
    const form = useForm(settings);

    return (
        <form
            className="space-y-6"
            onSubmit={(event) => {
                event.preventDefault();
                form.put('/admin/settings');
            }}
        >
            <PageHeader
                title="Settings"
                description="Checkout takes cash on delivery only. WhatsApp and Messenger stay on the perfume page."
                action={<button className="btn-dark" disabled={form.processing}>Save settings</button>}
            />
            {groups.map((group) => (
                <Card key={group.title} title={group.title} description={group.description}>
                    <div className="grid gap-4 md:grid-cols-2">
                        {group.keys.map((key) => (
                            <label key={key} className={areas.has(key) ? 'md:col-span-2' : toggles.has(key) ? 'md:col-span-2' : ''}>
                                {toggles.has(key) ? (
                                    <span className="flex items-center gap-3 rounded-xl border border-line px-3 py-3 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={form.data[key] === '1' || form.data[key] === 'true'}
                                            onChange={(event) => form.setData(key, event.target.checked ? '1' : '0')}
                                        />
                                        <Label>{labels[key]}</Label>
                                    </span>
                                ) : (
                                    <>
                                        <Label>{labels[key]}</Label>
                                        {areas.has(key) ? (
                                            <textarea value={form.data[key] ?? ''} onChange={(event) => form.setData(key, event.target.value)} className={inputClass} rows={4} />
                                        ) : (
                                            <input value={form.data[key] ?? ''} onChange={(event) => form.setData(key, event.target.value)} className={inputClass} />
                                        )}
                                    </>
                                )}
                            </label>
                        ))}
                    </div>
                </Card>
            ))}
        </form>
    );
}
