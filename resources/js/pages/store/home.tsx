import { Link, usePage } from '@inertiajs/react';
import BannerSlider, { type HomeBanner } from '@/components/store/banner-slider';
import ProductCard from '@/components/store/product-card';
import PromoBannerStrip, { type PromoBanner } from '@/components/store/promo-banner-strip';
import SeoHead from '@/components/store/seo-head';
import type { ProductCard as Card, Seo } from '@/types/store';

export default function Home({
    featuredProducts,
    newArrivals,
    trending,
    banners,
    promoBanners = [],
    seo,
}: {
    featuredProducts: Card[];
    newArrivals: Card[];
    trending: Card[];
    banners: HomeBanner[];
    promoBanners?: PromoBanner[];
    seo: Seo;
}) {
    const { locale, sections } = usePage().props;

    return (
        <>
            <SeoHead seo={seo} />
            <BannerSlider banners={banners} />

            <section className="mx-auto max-w-6xl px-4 py-5 md:py-6">
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:flex md:flex-wrap md:justify-center">
                    {sections.map((section) => {
                        const label = locale === 'bn' && section.name_bn ? section.name_bn : section.name;

                        return (
                            <Link
                                key={section.slug}
                                href={`/collections/${section.slug}`}
                                className="rounded-2xl border border-line bg-white px-2.5 py-3 text-center shadow-sm md:w-40 md:px-3 md:py-4"
                            >
                                <p className="truncate text-xs font-semibold tracking-wide md:text-sm">{label}</p>
                                <span className="relative mx-auto mt-2 block size-20 md:mt-3 md:size-24">
                                    {section.image ? (
                                        <img src={section.image} alt="" className="size-full rounded-full object-cover" />
                                    ) : (
                                        <span className="grid size-full place-items-center rounded-full bg-[#f3f4f6] text-base font-semibold text-stone md:text-lg">
                                            {label.slice(0, 1)}
                                        </span>
                                    )}
                                    <span className="absolute inset-x-1 bottom-1 truncate rounded-full bg-bronze px-1.5 py-0.5 text-[9px] font-semibold text-white md:px-2 md:text-[10px]">
                                        {label}
                                    </span>
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </section>

            <Shelf title={locale === 'bn' ? 'নতুন পণ্য' : 'New arrivals'} products={newArrivals} />
            <Shelf title={locale === 'bn' ? 'বেস্ট সেলার' : 'Best sellers'} products={featuredProducts} />
            <PromoBannerStrip banners={promoBanners} />
            <Shelf title={locale === 'bn' ? 'ট্রেন্ডিং' : 'Trending'} products={trending} />
        </>
    );
}

function Shelf({ title, products }: { title: string; products: Card[] }) {
    const { locale } = usePage().props;

    if (products.length === 0) {
        return null;
    }

    return (
        <section className="mx-auto max-w-6xl px-3 py-5 sm:px-4 md:py-6">
            <div className="mb-3 flex items-center justify-between gap-2 md:mb-4">
                <h2 className="text-lg font-semibold md:text-xl">{title}</h2>
                <Link href="/shop" className="shrink-0 text-sm text-bronze">
                    {locale === 'bn' ? 'সব দেখুন' : 'View all'}
                </Link>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4 md:gap-4">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </section>
    );
}
