import { Link, usePage } from '@inertiajs/react';
import SeoHead from '@/components/store/seo-head';
import { translate } from '@/lib/i18n';
import { formatMoney } from '@/lib/money';
import type { PublicOrder, Seo, StoreProfile } from '@/types/store';

export default function Confirmation({ order, seo }: { order: PublicOrder; seo: Seo }) {
    const { store, locale } = usePage().props;
    const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

    return (
        <>
            <SeoHead seo={seo} />
            <div className="mx-auto max-w-3xl px-4 py-12">
                <p className="text-sm text-stone">{t('orderPlaced')}</p>
                <p className="mt-6 text-sm font-medium">{t('yourOrderNumber')}</p>
                <p className="mt-1 font-display text-4xl tracking-wide text-charcoal md:text-5xl">{order.number}</p>
                <p className="mt-4 text-sm leading-6 text-stone">
                    {t('payment')}: {order.payment_status_label}. {t('fulfillment')}: {order.status_label}. {t('saveOrderNumber')}
                </p>
                <Link href="/customer-account/orders" className="btn-dark mt-6 inline-flex">
                    {t('myAccount')}
                </Link>
                <OrderBody order={order} symbol={store} />
                <Link href="/orders/track" className="btn-line mt-8">
                    {t('track')}
                </Link>
            </div>
        </>
    );
}

export function OrderBody({ order, symbol }: { order: PublicOrder; symbol: StoreProfile }) {
    return (
        <div className="mt-8 border border-line p-5">
            <ul className="space-y-3 text-sm">
                {order.items.map((item) => (
                    <li key={item.sku} className="flex justify-between gap-4">
                        <span>
                            {item.product_name}
                            <span className="block text-stone">{item.concentration_label} · {item.size_ml} ml · {item.sku} × {item.quantity}</span>
                        </span>
                        <span>{formatMoney(item.line_total_cents, symbol)}</span>
                    </li>
                ))}
            </ul>
            <dl className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
                <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatMoney(order.subtotal_cents, symbol)}</dd></div>
                {order.discount_cents > 0 && <div className="flex justify-between"><dt>Discount</dt><dd>−{formatMoney(order.discount_cents, symbol)}</dd></div>}
                <div className="flex justify-between"><dt>Delivery</dt><dd>{formatMoney(order.shipping_cents, symbol)}</dd></div>
                <div className="flex justify-between font-display text-2xl"><dt>Total</dt><dd>{formatMoney(order.total_cents, symbol)}</dd></div>
            </dl>
            <p className="mt-4 text-sm text-stone">
                {order.shipping_address.line1}, {order.shipping_address.city}, {order.shipping_address.country}
            </p>
        </div>
    );
}
