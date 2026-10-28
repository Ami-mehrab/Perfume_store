import { Link, usePage } from '@inertiajs/react';
import SeoHead from '@/components/store/seo-head';
import { translate } from '@/lib/i18n';
import type { Seo } from '@/types/store';

type Brand = {
    id: number;
    name: string;
    slug: string;
    country: string | null;
};

export default function Brands({ brands, seo }: { brands: Brand[]; seo: Seo }) {
    const { locale } = usePage().props;
    const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

    return (
        <>
            <SeoHead seo={seo} />
            <section className="mx-auto max-w-6xl px-4 py-10">
                <h1 className="text-3xl font-semibold text-charcoal">{t('brands')}</h1>
                <p className="mt-2 max-w-xl text-sm text-stone">
                    {locale === 'bn' ? 'আপনার পছন্দের হাউস বেছে নিন।' : 'Browse every house we carry.'}
                </p>
                <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
                    {brands.map((brand) => (
                        <Link
                            key={brand.id}
                            href={`/brands/${brand.slug}`}
                            className="rounded-2xl border border-line bg-white px-4 py-5 text-center transition hover:border-bronze/40"
                        >
                            <span className="font-semibold text-charcoal">{brand.name}</span>
                            {brand.country && <span className="mt-1 block text-sm text-stone">{brand.country}</span>}
                        </Link>
                    ))}
                </div>
            </section>
        </>
    );
}
