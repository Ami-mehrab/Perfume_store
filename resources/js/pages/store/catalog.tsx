import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import ProductCard from '@/components/store/product-card';
import SeoHead from '@/components/store/seo-head';
import { translate } from '@/lib/i18n';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import type { Paginator, ProductCard as Card, Seo } from '@/types/store';

type Filters = {
    q: string;
    family: string;
    gender: string;
    concentration: string;
    min: string | number;
    max: string | number;
    sort: string;
    available: boolean;
    brand?: string | null;
    house?: string;
    collection?: string | null;
};

type Options = {
    brands: { name: string; slug: string }[];
    collections: { name: string; slug: string }[];
    families: string[];
    genders: string[];
    concentrations: { value: string; label: string }[];
};

export default function Catalog({
    title,
    introduction,
    products,
    filters,
    options,
    seo,
}: {
    title: string;
    introduction: string;
    products: Paginator<Card>;
    filters: Filters;
    options: Options;
    seo: Seo;
}) {
    const [open, setOpen] = useState(false);
    const page = usePage();
    const { locale, sections, store } = page.props;
    const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

    function apply(next: Partial<Filters>) {
        const data = { ...filters, ...next };
        const path = filters.collection
            ? `/collections/${filters.collection}`
            : filters.brand
              ? `/brands/${filters.brand}`
              : '/shop';

        router.get(path, {
            q: data.q || undefined,
            family: data.family || undefined,
            gender: data.gender || undefined,
            concentration: data.concentration || undefined,
            min: data.min || undefined,
            max: data.max || undefined,
            sort: data.sort || undefined,
            available: data.available ? 1 : undefined,
            house: data.house || undefined,
        }, { preserveState: true, preserveScroll: true });
        setOpen(false);
    }

    const fields = (
        <form
            className="space-y-6 text-sm"
            onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const house = form.getAll('house').map(String).filter(Boolean)[0] ?? '';
                apply({
                    q: String(form.get('q') || ''),
                    min: nonNegative(String(form.get('min') || '')),
                    max: nonNegative(String(form.get('max') || '')),
                    house,
                    sort: filters.sort,
                });
            }}
        >
            <div>
                <p className="font-semibold">{locale === 'bn' ? 'সেকশন' : 'Categories'}</p>
                <div className="mt-3 space-y-2">
                    {sections.map((section) => (
                        <Link key={section.slug} href={`/collections/${section.slug}`} className={`block ${filters.collection === section.slug ? 'font-semibold text-bronze' : ''}`}>
                            {locale === 'bn' && section.name_bn ? section.name_bn : section.name}
                        </Link>
                    ))}
                </div>
            </div>
            <div>
                <p className="font-semibold">{locale === 'bn' ? 'দাম' : 'Filter by price'}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                    <PriceField name="min" label={locale === 'bn' ? 'কমপক্ষে' : 'Min'} defaultValue={nonNegative(String(filters.min))} />
                    <PriceField name="max" label={locale === 'bn' ? 'সর্বোচ্চ' : 'Max'} defaultValue={nonNegative(String(filters.max))} />
                </div>
            </div>
            <div>
                <p className="font-semibold">{locale === 'bn' ? 'ব্র্যান্ড' : 'Top brands'}</p>
                <div className="mt-3 max-h-48 space-y-2 overflow-auto">
                    {options.brands.map((brand) => (
                        <label key={brand.slug} className="flex items-center gap-2">
                            <input type="checkbox" name="house" value={brand.slug} defaultChecked={filters.house === brand.slug || filters.brand === brand.slug} />
                            {brand.name}
                        </label>
                    ))}
                </div>
            </div>
            <input type="hidden" name="q" defaultValue={filters.q} />
            <button className="w-full rounded-md bg-bronze py-2 text-white" type="submit">
                {locale === 'bn' ? 'ফিল্টার' : 'Filter'}
            </button>
        </form>
    );

    return (
        <div className="bg-white">
            <SeoHead seo={seo} />
            <section className="bg-[#9d174d] px-4 py-10 text-center text-white">
                <h1 className="text-3xl font-semibold tracking-wide md:text-4xl">{title}</h1>
                <p className="mt-2 text-sm text-white/80">
                    <Link href="/">{t('home')}</Link>
                    <span className="px-2">/</span>
                    {title}
                </p>
            </section>
            <div className="mx-auto max-w-6xl px-3 py-6 sm:px-4 md:py-8">
                <div className="mb-4 flex flex-wrap items-center gap-2 sm:mb-6 sm:gap-4">
                    <button type="button" className="rounded-md border border-line px-3 py-2 text-sm md:hidden" onClick={() => setOpen(true)}>
                        {t('filter')}
                    </button>
                    <p className="text-xs text-stone sm:text-sm">
                        {products.total} {locale === 'bn' ? 'টি পণ্য' : 'products'}
                    </p>
                    <label className="ml-auto min-w-0 text-sm">
                        <span className="sr-only">{t('sort')}</span>
                        <select
                            className="max-w-[9.5rem] border border-line bg-white px-2 py-2 text-xs sm:max-w-none sm:px-3 sm:text-sm"
                            value={filters.sort}
                            onChange={(event) => apply({ sort: event.target.value })}
                        >
                            <option value="newest">{t('newest')}</option>
                            <option value="price_asc">{t('priceLow')}</option>
                            <option value="price_desc">{t('priceHigh')}</option>
                            <option value="name">{t('name')}</option>
                        </select>
                    </label>
                </div>
                <div className="grid gap-6 md:grid-cols-[220px_1fr] md:gap-8">
                    <aside className="hidden md:block">{fields}</aside>
                    <div>
                        {products.data.length === 0 ? (
                            <p className="text-xl sm:text-2xl">{t('noMatches')}</p>
                        ) : (
                            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:gap-4 lg:grid-cols-4">
                                {products.data.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        )}
                        <nav className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm md:mt-10" aria-label="Pagination">
                            {products.links.map((link, index) => {
                                const label = link.label.replace(/<[^>]*>/g, '');
                                const number = /^\d+$/.test(label.trim());
                                const className = number
                                    ? `grid size-9 place-items-center rounded-md ${link.active ? 'bg-bronze text-white' : 'border border-line'}`
                                    : `rounded-md px-3 py-2 ${link.active ? 'bg-bronze text-white' : 'border border-line text-charcoal'}`;

                                return link.url ? (
                                    <a key={index} href={link.url} className={className} dangerouslySetInnerHTML={{ __html: link.label }} />
                                ) : (
                                    <span key={index} className={`${className} text-stone`} dangerouslySetInnerHTML={{ __html: link.label }} />
                                );
                            })}
                        </nav>
                    </div>
                </div>
                <section className="mt-12 rounded-2xl bg-[#111827] px-6 py-8 text-white">
                    <p className="max-w-3xl text-sm leading-6 text-white/80">{introduction || store.about}</p>
                </section>
            </div>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="left" className="overflow-y-auto bg-white text-charcoal">
                    <SheetTitle className="text-2xl">{t('filters')}</SheetTitle>
                    <div className="mt-6">{fields}</div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

function nonNegative(value: string): string {
    if (value.trim() === '') {
        return '';
    }

    const amount = Number(value);

    if (Number.isNaN(amount) || amount < 0) {
        return '0';
    }

    return String(amount);
}

function PriceField({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
    return (
        <label className="block min-w-0">
            <span className="text-xs text-stone">{label}</span>
            <input
                name={name}
                type="number"
                min={0}
                step="1"
                defaultValue={defaultValue}
                placeholder="0"
                className="mt-1 w-full border border-line px-2 py-2 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                onInput={(event) => {
                    if (event.currentTarget.value !== '' && Number(event.currentTarget.value) < 0) {
                        event.currentTarget.value = '0';
                    }
                }}
            />
        </label>
    );
}

