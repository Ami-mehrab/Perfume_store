import { router } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import type { Paginator } from '@/types/store';

type Variant = {
    id: number;
    sku: string;
    stock: number;
    size_ml: number;
    concentration: string;
    product?: {
        name: string;
        slug: string;
        brand?: { name: string } | null;
    };
};

export default function Inventory({
    variants,
    threshold,
    filters = { q: '' },
}: {
    variants: Paginator<Variant>;
    threshold: number;
    filters?: { q: string };
}) {
    const [q, setQ] = useState(filters.q);

    function search(event: FormEvent) {
        event.preventDefault();
        router.get('/admin/inventory', { q: q.trim() || undefined }, { preserveState: true });
    }

    return (
        <div>
            <h1 className="font-display text-4xl">Inventory</h1>
            <p className="mt-2 text-sm text-stone">
                Every perfume size from your brands appears here — in stock and stock out.
                Low stock is {threshold} or fewer. Saving changes the live quantity used at checkout.
            </p>

            <form className="mt-6 flex flex-wrap gap-2" onSubmit={search}>
                <label className="sr-only" htmlFor="inventory-search">Search inventory</label>
                <input
                    id="inventory-search"
                    value={q}
                    onChange={(event) => setQ(event.target.value)}
                    placeholder="Search brand, perfume, or SKU"
                    className="w-full max-w-md rounded-lg border border-line bg-white px-3 py-2.5 text-sm"
                />
                <button type="submit" className="btn-line">Search</button>
                {filters.q !== '' && (
                    <button
                        type="button"
                        className="text-sm underline"
                        onClick={() => {
                            setQ('');
                            router.get('/admin/inventory', {}, { preserveState: true });
                        }}
                    >
                        Clear
                    </button>
                )}
            </form>

            <p className="mt-3 text-xs text-stone">
                {variants.total} size{variants.total === 1 ? '' : 's'}
                {filters.q ? ` matching “${filters.q}”` : ''}
            </p>

            <ul className="mt-4 divide-y divide-line">
                {variants.data.length === 0 && (
                    <li className="py-6 text-sm text-stone">
                        {filters.q ? 'No sizes match that search.' : 'No sizes to manage yet. Add a perfume first.'}
                    </li>
                )}
                {variants.data.map((variant) => (
                    <InventoryRow key={`${variant.id}-${variant.stock}`} variant={variant} threshold={threshold} />
                ))}
            </ul>

            {variants.last_page > 1 && (
                <nav className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm" aria-label="Inventory pages">
                    {variants.links.map((link, index) => {
                        const label = link.label.replace(/<[^>]*>/g, '');
                        const className = link.active
                            ? 'rounded-md bg-charcoal px-3 py-2 text-ivory'
                            : 'rounded-md border border-line px-3 py-2';

                        return link.url ? (
                            <button
                                key={index}
                                type="button"
                                className={className}
                                onClick={() => router.get(link.url!, {}, { preserveState: true, preserveScroll: true })}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ) : (
                            <span key={index} className={`${className} text-stone`} dangerouslySetInnerHTML={{ __html: link.label }} />
                        );
                    })}
                </nav>
            )}
        </div>
    );
}

function InventoryRow({ variant, threshold }: { variant: Variant; threshold: number }) {
    const [stock, setStock] = useState(String(variant.stock));
    const [saving, setSaving] = useState(false);
    const concentration = typeof variant.concentration === 'string'
        ? variant.concentration
        : String(variant.concentration ?? '');
    const brand = variant.product?.brand?.name;

    return (
        <li className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
            <span className={variant.stock <= threshold ? 'text-red-700' : ''}>
                {brand ? `${brand} · ` : ''}
                {variant.product?.name} · {concentration} · {variant.size_ml} ml · {variant.sku}
                {variant.stock <= 0 ? ' · Stock out' : ''}
            </span>
            <form
                className="flex items-center gap-2"
                onSubmit={(event) => {
                    event.preventDefault();
                    const next = Math.max(0, Math.trunc(Number(stock)) || 0);
                    setStock(String(next));
                    setSaving(true);
                    router.patch(`/admin/inventory/${variant.id}`, { stock: next }, {
                        preserveScroll: true,
                        onFinish: () => setSaving(false),
                    });
                }}
            >
                <label className="sr-only" htmlFor={`stock-${variant.id}`}>Stock for {variant.sku}</label>
                <input
                    id={`stock-${variant.id}`}
                    name="stock"
                    type="number"
                    min={0}
                    step={1}
                    value={stock}
                    onChange={(event) => setStock(event.target.value)}
                    className="w-20 border border-line bg-white px-2 py-1"
                />
                <button type="submit" className="underline disabled:opacity-50" disabled={saving}>
                    {saving ? 'Saving…' : 'Save'}
                </button>
            </form>
        </li>
    );
}
