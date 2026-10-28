import { Link, router, usePage } from '@inertiajs/react';
import Bottle from '@/components/store/bottle';
import { perfumeNames, translate } from '@/lib/i18n';
import { formatMoney } from '@/lib/money';
import type { ProductCard } from '@/types/store';

export default function ProductCard({ product, removable = false }: { product: ProductCard; removable?: boolean }) {
    const { store, wishlistIds, locale } = usePage().props;
    const saved = wishlistIds.includes(product.id);
    const names = perfumeNames(locale, product.name, product.name_bn);
    const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
    const discount = product.discount_percent && product.discount_percent > 0 ? product.discount_percent : null;

    return (
        <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            <Link href={`/products/${product.slug}`} className="block min-w-0 flex-1">
                <div className="relative aspect-[4/5] overflow-hidden bg-[#f3f4f6]">
                    {product.image ? (
                        <img
                            src={product.image}
                            alt={product.image_alt}
                            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                            loading="lazy"
                            decoding="async"
                        />
                    ) : (
                        <Bottle
                            tone={product.swatch}
                            className="absolute inset-x-0 bottom-0 mx-auto h-[86%] w-auto transition duration-700 group-hover:-translate-y-2"
                        />
                    )}
                    {discount !== null && (
                        <span className="absolute top-2 left-2 rounded bg-[#ec4899] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase sm:top-3 sm:left-3 sm:px-2 sm:py-1">
                            {locale === 'bn' ? `${discount}% পর্যন্ত ছাড়` : `UP TO ${discount}% OFF`}
                        </span>
                    )}
                    {saved && (
                        <span className="absolute top-2 right-2 bg-black px-1.5 py-0.5 text-[10px] text-white sm:top-3 sm:right-3 sm:px-2 sm:py-1 sm:text-xs">
                            {t('saved')}
                        </span>
                    )}
                </div>
                <div className="space-y-0.5 px-2.5 pt-2.5 pb-1 sm:space-y-1 sm:p-3 sm:pb-1">
                    <p className="truncate text-[11px] text-stone sm:text-xs">{product.brand}</p>
                    <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-charcoal sm:text-base">{names.primary}</h3>
                    {names.secondary && (
                        <p className="hidden truncate text-sm text-stone sm:block">{names.secondary}</p>
                    )}
                    <p className="pt-0.5 text-sm font-semibold text-bronze tabular-nums">
                        {product.price_cents !== null && product.price_cents > 0
                            ? formatMoney(product.price_cents, store)
                            : locale === 'bn'
                              ? 'দাম শীঘ্রই'
                              : 'Price soon'}
                        {product.compare_at_cents && product.price_cents !== null && product.compare_at_cents > product.price_cents && (
                            <span className="ml-1.5 text-xs font-normal text-stone line-through sm:ml-2 sm:text-sm">
                                {formatMoney(product.compare_at_cents, store)}
                            </span>
                        )}
                    </p>
                    {!product.in_stock && (
                        <p className="text-[11px] font-medium text-stone sm:text-xs">
                            {locale === 'bn' ? 'স্টক আউট' : 'Stock out'}
                        </p>
                    )}
                </div>
            </Link>
            <Link
                href={`/products/${product.slug}`}
                className="mx-2.5 mb-2.5 mt-auto block rounded-md bg-[#1f2937] py-2 text-center text-xs text-white sm:mx-3 sm:mb-3 sm:text-sm"
            >
                {product.in_stock
                    ? locale === 'bn'
                        ? 'সাইজ দেখুন'
                        : 'Select options'
                    : locale === 'bn'
                      ? 'বিস্তারিত দেখুন'
                      : 'View details'}
            </Link>
            {removable && (
                <button
                    type="button"
                    className="mb-2 text-sm underline"
                    onClick={() => router.delete(`/wishlist/${product.slug}`, { preserveScroll: true })}
                >
                    {t('remove')}
                </button>
            )}
        </article>
    );
}
