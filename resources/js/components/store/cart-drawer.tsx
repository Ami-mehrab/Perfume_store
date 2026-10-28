import { Link, router, usePage } from '@inertiajs/react';
import { Minus, Plus, X } from 'lucide-react';
import { useEffect } from 'react';
import Bottle from '@/components/store/bottle';
import { cartVisit } from '@/lib/cart-visit';
import { perfumeNames, translate } from '@/lib/i18n';
import { formatMoney } from '@/lib/money';

export default function CartDrawer({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const { store, cart, locale } = usePage().props;
    const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

    useEffect(() => {
        if (!open) {
            return;
        }

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
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    const items = cart.items;

    return (
        <div className="fixed inset-0 z-[60]">
            <button
                type="button"
                className="absolute inset-0 bg-black/45"
                aria-label={t('close')}
                onClick={onClose}
            />
            <aside
                role="dialog"
                aria-modal="true"
                aria-label={t('yourCart')}
                className="cart-panel absolute inset-x-0 bottom-0 flex max-h-[86vh] flex-col rounded-t-3xl bg-white text-charcoal shadow-2xl md:inset-y-0 md:right-0 md:left-auto md:h-full md:max-h-none md:w-[380px] md:rounded-none"
            >
                <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-[#e5e7eb] md:hidden" />
                <header className="flex items-center justify-end px-4 py-3">
                    <button type="button" aria-label={t('close')} onClick={onClose} className="p-1">
                        <X className="size-5" />
                    </button>
                </header>
                <div className="flex-1 overflow-y-auto px-4">
                    {items.length === 0 ? (
                        <div className="py-10">
                            <p className="text-stone">{t('emptyCart')}</p>
                            <Link href="/shop" className="btn-dark mt-6" onClick={onClose}>
                                {t('browsePerfumes')}
                            </Link>
                        </div>
                    ) : (
                        <ul className="divide-y divide-[#eee]">
                            {items.map((item) => {
                                const names = perfumeNames(locale, item.product_name, item.product_name_bn);

                                return (
                                    <li key={item.id} className="flex gap-3 py-4">
                                        <Link
                                            href={item.product_slug ? `/products/${item.product_slug}` : '/shop'}
                                            onClick={onClose}
                                            className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#eee] bg-[#f8f8f8]"
                                        >
                                            {item.image ? (
                                                <img src={item.image} alt={item.image_alt ?? ''} className="h-full w-full object-cover" />
                                            ) : (
                                                <Bottle tone={item.swatch} className="h-14" />
                                            )}
                                        </Link>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm leading-5 font-semibold">
                                                {names.primary}
                                                {item.size_ml ? ` – ${item.size_ml}ml` : ''}
                                            </p>
                                            {names.secondary && <p className="text-xs text-stone">{names.secondary}</p>}
                                            <p className="mt-1 text-sm font-semibold text-[#9d174d]">
                                                {formatMoney(item.line_total_cents, store)}
                                            </p>
                                            {!item.available && <p className="text-xs text-red-700">{t('unavailable')}</p>}
                                            <div className="mt-2 flex items-center justify-between gap-2">
                                                <div className="inline-flex items-center rounded-full border border-[#ddd]">
                                                    <button
                                                        type="button"
                                                        className="px-2.5 py-1.5 disabled:opacity-40"
                                                        aria-label={locale === 'bn' ? 'কমান' : 'Less'}
                                                        disabled={item.quantity <= 1}
                                                        onClick={() =>
                                                            router.patch(
                                                                `/cart/items/${item.id}`,
                                                                { quantity: Math.max(1, item.quantity - 1) },
                                                                cartVisit,
                                                            )
                                                        }
                                                    >
                                                        <Minus className="size-3.5" />
                                                    </button>
                                                    <span className="min-w-7 text-center text-sm tabular-nums">{item.quantity}</span>
                                                    <button
                                                        type="button"
                                                        className="px-2.5 py-1.5"
                                                        aria-label={locale === 'bn' ? 'বাড়ান' : 'More'}
                                                        onClick={() =>
                                                            router.patch(
                                                                `/cart/items/${item.id}`,
                                                                { quantity: item.quantity + 1 },
                                                                cartVisit,
                                                            )
                                                        }
                                                    >
                                                        <Plus className="size-3.5" />
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="text-sm text-stone underline"
                                                    onClick={() => router.delete(`/cart/items/${item.id}`, cartVisit)}
                                                >
                                                    {t('remove')}
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
                <footer className="px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    <div className="flex items-center justify-between py-3 text-base font-semibold">
                        <span>{t('subtotal')}:</span>
                        <span>{formatMoney(cart.quote.subtotal_cents, store)}</span>
                    </div>
                    <Link
                        href="/cart"
                        onClick={onClose}
                        className={`flex h-12 items-center justify-center rounded-full bg-black text-sm font-semibold text-white ${items.length === 0 ? 'pointer-events-none opacity-40' : ''}`}
                    >
                        {t('viewCart')}
                    </Link>
                    <Link
                        href="/checkout"
                        onClick={onClose}
                        className={`mt-3 flex h-12 items-center justify-center rounded-full bg-[#9d174d] text-sm font-semibold text-white ${items.length === 0 ? 'pointer-events-none opacity-40' : ''}`}
                    >
                        {t('checkout')}
                    </Link>
                </footer>
            </aside>
        </div>
    );
}
