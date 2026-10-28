import { router, useForm, usePage } from '@inertiajs/react';
import { MapPin, Phone, StickyNote, Ticket, UserRound, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import Bottle from '@/components/store/bottle';
import { cartVisit } from '@/lib/cart-visit';
import { districts, zoneForDistrict } from '@/lib/districts';
import { perfumeNames, translate } from '@/lib/i18n';
import { formatMoney } from '@/lib/money';

export default function OrderModal({ onClose }: { onClose: () => void }) {
    const { store, cart, auth, errors, locale } = usePage().props;
    const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
    const shopper = auth.user?.role === 'customer' ? auth.user : null;
    const [zone, setZone] = useState<'inside' | 'outside'>(cart.quote.shipping_zone ?? 'inside');
    const form = useForm({
        name: shopper?.name ?? '',
        email: shopper?.email ?? '',
        phone: '',
        line1: '',
        city: 'Dhaka',
        country: store.default_country || 'Bangladesh',
        notes: '',
        payment_method: 'cod',
        shipping_zone: zone,
        idempotency_key: crypto.randomUUID(),
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

    function chooseZone(next: 'inside' | 'outside') {
        setZone(next);
        form.setData('shipping_zone', next);
        router.post('/cart/shipping', { zone: next }, cartVisit);
    }

    function chooseDistrict(district: string) {
        const next = zoneForDistrict(district);
        setZone(next);
        form.setData({ ...form.data, city: district, shipping_zone: next });
        router.post('/cart/shipping', { zone: next }, cartVisit);
    }

    const shippingCents = zone === 'outside' ? store.shipping_outside_cents : store.shipping_inside_cents;
    const discountCents = cart.quote.discount_cents;
    const totalCents = Math.max(0, cart.quote.subtotal_cents - discountCents) + shippingCents;
    const field = 'h-11 w-full rounded-md border border-[#e5e7eb] bg-white pr-3 pl-10 text-sm outline-none focus:border-charcoal';

    return (
        <div className="fixed inset-0 z-[70] grid place-items-center p-4">
            <button type="button" className="absolute inset-0 bg-black/50" aria-label={t('close')} onClick={onClose} />
            <div role="dialog" aria-modal="true" aria-labelledby="order-details-title" className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 text-charcoal shadow-2xl">
                <h2 id="order-details-title" className="text-center text-lg font-semibold">{t('enterDetails')}</h2>
                <button type="button" className="absolute top-4 right-4" aria-label={t('close')} onClick={onClose}>
                    <X className="size-5" />
                </button>

                <form
                    className="mt-5 space-y-3"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post('/checkout', { preserveState: true });
                    }}
                >
                    {(errors.cart || form.errors.payment_method) && (
                        <p className="text-sm text-red-700" role="alert">{errors.cart || form.errors.payment_method}</p>
                    )}
                    <Labeled label={t('yourName')} error={form.errors.name}>
                        <UserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone" />
                        <input className={field} placeholder={t('yourName')} value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} required />
                    </Labeled>
                    <Labeled label={t('phoneNumber')} error={form.errors.phone}>
                        <Phone className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone" />
                        <input className={field} placeholder={t('phoneNumber')} value={form.data.phone} onChange={(event) => form.setData('phone', event.target.value)} required />
                    </Labeled>
                    <Labeled label={t('address')} error={form.errors.line1}>
                        <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone" />
                        <input className={field} placeholder={t('address')} value={form.data.line1} onChange={(event) => form.setData('line1', event.target.value)} required />
                    </Labeled>
                    <Labeled label={t('district')} error={form.errors.city}>
                        <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone" />
                        <select className={field} value={form.data.city} onChange={(event) => chooseDistrict(event.target.value)}>
                            {districts.map((district) => (
                                <option key={district} value={district}>{district}</option>
                            ))}
                        </select>
                    </Labeled>

                    <ul className="divide-y divide-line border-y border-line">
                        {cart.items.map((item) => {
                            const names = perfumeNames(locale, item.product_name, item.product_name_bn);

                            return (
                                <li key={item.id} className="flex items-center gap-3 py-3">
                                    <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded border border-line bg-[#f8f8f8]">
                                        {item.image ? (
                                            <img src={item.image} alt={item.image_alt ?? ''} className="h-full w-full object-cover" />
                                        ) : (
                                            <Bottle tone={item.swatch} className="h-10" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold">{names.primary}</p>
                                        <p className="text-xs text-stone">{t('size')}: {item.size_ml}ml</p>
                                    </div>
                                    <p className="text-sm font-medium">{formatMoney(item.line_total_cents, store)}</p>
                                </li>
                            );
                        })}
                    </ul>

                    <dl className="space-y-1 text-sm">
                        <div className="flex justify-between"><dt>{t('subtotal')}</dt><dd>{formatMoney(cart.quote.subtotal_cents, store)}</dd></div>
                        {discountCents > 0 && (
                            <div className="flex justify-between"><dt>{t('discount')}</dt><dd>−{formatMoney(discountCents, store)}</dd></div>
                        )}
                        <div className="flex justify-between"><dt>{t('shipment')}</dt><dd>{formatMoney(shippingCents, store)}</dd></div>
                        <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
                            <dt>{t('total')}</dt>
                            <dd>{formatMoney(totalCents, store)}</dd>
                        </div>
                    </dl>

                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Ticket className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone" />
                            <input
                                className={field}
                                placeholder={t('couponCode')}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        const code = event.currentTarget.value;
                                        if (code.trim() !== '') {
                                            router.post('/cart/coupon', { code }, cartVisit);
                                        }
                                    }
                                }}
                                id="modal-coupon"
                            />
                        </div>
                        <button
                            type="button"
                            className="rounded-md bg-black px-4 text-sm font-semibold text-white"
                            onClick={() => {
                                const input = document.getElementById('modal-coupon');
                                const code = input instanceof HTMLInputElement ? input.value : '';
                                if (code.trim() !== '') {
                                    router.post('/cart/coupon', { code }, cartVisit);
                                }
                            }}
                        >
                            {t('apply')}
                        </button>
                    </div>
                    {errors?.coupon && <p className="text-sm text-red-700" role="alert">{errors.coupon}</p>}

                    <div className="relative">
                        <StickyNote className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone" />
                        <input className={field} placeholder={t('orderNote')} value={form.data.notes} onChange={(event) => form.setData('notes', event.target.value)} />
                    </div>

                    <fieldset>
                        <legend className="text-sm font-semibold">{t('shippingOptions')}</legend>
                        <div className="mt-2 space-y-2">
                            <ZoneOption
                                checked={zone === 'inside'}
                                label={t('insideDhaka')}
                                price={formatMoney(store.shipping_inside_cents, store)}
                                onChange={() => chooseZone('inside')}
                            />
                            <ZoneOption
                                checked={zone === 'outside'}
                                label={t('outsideDhaka')}
                                price={formatMoney(store.shipping_outside_cents, store)}
                                onChange={() => chooseZone('outside')}
                            />
                        </div>
                    </fieldset>

                    <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-md bg-[#ff2d2d] py-3 text-sm font-semibold text-white disabled:opacity-40" disabled={form.processing || cart.items.length === 0}>
                        {form.processing ? t('placingOrder') : `${t('orderConfirm')} – ${formatMoney(totalCents, store)}`}
                    </button>
                </form>
            </div>
        </div>
    );
}

function Labeled({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
    return (
        <label className="grid grid-cols-[7.5rem_1fr] items-center gap-2 text-sm">
            <span>{label}<span className="text-red-600">*</span></span>
            <span className="relative block">
                {children}
                {error && <span className="mt-1 block text-xs text-red-700" role="alert">{error}</span>}
            </span>
        </label>
    );
}

function ZoneOption({
    checked,
    label,
    price,
    onChange,
}: {
    checked: boolean;
    label: string;
    price: string;
    onChange: () => void;
}) {
    return (
        <label className="flex cursor-pointer items-center justify-between rounded-md border border-[#e5e7eb] px-3 py-3 text-sm">
            <span className="flex items-center gap-2">
                <input type="radio" checked={checked} onChange={onChange} />
                {label}
            </span>
            <span>{price}</span>
        </label>
    );
}
