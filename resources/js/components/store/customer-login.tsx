import { useForm, usePage } from '@inertiajs/react';
import { FormEvent } from 'react';
import { translate } from '@/lib/i18n';

export default function CustomerLogin({ copy }: { copy: string }) {
    const { locale, errors } = usePage().props;
    const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
    const form = useForm({
        email: '',
        password: '',
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.post('/customer-account/login', { preserveScroll: true });
    }

    const emailError = form.errors.email || errors.email;

    return (
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-line bg-white p-5">
            <div>
                <h2 className="font-display text-3xl">{t('customerSignIn')}</h2>
                <p className="mt-2 text-sm leading-6 text-stone">{copy}</p>
            </div>
            <label className="block text-sm">
                {t('email')}
                <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={form.data.email}
                    onChange={(event) => form.setData('email', event.target.value)}
                    disabled={form.processing}
                    className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 disabled:opacity-60"
                />
            </label>
            <label className="block text-sm">
                {t('password')}
                <input
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={form.data.password}
                    onChange={(event) => form.setData('password', event.target.value)}
                    disabled={form.processing}
                    className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 disabled:opacity-60"
                />
            </label>
            {emailError && <p className="text-sm text-red-700" role="alert">{emailError}</p>}
            <button className="btn-dark w-full disabled:opacity-70" type="submit" disabled={form.processing}>
                {form.processing
                    ? (locale === 'bn' ? 'সাইন ইন হচ্ছে…' : 'Signing in…')
                    : t('signIn')}
            </button>
        </form>
    );
}
