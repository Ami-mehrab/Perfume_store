import { useForm, usePage } from '@inertiajs/react';
import AccountNav from '@/components/store/account-nav';
import { translate } from '@/lib/i18n';
import { OrderBody } from '@/pages/store/confirmation';
import type { PublicOrder } from '@/types/store';

export default function AccountOrder({ order }: { order: PublicOrder }) {
    const { store, errors, locale } = usePage().props;
    const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
    const form = useForm({ reason: '' });

    return (
        <div className="mx-auto max-w-3xl px-4 py-8">
            <AccountNav />
            <p className="mt-6 text-sm text-stone">{t('yourOrderNumber')}</p>
            <h1 className="font-display text-4xl tracking-wide md:text-5xl">{order.number}</h1>
            <p className="mt-2 text-sm text-stone">
                {order.status_label} · {t('payment')}: {order.payment_status_label} · {order.payment_method_label}
            </p>
            <OrderBody order={order} symbol={store} />
            {order.can_request_return && (
                <form
                    className="mt-8 space-y-3"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post(`/customer-account/orders/${order.number}/returns`);
                    }}
                >
                    <label className="block text-sm">
                        {t('requestReturn')}
                        <textarea
                            value={form.data.reason}
                            onChange={(event) => form.setData('reason', event.target.value)}
                            className="mt-1 w-full border border-line bg-transparent px-3 py-2"
                            rows={4}
                            required
                            minLength={10}
                        />
                    </label>
                    {(errors.reason || form.errors.reason) && (
                        <p className="text-sm text-red-700">{errors.reason || form.errors.reason}</p>
                    )}
                    <button className="btn-line">{t('sendRequest')}</button>
                </form>
            )}
        </div>
    );
}
