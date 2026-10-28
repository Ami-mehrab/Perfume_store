import { router, useForm, usePage } from '@inertiajs/react';
import AccountNav from '@/components/store/account-nav';
import { translate, type MessageKey } from '@/lib/i18n';
import type { Address } from '@/types/store';

const fields = [
    ['label', 'name'],
    ['recipient_name', 'fullName'],
    ['phone', 'phone'],
    ['line1', 'address'],
    ['line2', 'apartment'],
    ['city', 'city'],
    ['region', 'region'],
    ['postal_code', 'postal'],
    ['country', 'country'],
] as const;

export default function Addresses({ addresses }: { addresses: Address[] }) {
    const { store, locale } = usePage().props;
    const t = (key: MessageKey) => translate(locale, key);
    const form = useForm({
        label: 'Home',
        recipient_name: '',
        phone: '',
        line1: '',
        line2: '',
        city: '',
        region: '',
        postal_code: '',
        country: store.default_country || 'Bangladesh',
        is_default: addresses.length === 0,
    });

    return (
        <div className="mx-auto max-w-4xl px-4 py-8">
            <h1 className="font-display text-4xl">{t('addresses')}</h1>
            <div className="mt-5">
                <AccountNav />
            </div>
            <form
                className="mt-6 space-y-4 border border-black bg-white p-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post('/customer-account/addresses', {
                        preserveScroll: true,
                        onSuccess: () => {
                            form.reset();
                            form.setData('label', 'Home');
                            form.setData('country', store.default_country || 'Bangladesh');
                            form.setData('is_default', false);
                        },
                    });
                }}
            >
                <h2 className="font-display text-3xl">{t('newAddress')}</h2>
                {Object.keys(form.errors).length > 0 && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
                        {Object.entries(form.errors).map(([key, message]) => (
                            <p key={key}>{message}</p>
                        ))}
                    </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                    {fields.map(([field, label]) => (
                        <label key={field} className="block text-sm">
                            {t(label)}
                            <input
                                value={form.data[field] ?? ''}
                                onChange={(event) => form.setData(field, event.target.value)}
                                required={field !== 'line2' && field !== 'region' && field !== 'postal_code'}
                                className="mt-1 w-full border border-black bg-white px-3 py-2.5 text-base"
                            />
                            {form.errors[field] && <span className="mt-1 block text-xs text-red-700">{form.errors[field]}</span>}
                        </label>
                    ))}
                </div>
                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.data.is_default} onChange={(event) => form.setData('is_default', event.target.checked)} />
                    {t('defaultMark')}
                </label>
                <button type="submit" className="btn-dark" disabled={form.processing}>
                    {t('saveAddress')}
                </button>
            </form>
            <ul className="mt-6 space-y-3">
                {addresses.map((address) => (
                    <li key={address.id} className="border border-black bg-white p-4 text-base leading-7">
                        <p className="font-medium">
                            {address.label}
                            {address.is_default ? ` · ${t('defaultMark')}` : ''}
                        </p>
                        <p>{address.recipient_name}</p>
                        <p>{address.phone}</p>
                        <p>
                            {address.line1}
                            {address.line2 ? `, ${address.line2}` : ''}
                        </p>
                        <p>
                            {address.city} {address.postal_code}
                        </p>
                        <p>{address.country}</p>
                        <button type="button" className="mt-2 underline" onClick={() => router.delete(`/customer-account/addresses/${address.id}`)}>
                            {t('remove')}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
