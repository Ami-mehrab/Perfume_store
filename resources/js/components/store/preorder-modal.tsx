import { useForm, usePage } from '@inertiajs/react';
import { Phone, UserRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { perfumeNames, translate } from '@/lib/i18n';

export default function PreorderModal({
    productId,
    productName,
    productNameBn,
    variantId,
    sizeMl,
    onClose,
}: {
    productId: number;
    productName: string;
    productNameBn: string | null;
    variantId: number;
    sizeMl: number;
    onClose: () => void;
}) {
    const { locale, auth } = usePage().props;
    const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
    const names = perfumeNames(locale, productName, productNameBn);
    const shopper = auth.user?.role === 'customer' ? auth.user : null;
    const [sent, setSent] = useState(false);
    const form = useForm({
        product_id: productId,
        variant_id: variantId,
        name: shopper?.name ?? '',
        phone: '',
    });

    useEffect(() => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        function onKey(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        window.addEventListener('keydown', onKey);

        return () => {
            document.body.style.overflow = previous;
            window.removeEventListener('keydown', onKey);
        };
    }, [onClose]);

    const field = 'h-11 w-full rounded-md border border-[#e5e7eb] bg-[#f8f8f8] pr-3 pl-10 text-sm outline-none focus:border-charcoal';

    return (
        <div className="fixed inset-0 z-[70] grid place-items-center p-4">
            <button type="button" className="absolute inset-0 bg-black/50" aria-label={t('close')} onClick={onClose} />
            <div role="dialog" aria-modal="true" aria-labelledby="preorder-title" className="relative w-full max-w-sm rounded-2xl bg-white px-6 py-7 text-center text-charcoal shadow-2xl">
                <button type="button" className="absolute top-4 right-4" aria-label={t('close')} onClick={onClose}>
                    <X className="size-5" />
                </button>
                <p className="text-3xl" aria-hidden="true">🔔</p>
                <h2 id="preorder-title" className="mt-2 text-xl font-semibold">{t('preorder')}</h2>
                <p className="mt-2 text-sm leading-6 text-stone">{t('preorderCopy')}</p>
                <p className="mt-4 rounded-lg bg-[#fff1e8] px-3 py-3 text-sm font-semibold text-[#e4572e] uppercase">
                    {names.primary} — {t('size')}: {sizeMl}ml
                </p>
                {sent ? (
                    <p className="mt-6 text-sm leading-6">{t('preorderThanks')}</p>
                ) : (
                    <form
                        className="mt-5 space-y-3 text-left"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post('/preorders', {
                                preserveScroll: true,
                                preserveState: true,
                                onSuccess: () => setSent(true),
                            });
                        }}
                    >
                        <label className="block text-sm font-medium">
                            {t('yourName')}<span className="text-red-600">*</span>
                            <span className="relative mt-1 block">
                                <UserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone" />
                                <input className={field} placeholder={t('yourName')} value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} required />
                            </span>
                            {form.errors.name && <span className="mt-1 block text-xs text-red-700">{form.errors.name}</span>}
                        </label>
                        <label className="block text-sm font-medium">
                            {t('phoneNumber')}<span className="text-red-600">*</span>
                            <span className="relative mt-1 block">
                                <Phone className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone" />
                                <input className={field} placeholder="e.g. 01712345678" value={form.data.phone} onChange={(event) => form.setData('phone', event.target.value)} required />
                            </span>
                            {form.errors.phone && <span className="mt-1 block text-xs text-red-700">{form.errors.phone}</span>}
                        </label>
                        <button type="submit" className="mt-2 w-full rounded-lg bg-[#ff8a1e] py-3 text-sm font-semibold text-white disabled:opacity-40" disabled={form.processing}>
                            {form.processing ? t('placingOrder') : t('preorderSubmit')}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
