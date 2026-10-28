import { Link, usePage } from '@inertiajs/react';
import { Heart, MapPin, ShoppingBag } from 'lucide-react';
import type { ReactNode } from 'react';
import AccountNav from '@/components/store/account-nav';
import CustomerLogin from '@/components/store/customer-login';
import { translate } from '@/lib/i18n';
import { formatMoney } from '@/lib/money';
import { register } from '@/routes';

type OrderRow = {
    number: string;
    tracking_token: string;
    status: string;
    payment_status: string;
    total_cents: number;
    placed_at: string;
};

export default function AccountHome({
    guest = false,
    orders,
    addressCount,
}: {
    guest?: boolean;
    orders: OrderRow[];
    addressCount: number;
}) {
    const { auth, store, locale, wishlistIds } = usePage().props;
    const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
    const shopper = auth.user?.role === 'customer' ? auth.user : null;

    if (guest || !shopper) {
        return <CustomerLoginPage />;
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-8">
            <p className="text-sm text-stone">{t('myAccount')}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-charcoal capitalize">{shopper.name}</h1>
            <p className="mt-1 text-sm text-stone">{shopper.email}</p>
            <div className="mt-6">
                <AccountNav />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
                <Stat href="/customer-account/orders" label={t('orders')} value={orders.length} icon={<ShoppingBag className="size-4 text-[#9d174d]" />} />
                <Stat href="/customer-account/addresses" label={t('addresses')} value={addressCount} icon={<MapPin className="size-4 text-[#9d174d]" />} />
                <Stat href="/wishlist" label={t('wishlist')} value={wishlistIds.length} icon={<Heart className="size-4 text-[#9d174d]" />} />
            </div>
            <h2 className="mt-10 text-2xl font-semibold text-charcoal">{t('recentOrders')}</h2>
            {orders.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-line bg-white p-5">
                    <p className="text-stone">{t('noOrders')}</p>
                    <Link href="/shop" className="btn-dark mt-4">
                        {t('shop')}
                    </Link>
                </div>
            ) : (
                <ul className="mt-4 space-y-3">
                    {orders.map((order) => (
                        <li key={order.number}>
                            <Link
                                href={`/customer-account/orders/${order.number}`}
                                className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-4"
                            >
                                <span>
                                    <span className="block font-medium">{order.number}</span>
                                    <span className="text-sm text-stone">
                                        {order.status} · {order.payment_status}
                                    </span>
                                </span>
                                <span>{formatMoney(order.total_cents, store)}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function Stat({ href, label, value, icon }: { href: string; label: string; value: number; icon: ReactNode }) {
    return (
        <Link href={href} className="rounded-2xl border border-line bg-white p-3 sm:p-4">
            <span className="flex items-center gap-1.5 text-xs text-stone sm:text-sm">
                {icon}
                <span className="truncate">{label}</span>
            </span>
            <span className="mt-2 block text-2xl font-semibold text-charcoal tabular-nums sm:text-3xl">{value}</span>
        </Link>
    );
}

function CustomerLoginPage() {
    const { locale } = usePage().props;
    const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

    return (
        <div className="mx-auto max-w-md px-4 py-12">
            <p className="text-sm text-stone">{t('myAccount')}</p>
            <div className="mt-4">
                <CustomerLogin copy={t('customerSignInCopy')} />
            </div>
            <p className="mt-4 text-sm text-stone">
                {t('noAccount')}{' '}
                <Link href={register()} className="underline">
                    {t('signUp')}
                </Link>
            </p>
        </div>
    );
}
