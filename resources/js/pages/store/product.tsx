import { Link, router, useForm, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import Bottle from '@/components/store/bottle';
import { MessengerIcon, WhatsAppIcon } from '@/components/store/chat-widget';
import OrderModal from '@/components/store/order-modal';
import PreorderModal from '@/components/store/preorder-modal';
import ProductCard from '@/components/store/product-card';
import SeoHead from '@/components/store/seo-head';
import { cartVisit } from '@/lib/cart-visit';
import { perfumeNames, term, translate } from '@/lib/i18n';
import { formatMoney } from '@/lib/money';
import type { ProductCard as Card, ProductDetail, Seo } from '@/types/store';

type PublicReview = {
    id: number;
    rating: number;
    body: string;
    is_featured: boolean;
    author: string;
    created_at: string | null;
};

type ReviewSummary = {
    count: number;
    average: number | null;
};

export default function ProductPage({
    product,
    related,
    seo,
    jsonLd,
    reviews = [],
    reviewSummary = { count: 0, average: null },
    canReview = false,
}: {
    product: ProductDetail;
    related: Card[];
    seo: Seo;
    jsonLd: Record<string, unknown>;
    reviews?: PublicReview[];
    reviewSummary?: ReviewSummary;
    canReview?: boolean;
}) {
    const { store, wishlistIds, errors, locale, auth } = usePage().props;
    const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
    const names = perfumeNames(locale, product.name, product.name_bn);
    const description = locale === 'bn' && product.description_bn ? product.description_bn : product.description;
    const activeVariants = product.variants.filter((variant) => variant.is_active);
    const [variantId, setVariantId] = useState<number | ''>(
        activeVariants.find((variant) => variant.in_stock)?.id ?? activeVariants[0]?.id ?? '',
    );
    const selected = activeVariants.find((variant) => variant.id === variantId);
    const [quantity, setQuantity] = useState(1);
    const [image, setImage] = useState(0);
    const [tab, setTab] = useState<'description' | 'details' | 'reviews'>('description');
    const [orderOpen, setOrderOpen] = useState(false);
    const [preorderOpen, setPreorderOpen] = useState(false);
    const shopper = auth.user?.role === 'customer' ? auth.user : null;
    const reviewForm = useForm({ rating: 5, body: '' });
    const saved = wishlistIds.includes(product.id);
    const photos = product.images;
    const phone = store.whatsapp_phone.replace(/\D/g, '');
    const chatText = encodeURIComponent(`${names.primary}${selected ? ` ${selected.size_ml} ml` : ''}`);

    function thumbStart(current: number, total: number): number {
        const windowSize = 3;

        if (total <= windowSize) {
            return 0;
        }

        return Math.min(Math.max(0, current - 1), total - windowSize);
    }

    function addToCart(thenCheckout = false) {
        if (!selected) {
            return;
        }

        router.post('/cart', { variant_id: selected.id, quantity, quiet: thenCheckout }, {
            ...cartVisit,
            onSuccess: () => {
                if (thenCheckout) {
                    setOrderOpen(true);
                }
            },
        });
    }

    return (
        <div className="bg-white">
            <SeoHead seo={seo} jsonLd={jsonLd} />
            <div className="mx-auto max-w-6xl px-4 py-6">
                <p className="text-sm text-stone">
                    <Link href="/">{t('home')}</Link>
                    <span className="px-2">/</span>
                    <Link href="/shop">{t('shop')}</Link>
                    <span className="px-2">/</span>
                    <span>{names.primary}</span>
                </p>

                <div className="mt-6 grid gap-10 md:grid-cols-2">
                    <div>
                        <div className="aspect-square overflow-hidden rounded-2xl bg-[#f3f4f6]">
                            {photos[image] ? (
                                <img src={photos[image].url} alt={photos[image].alt} className="h-full w-full object-contain p-6" />
                            ) : (
                                <div className="relative h-full">
                                    <Bottle tone={product.swatch} className="absolute inset-x-0 bottom-8 mx-auto h-[78%] w-auto" />
                                </div>
                            )}
                        </div>
                        {photos.length > 1 && (
                            <div className="mt-4 flex items-center gap-2">
                                <button type="button" className="grid size-9 shrink-0 place-items-center text-stone" aria-label="Previous photo" onClick={() => setImage((value) => (value === 0 ? photos.length - 1 : value - 1))}>
                                    <ChevronLeft className="size-5" />
                                </button>
                                <div className="flex min-w-0 flex-1 justify-center gap-3">
                                    {photos.slice(thumbStart(image, photos.length), thumbStart(image, photos.length) + 3).map((photo) => {
                                        const index = photos.findIndex((item) => item.id === photo.id);

                                        return (
                                            <button key={photo.id} type="button" onClick={() => setImage(index)} aria-label={photo.alt} className={`size-20 shrink-0 overflow-hidden rounded-xl border-2 bg-[#f3f4f6] ${image === index ? 'border-[#db2777]' : 'border-transparent'}`}>
                                                <img src={photo.url} alt="" className="h-full w-full object-contain p-1" />
                                            </button>
                                        );
                                    })}
                                </div>
                                <button type="button" className="grid size-9 shrink-0 place-items-center text-stone" aria-label="Next photo" onClick={() => setImage((value) => (value === photos.length - 1 ? 0 : value + 1))}>
                                    <ChevronRight className="size-5" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-charcoal md:text-4xl">{names.primary}</h1>
                        {names.secondary && <p className="mt-1 text-stone">{names.secondary}</p>}
                        <p className="mt-3 text-sm text-stone">
                            {reviewSummary.count > 0 && reviewSummary.average !== null
                                ? (locale === 'bn'
                                    ? `${reviewSummary.average} ★ · ${reviewSummary.count} রিভিউ`
                                    : `${reviewSummary.average} ★ · ${reviewSummary.count} review${reviewSummary.count === 1 ? '' : 's'}`)
                                : (locale === 'bn' ? 'এখনও কোনো রিভিউ নেই' : 'No reviews yet')}
                        </p>
                        <p className="mt-4 text-2xl font-semibold text-bronze">
                            {selected?.compare_at_cents && selected.compare_at_cents > selected.price_cents && (
                                <span className="mr-3 text-lg font-normal text-stone line-through">{formatMoney(selected.compare_at_cents, store)}</span>
                            )}
                            {selected ? formatMoney(selected.price_cents, store) : (locale === 'bn' ? 'সাইজ বেছে নিন' : 'Choose a size')}
                        </p>

                        <div className="mt-6">
                            <p className="text-sm font-medium">{t('size')}</p>
                            <div className="mt-3 flex flex-wrap gap-3">
                                {activeVariants.map((variant) => {
                                    const picked = variant.id === variantId;
                                    const sharedSize = activeVariants.filter((item) => item.size_ml === variant.size_ml).length > 1;

                                    return (
                                        <button
                                            key={variant.id}
                                            type="button"
                                            aria-pressed={picked}
                                            className={`min-w-24 rounded-lg border-2 px-5 py-3 text-sm font-semibold tracking-wide ${picked ? 'border-charcoal bg-white' : 'border-transparent bg-[#f3f4f6]'} ${variant.in_stock ? '' : 'text-stone'}`}
                                            onClick={() => setVariantId(variant.id)}
                                        >
                                            {variant.size_ml}ML{sharedSize ? ` ${variant.concentration_label}` : ''}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {selected?.in_stock ? (
                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                <div className="inline-flex items-center rounded-full border border-line">
                                    <button type="button" className="px-3 py-2" aria-label="Less" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>
                                        <Minus className="size-4" />
                                    </button>
                                    <span className="min-w-8 text-center text-sm">{quantity}</span>
                                    <button type="button" className="px-3 py-2" aria-label="More" onClick={() => setQuantity((value) => value + 1)}>
                                        <Plus className="size-4" />
                                    </button>
                                </div>
                                <button type="button" className="rounded-full bg-[#c45c86] px-8 py-3 text-sm font-medium text-white" onClick={() => addToCart(false)}>
                                    {locale === 'bn' ? 'ব্যাগে যোগ করুন' : 'Add to cart'}
                                </button>
                            </div>
                        ) : (
                            <button type="button" className="mt-4 w-full rounded-md bg-[#ff2d6a] py-3 text-sm font-semibold tracking-wide text-white uppercase" disabled={!selected} onClick={() => setPreorderOpen(true)}>
                                {t('preorder')}
                            </button>
                        )}
                        {errors?.quantity && <p className="mt-3 text-sm text-red-700" role="alert">{errors.quantity}</p>}

                        {selected?.in_stock && (
                            <button type="button" className="mt-3 w-full rounded-md bg-[#ff2d6a] py-3 text-sm font-semibold text-white" onClick={() => addToCart(true)}>
                                {locale === 'bn' ? 'এখনই অর্ডার করুন · ক্যাশ অন ডেলিভারি' : 'ORDER NOW · Cash on delivery'}
                            </button>
                        )}

                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            {phone !== '' && (
                                <a className="flex items-center justify-center gap-2 rounded-md bg-[#25D366] py-3 text-sm font-semibold text-white shadow-sm" href={`https://wa.me/${phone}?text=${chatText}`} target="_blank" rel="noreferrer">
                                    <WhatsAppIcon />
                                    {t('chatOnWhatsapp')}
                                </a>
                            )}
                            {store.messenger_url !== '' && (
                                <a className="flex items-center justify-center gap-2 rounded-md bg-[#0084ff] py-3 text-sm font-semibold text-white shadow-sm" href={store.messenger_url} target="_blank" rel="noreferrer">
                                    <MessengerIcon />
                                    {t('chatOnMessenger')}
                                </a>
                            )}
                        </div>

                        <button type="button" className="mt-4 text-sm underline" onClick={() => router.post('/wishlist', { product_id: product.id }, { preserveScroll: true })}>
                            {saved ? t('saved') : (locale === 'bn' ? 'উইশলিস্টে যোগ করুন' : 'Add to wishlist')}
                        </button>

                        <dl className="mt-6 space-y-1 text-sm text-stone">
                            <div>SKU: <span className="text-charcoal">{selected?.sku ?? '—'}</span></div>
                            <div>{locale === 'bn' ? 'কাদের জন্য' : 'For'}: <span className="text-charcoal">{term(locale, product.gender)}</span></div>
                            {product.brand && <div>{locale === 'bn' ? 'ব্র্যান্ড' : 'Brand'}: <span className="text-charcoal">{product.brand}</span></div>}
                            <div>{locale === 'bn' ? 'স্টক' : 'Stock'}: <span className="text-charcoal">{selected ? selected.stock : '—'}</span></div>
                        </dl>

                        <div className="mt-6 divide-y divide-line border-y border-line text-sm">
                            <details className="py-3">
                                <summary className="cursor-pointer font-medium">{locale === 'bn' ? 'ওয়ারেন্টি' : 'Warranty & guarantee'}</summary>
                                <p className="mt-2 leading-6 text-stone">{store.warranty_text}</p>
                            </details>
                            <details className="py-3">
                                <summary className="cursor-pointer font-medium">{locale === 'bn' ? 'শিপিং ও ফেরত' : 'Shipping & returns'}</summary>
                                <p className="mt-2 leading-6 text-stone">{store.delivery_estimate}. {store.returns_text}</p>
                            </details>
                            <details className="py-3" open>
                                <summary className="cursor-pointer font-medium">{locale === 'bn' ? 'ঘ্রাণের নোট' : 'Fragrance notes'}</summary>
                                <p className="mt-2 leading-6 text-stone">{[...product.top_notes, ...product.heart_notes, ...product.base_notes].filter((note) => note !== '—').join(', ')}</p>
                            </details>
                        </div>
                    </div>
                </div>

                <div className="mt-12 border-b border-line">
                    <button type="button" className={`mr-6 border-b-2 pb-3 text-sm ${tab === 'description' ? 'border-charcoal font-semibold' : 'border-transparent text-stone'}`} onClick={() => setTab('description')}>
                        {locale === 'bn' ? 'বর্ণনা' : 'Description'}
                    </button>
                    <button type="button" className={`mr-6 border-b-2 pb-3 text-sm ${tab === 'details' ? 'border-charcoal font-semibold' : 'border-transparent text-stone'}`} onClick={() => setTab('details')}>
                        {locale === 'bn' ? 'অতিরিক্ত তথ্য' : 'Additional information'}
                    </button>
                    <button type="button" className={`border-b-2 pb-3 text-sm ${tab === 'reviews' ? 'border-charcoal font-semibold' : 'border-transparent text-stone'}`} onClick={() => setTab('reviews')}>
                        {locale === 'bn' ? 'রিভিউ' : 'Reviews'}
                        {reviewSummary.count > 0 ? ` (${reviewSummary.count})` : ''}
                    </button>
                </div>
                <div className="max-w-3xl py-6 text-sm leading-7">
                    {tab === 'description' && description}
                    {tab === 'details' && (
                        <p>{term(locale, product.family)} · {term(locale, product.gender)}{product.story ? ` · ${product.story}` : ''}</p>
                    )}
                    {tab === 'reviews' && (
                        <div className="space-y-8">
                            {reviews.length === 0 ? (
                                <p className="text-stone">{locale === 'bn' ? 'এখনও কোনো অনুমোদিত রিভিউ নেই।' : 'No  reviews yet.'}</p>
                            ) : (
                                <ul className="space-y-5">
                                    {reviews.map((review) => (
                                        <li key={review.id} className="border-b border-line pb-5 last:border-0">
                                            <p className="font-medium text-charcoal">
                                                {review.author}
                                                {review.is_featured ? (locale === 'bn' ? ' · বৈশিষ্ট্যযুক্ত' : ' · Featured') : ''}
                                            </p>
                                            <p className="mt-1 text-stone">{review.rating}/5{review.created_at ? ` · ${review.created_at}` : ''}</p>
                                            <p className="mt-2 leading-6 text-charcoal">{review.body}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {shopper && canReview ? (
                                <form
                                    className="space-y-3 rounded-2xl border border-line bg-[#faf7f2] p-4"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        reviewForm.post(`/products/${product.slug}/reviews`, {
                                            preserveScroll: true,
                                            onSuccess: () => reviewForm.reset('body'),
                                        });
                                    }}
                                >
                                    <h3 className="font-medium text-charcoal">{locale === 'bn' ? 'রিভিউ লিখুন' : 'Write a review'}</h3>
                                    <label className="block">
                                        {locale === 'bn' ? 'রেটিং' : 'Rating'}
                                        <select
                                            value={reviewForm.data.rating}
                                            onChange={(event) => reviewForm.setData('rating', Number(event.target.value))}
                                            className="mt-1 w-full border border-line bg-white px-3 py-2"
                                        >
                                            {[5, 4, 3, 2, 1].map((value) => (
                                                <option key={value} value={value}>{value}/5</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="block">
                                        {locale === 'bn' ? 'আপনার মতামত' : 'Your review'}
                                        <textarea
                                            value={reviewForm.data.body}
                                            onChange={(event) => reviewForm.setData('body', event.target.value)}
                                            rows={4}
                                            className="mt-1 w-full border border-line bg-white px-3 py-2"
                                            required
                                            minLength={10}
                                        />
                                    </label>
                                    {(reviewForm.errors.body || errors?.body) && (
                                        <p className="text-sm text-red-700" role="alert">{reviewForm.errors.body || errors?.body}</p>
                                    )}
                                    <button type="submit" className="btn-dark" disabled={reviewForm.processing}>
                                        {locale === 'bn' ? 'অনুমোদনের জন্য পাঠান' : 'Submit for approval'}
                                    </button>
                                </form>
                            ) : shopper ? (
                                <p className="text-stone">{locale === 'bn' ? 'আপনি ইতিমধ্যে এই পারফিউমের জন্য রিভিউ দিয়েছেন।' : 'You already submitted a review for this perfume.'}</p>
                            ) : (
                                <p className="text-stone">
                                    <Link href="/customer-account" className="underline">{locale === 'bn' ? 'সাইন ইন করুন' : 'Sign in'}</Link>
                                    {locale === 'bn' ? ' রিভিউ লিখতে।' : ' to write a review.'}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {orderOpen && <OrderModal onClose={() => setOrderOpen(false)} />}
            {preorderOpen && selected && (
                <PreorderModal
                    productId={product.id}
                    productName={product.name}
                    productNameBn={product.name_bn}
                    variantId={selected.id}
                    sizeMl={selected.size_ml}
                    onClose={() => setPreorderOpen(false)}
                />
            )}
            {related.length > 0 && (
                <section className="mx-auto max-w-6xl px-4 py-10">
                    <h2 className="mb-6 text-center text-2xl font-semibold">{locale === 'bn' ? 'আপনার পছন্দ হতে পারে' : 'You may also like'}</h2>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {related.map((item) => (
                            <ProductCard key={item.id} product={item} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
