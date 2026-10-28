import { useForm, usePage } from '@inertiajs/react';
import SeoHead from '@/components/store/seo-head';
import { translate } from '@/lib/i18n';
import { OrderBody } from '@/pages/store/confirmation';
import type { PublicOrder, Seo } from '@/types/store';

export default function Track({ order, seo }: { order: PublicOrder | null; seo: Seo }) {
    const { store, errors, locale } = usePage().props;
    const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
    const form = useForm({ number: '', contact: '' });

    return (
        <>
            <SeoHead seo={seo} />
            <div className="mx-auto max-w-xl px-4 py-12">
                <h1 className="font-display text-5xl">{t('track')}</h1>
                <p className="mt-3 text-sm text-stone">{t('trackCopy')}</p>
                <form
                    className="mt-8 space-y-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post('/orders/track');
                    }}
                >
                    <label className="block text-sm">
                        {t('orderNumber')}
                        <input value={form.data.number} onChange={(event) => form.setData('number', event.target.value)} className="mt-1 w-full border border-line bg-transparent px-3 py-2" required />
                    </label>
                    <label className="block text-sm">
                        {t('contact')}
                        <input value={form.data.contact} onChange={(event) => form.setData('contact', event.target.value)} className="mt-1 w-full border border-black bg-white px-3 py-2.5 text-base" required />
                    </label>
                    {(errors.number || form.errors.number) && <p className="text-sm text-red-700" role="alert">{errors.number || form.errors.number}</p>}
                    <button className="btn-dark" disabled={form.processing}>{t('lookUp')}</button>
                </form>
                {order && (
                    <div className="mt-10">
                        <p className="text-sm">{t('fulfillment')}: {order.status_label}. {t('payment')}: {order.payment_status_label}.</p>
                        <OrderBody order={order} symbol={store} />
                    </div>
                )}
            </div>
        </>
    );
}
