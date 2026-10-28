import { Link, usePage } from '@inertiajs/react';
import ProductCard from '@/components/store/product-card';
import SeoHead from '@/components/store/seo-head';
import { translate } from '@/lib/i18n';
import type { ProductCard as Card, Seo } from '@/types/store';

export default function Wishlist({ products, seo }: { products: Card[]; seo: Seo }) {
    const { locale } = usePage().props;
    const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

    return (
        <>
            <SeoHead seo={seo} />
            <div className="mx-auto max-w-6xl px-4 py-10">
                <h1 className="font-display text-5xl">{t('saved')}</h1>
                {products.length === 0 ? (
                    <div className="mt-8">
                        <p className="text-stone">{t('noSaved')}</p>
                        <Link href="/shop" className="btn-dark mt-6">{t('shop')}</Link>
                    </div>
                ) : (
                    <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} removable />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
