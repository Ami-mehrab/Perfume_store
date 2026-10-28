import { Link, usePage } from '@inertiajs/react';
import AccountNav from '@/components/store/account-nav';
import { translate } from '@/lib/i18n';
import { formatMoney } from '@/lib/money';
import type { Paginator } from '@/types/store';

type Row = {
    number: string;
    status: string;
    payment_status: string;
    total_cents: number;
    placed_at: string;
};

export default function Orders({ orders }: { orders: Paginator<Row> }) {
    const { store, locale } = usePage().props;
    const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

    return (
        <div className="mx-auto max-w-3xl px-4 py-8">
            <h1 className="font-display text-4xl">{t('orders')}</h1>
            <div className="mt-5">
                <AccountNav />
            </div>
            {orders.data.length === 0 ? (
                <p className="mt-6 text-stone">{t('noOrders')}</p>
            ) : (
                <ul className="mt-6 space-y-3">
                    {orders.data.map((order) => (
                        <li key={order.number}>
                            <Link href={`/customer-account/orders/${order.number}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-4">
                                <span className="font-medium">{order.number}</span>
                                <span className="text-sm text-stone">{order.status} · {order.payment_status}</span>
                                <span>{formatMoney(order.total_cents, store)}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
