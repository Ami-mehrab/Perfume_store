import { Link, router, usePage } from '@inertiajs/react';
import { Minus, Plus, X } from 'lucide-react';
import { useState } from 'react';
import Bottle from '@/components/store/bottle';
import OrderModal from '@/components/store/order-modal';
import PageBanner from '@/components/store/page-banner';
import SeoHead from '@/components/store/seo-head';
import { cartVisit } from '@/lib/cart-visit';
import { perfumeNames, translate } from '@/lib/i18n';
import { formatMoney } from '@/lib/money';
import type { CartPayload, Seo } from '@/types/store';

export default function Cart({ cart, seo }: { cart: CartPayload; seo: Seo }) {
    const { store, errors, locale } = usePage().props;
    const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
    const [orderOpen, setOrderOpen] = useState(false);
    const [zonesOpen, setZonesOpen] = useState(false);
    const zone = cart.quote.shipping_zone === 'outside' ? 'outside' : 'inside';
    const place = zone === 'outside' ? t('outsideDhaka') : 'Dhaka';

    return (
        <>
            <SeoHead seo={seo} />
            <PageBanner title={t('yourCart')} crumb={t('yourCart')} />
            <div className="mx-auto max-w-6xl px-4 py-8">
                {errors?.cart && <p className="mb-4 text-sm text-red-700" role="alert">{errors.cart}</p>}
                {errors?.quantity && <p className="mb-4 text-sm text-red-700" role="alert">{errors.quantity}</p>}
                {cart.items.length === 0 ? (
                    <div className="py-10">
                        <p className="text-stone">{t('bagEmpty')}</p>
                        <Link href="/shop" className="btn-dark mt-6 inline-flex">{t('browsePerfumes')}</Link>
                    </div>
                ) : (
                    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
                        <div>
                            <div className="overflow-x-auto rounded-md border border-[#eee]">
                                <table className="w-full min-w-[640px] text-sm">
                                    <thead className="bg-[#fafafa] text-left">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">{t('product')}</th>
                                            <th className="px-4 py-3 font-medium">{t('price')}</th>
                                            <th className="px-4 py-3 font-medium">{t('quantity')}</th>
                                            <th className="px-4 py-3 text-right font-medium text-[#9d174d]">{t('subtotal')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cart.items.map((item) => {
                                            const names = perfumeNames(locale, item.product_name, item.product_name_bn);

                                            return (
                                                <tr key={item.id} className="border-t border-[#eee]">
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <button type="button" aria-label={t('remove')} className="text-stone" onClick={() => router.delete(`/cart/items/${item.id}`, cartVisit)}>
                                                                <X className="size-4" />
                                                            </button>
                                                            <div className="flex size-12 items-center justify-center overflow-hidden rounded border border-[#eee] bg-[#f8f8f8]">
                                                                {item.image ? (
                                                                    <img src={item.image} alt={item.image_alt ?? ''} className="h-full w-full object-cover" />
                                                                ) : (
                                                                    <Bottle tone={item.swatch} className="h-10" />
                                                                )}
                                                            </div>
                                                            <Link href={`/products/${item.product_slug}`} className="font-medium">
                                                                {names.primary}{item.size_ml ? ` – ${item.size_ml}ml` : ''}
                                                            </Link>
                                                        </div>
                                                        {!item.available && <p className="mt-1 text-xs text-red-700">{t('unavailable')}</p>}
                                                    </td>
                                                    <td className="px-4 py-4 text-[#9d174d]">{formatMoney(item.unit_price_cents, store)}</td>
                                                    <td className="px-4 py-4">
                                                        <div className="inline-flex items-center rounded-full border border-[#ddd]">
                                                            <button type="button" className="px-2 py-1" aria-label="Less" onClick={() => router.patch(`/cart/items/${item.id}`, { quantity: Math.max(1, item.quantity - 1) }, cartVisit)}>
                                                                <Minus className="size-3" />
                                                            </button>
                                                            <span className="min-w-6 text-center">{item.quantity}</span>
                                                            <button type="button" className="px-2 py-1" aria-label="More" onClick={() => router.patch(`/cart/items/${item.id}`, { quantity: item.quantity + 1 }, cartVisit)}>
                                                                <Plus className="size-3" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-right font-medium text-[#9d174d]">{formatMoney(item.line_total_cents, store)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                <form
                                    className="flex"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        const code = new FormData(event.currentTarget).get('code');
                                        router.post('/cart/coupon', { code }, cartVisit);
                                    }}
                                >
                                    <label className="sr-only" htmlFor="coupon">{t('coupon')}</label>
                                    <input id="coupon" name="code" placeholder={t('couponCode')} className="h-10 w-40 rounded-l border border-[#ddd] px-3 text-sm" />
                                    <button className="h-10 rounded-r border border-l-0 border-[#ddd] bg-[#f3f4f6] px-3 text-sm" type="submit">{t('applyCoupon')}</button>
                                </form>
                                <button type="button" className="h-10 rounded border border-[#ddd] bg-[#f3f4f6] px-4 text-sm" onClick={() => router.reload({ only: ['cart', 'cartCount'] })}>
                                    {t('updateCart')}
                                </button>
                            </div>
                            {errors?.coupon && <p className="mt-2 text-sm text-red-700" role="alert">{errors.coupon}</p>}
                            {cart.quote.coupon_code && (
                                <button type="button" className="mt-2 text-sm underline" onClick={() => router.delete('/cart/coupon', cartVisit)}>
                                    {t('remove')} {cart.quote.coupon_code}
                                </button>
                            )}
                        </div>
                        <aside>
                            <h2 className="text-2xl font-semibold">{t('cartTotals')}</h2>
                            <dl className="mt-4 border border-[#eee] text-sm">
                                <div className="flex justify-between border-b border-[#eee] px-4 py-3">
                                    <dt>{t('subtotal')}</dt>
                                    <dd className="text-[#9d174d]">{formatMoney(cart.quote.subtotal_cents, store)}</dd>
                                </div>
                                {cart.quote.discount_cents > 0 && (
                                    <div className="flex justify-between border-b border-[#eee] px-4 py-3">
                                        <dt>{t('discount')}</dt>
                                        <dd>−{formatMoney(cart.quote.discount_cents, store)}</dd>
                                    </div>
                                )}
                                <div className="border-b border-[#eee] px-4 py-3">
                                    <div className="flex justify-between">
                                        <dt>{t('shipment')}</dt>
                                        <dd className="text-right">
                                            <span className="block">{zone === 'outside' ? t('outsideDhaka') : t('insideDhaka')}: {cart.quote.shipping_cents === 0 ? t('free') : formatMoney(cart.quote.shipping_cents, store)}</span>
                                            <span className="mt-1 block text-stone">{t('shippingTo')} {place}.</span>
                                            <button type="button" className="text-[#9d174d] underline" onClick={() => setZonesOpen((open) => !open)}>{t('changeAddress')}</button>
                                        </dd>
                                    </div>
                                    {zonesOpen && (
                                        <div className="mt-3 space-y-2">
                                            <ZoneButton current={zone} value="inside" label={`${t('insideDhaka')} · ${formatMoney(store.shipping_inside_cents, store)}`} />
                                            <ZoneButton current={zone} value="outside" label={`${t('outsideDhaka')} · ${formatMoney(store.shipping_outside_cents, store)}`} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-between px-4 py-3 font-semibold">
                                    <dt>{t('total')}</dt>
                                    <dd className="text-[#9d174d]">{formatMoney(cart.quote.total_cents, store)}</dd>
                                </div>
                            </dl>
                            <Link href="/checkout" className="mt-4 flex h-12 items-center justify-center rounded bg-[#7c3aed] text-sm font-semibold text-white">
                                {t('proceedCheckout')}
                            </Link>
                            <button type="button" className="mt-3 flex h-12 w-full items-center justify-center rounded bg-[#ff2d6a] text-sm font-semibold text-white" onClick={() => setOrderOpen(true)}>
                                {t('orderNowCod')}
                            </button>
                        </aside>
                    </div>
                )}
            </div>
            {orderOpen && <OrderModal onClose={() => setOrderOpen(false)} />}
        </>
    );
}

function ZoneButton({ current, value, label }: { current: string; value: 'inside' | 'outside'; label: string }) {
    return (
        <button
            type="button"
            className={`block w-full rounded border px-3 py-2 text-left text-sm ${current === value ? 'border-charcoal' : 'border-[#eee]'}`}
            onClick={() => router.post('/cart/shipping', { zone: value }, cartVisit)}
        >
            {label}
        </button>
    );
}
