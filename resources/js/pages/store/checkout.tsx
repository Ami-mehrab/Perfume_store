import { router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import CustomerLogin from '@/components/store/customer-login';
import SeoHead from '@/components/store/seo-head';
import PageBanner from '@/components/store/page-banner';
import { cartVisit } from '@/lib/cart-visit';
import { districts, zoneForDistrict } from '@/lib/districts';
import { perfumeNames, translate } from '@/lib/i18n';
import { formatMoney } from '@/lib/money';
import type { Address, CartPayload, Seo } from '@/types/store';

export default function Checkout({
    cart,
    idempotencyKey,
    addresses,
    payments,
    seo,
}: {
    cart: CartPayload;
    idempotencyKey: string;
    addresses: Address[];
    payments: { cod: boolean };
    seo: Seo;
}) {
    const { auth, store, errors, locale } = usePage().props;
    const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
    const shopper = auth.user?.role === 'customer' ? auth.user : null;
    const [couponOpen, setCouponOpen] = useState(false);
    const [signInOpen, setSignInOpen] = useState(false);
    const parts = (shopper?.name ?? '').split(' ');
    const form = useForm({
        first_name: parts[0] ?? '',
        last_name: parts.slice(1).join(' '),
        company: '',
        email: shopper?.email ?? '',
        phone: '',
        line1: '',
        line2: '',
        city: '',
        district: 'Dhaka',
        postal_code: '',
        country: store.default_country || 'Bangladesh',
        ship_different: false,
        ship_line1: '',
        ship_district: 'Dhaka',
        notes: '',
        payment_method: 'cod',
        shipping_zone: cart.quote.shipping_zone === 'outside' ? 'outside' : 'inside',
        idempotency_key: idempotencyKey,
        create_account: false,
        password: '',
        password_confirmation: '',
        save_address: false,
        address_label: 'Home',
    });
    const input = 'mt-1 h-10 w-full rounded border border-[#ddd] px-3 text-sm outline-none focus:border-charcoal';

    function useAddress(address: Address) {
        const name = address.recipient_name.split(' ');
        form.setData({
            ...form.data,
            first_name: name[0] ?? '',
            last_name: name.slice(1).join(' '),
            phone: address.phone,
            line1: address.line1,
            line2: address.line2 ?? '',
            city: address.city,
            district: districts.includes(address.city as (typeof districts)[number]) ? address.city : form.data.district,
            postal_code: address.postal_code ?? '',
            country: address.country,
        });
    }

    function setDistrict(district: string) {
        const zone = zoneForDistrict(district);
        form.setData({ ...form.data, district, shipping_zone: zone });
        router.post('/cart/shipping', { zone }, cartVisit);
    }

    return (
        <>
            <SeoHead seo={seo} />
            <PageBanner title={t('checkout')} crumb={t('checkout')} />
            <div className="mx-auto max-w-6xl px-4 py-8">
                <button type="button" className="mb-6 flex w-full items-center justify-between rounded bg-[#e0f2fe] px-4 py-3 text-sm text-[#0369a1]" onClick={() => setCouponOpen((open) => !open)}>
                    <span>{t('clickCoupon')}</span>
                </button>
                {couponOpen && (
                    <form
                        className="mb-6 flex max-w-md gap-2"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const code = new FormData(event.currentTarget).get('code');
                            router.post('/cart/coupon', { code }, cartVisit);
                        }}
                    >
                        <input name="code" placeholder={t('couponCode')} className="h-10 flex-1 rounded border border-[#ddd] px-3 text-sm" />
                        <button className="h-10 rounded bg-[#f3f4f6] px-4 text-sm" type="submit">{t('apply')}</button>
                    </form>
                )}
                {errors?.coupon && <p className="mb-4 text-sm text-red-700" role="alert">{errors.coupon}</p>}
                {cart.quote.coupon_code && (
                    <button type="button" className="mb-4 text-sm underline" onClick={() => router.delete('/cart/coupon', cartVisit)}>
                        {t('remove')} {cart.quote.coupon_code}
                    </button>
                )}

                {!shopper && (
                    <button type="button" className="mb-4 text-sm text-[#9d174d] underline" onClick={() => setSignInOpen((open) => !open)}>
                        {t('customerSignIn')}
                    </button>
                )}
                {signInOpen && !shopper && <div className="mb-6 max-w-md"><CustomerLogin copy={t('checkoutSignInCopy')} /></div>}

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        const district = form.data.ship_different ? form.data.ship_district : form.data.district;
                        form.transform((data) => ({
                            name: `${data.first_name} ${data.last_name}`.trim(),
                            email: data.email,
                            phone: data.phone,
                            line1: data.ship_different ? data.ship_line1 : data.line1,
                            line2: data.company ? [data.company, data.line2].filter(Boolean).join(', ') : data.line2,
                            city: data.ship_different ? data.ship_district : (data.city || data.district),
                            region: district,
                            postal_code: data.postal_code,
                            country: data.country,
                            notes: data.notes,
                            payment_method: data.payment_method,
                            shipping_zone: zoneForDistrict(district),
                            idempotency_key: data.idempotency_key,
                            create_account: data.create_account,
                            password: data.password,
                            password_confirmation: data.password_confirmation,
                            save_address: data.save_address,
                            address_label: data.address_label,
                        }));
                        form.post('/checkout');
                    }}
                >
                    {(errors.cart || errors.payment_method || form.errors.payment_method) && (
                        <p className="mb-4 text-sm text-red-700" role="alert">{errors.cart || errors.payment_method || form.errors.payment_method}</p>
                    )}
                    <div className="grid gap-8 lg:grid-cols-2">
                        <section>
                            <h2 className="text-xl font-semibold">{t('billingDetails')}</h2>
                            {addresses.length > 0 && (
                                <div className="mt-3 flex gap-2 overflow-x-auto">
                                    {addresses.map((address) => (
                                        <button key={address.id} type="button" className="min-w-36 rounded border border-[#ddd] p-3 text-left text-sm" onClick={() => useAddress(address)}>
                                            <span className="block text-xs text-stone">{address.label}</span>
                                            {address.city}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <Field label={t('firstName')} value={form.data.first_name} error={errors.name} onChange={(value) => form.setData('first_name', value)} />
                                <Field label={t('lastName')} value={form.data.last_name} onChange={(value) => form.setData('last_name', value)} />
                            </div>
                            <Field label={t('company')} value={form.data.company} onChange={(value) => form.setData('company', value)} />
                            <label className="mt-4 block text-sm">
                                {t('country')}<span className="text-red-600">*</span>
                                <input className={input} value={form.data.country} onChange={(event) => form.setData('country', event.target.value)} />
                            </label>
                            <Field label={t('street')} value={form.data.line1} error={form.errors.line1} onChange={(value) => form.setData('line1', value)} />
                            <Field label={t('apartment')} value={form.data.line2} onChange={(value) => form.setData('line2', value)} />
                            <Field label={t('town')} value={form.data.city} error={form.errors.city} onChange={(value) => form.setData('city', value)} />
                            <label className="mt-4 block text-sm">
                                {t('district')}<span className="text-red-600">*</span>
                                <select className={input} value={form.data.district} onChange={(event) => setDistrict(event.target.value)}>
                                    {districts.map((district) => (
                                        <option key={district} value={district}>{district}</option>
                                    ))}
                                </select>
                            </label>
                            <Field label={t('postal')} value={form.data.postal_code} onChange={(value) => form.setData('postal_code', value)} />
                            <Field label={t('phone')} value={form.data.phone} error={form.errors.phone} onChange={(value) => form.setData('phone', value)} />
                            <Field label={t('email')} type="email" value={form.data.email} error={form.errors.email} disabled={Boolean(shopper)} onChange={(value) => form.setData('email', value)} />
                        </section>
                        <section>
                            <label className="flex items-center gap-2 text-sm font-medium">
                                <input type="checkbox" checked={form.data.ship_different} onChange={(event) => form.setData('ship_different', event.target.checked)} />
                                {t('shipDifferent')}
                            </label>
                            {form.data.ship_different && (
                                <div className="mt-4 space-y-4">
                                    <Field label={t('street')} value={form.data.ship_line1} onChange={(value) => form.setData('ship_line1', value)} />
                                    <label className="block text-sm">
                                        {t('district')}<span className="text-red-600">*</span>
                                        <select className={input} value={form.data.ship_district} onChange={(event) => {
                                            const district = event.target.value;
                                            const zone = zoneForDistrict(district);
                                            form.setData({ ...form.data, ship_district: district, shipping_zone: zone });
                                            router.post('/cart/shipping', { zone }, cartVisit);
                                        }}>
                                            {districts.map((district) => (
                                                <option key={district} value={district}>{district}</option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                            )}
                            <label className="mt-6 block text-sm">
                                {t('orderNote')}
                                <textarea value={form.data.notes} onChange={(event) => form.setData('notes', event.target.value)} className="mt-1 w-full rounded border border-[#ddd] px-3 py-2 text-sm" rows={4} placeholder={t('deliveryNotes')} />
                            </label>
                        </section>
                    </div>

                    <h2 className="mt-10 text-xl font-semibold">{t('yourOrder')}</h2>
                    <div className="mt-3 overflow-x-auto border border-[#eee] text-sm">
                        <div className="grid grid-cols-2 bg-[#fafafa] px-4 py-3 font-medium">
                            <span>{t('product')}</span>
                            <span className="text-right">{t('subtotal')}</span>
                        </div>
                        {cart.items.map((item) => (
                            <div key={item.id} className="grid grid-cols-2 border-t border-[#eee] px-4 py-3">
                                <span>{perfumeNames(locale, item.product_name, item.product_name_bn).primary}{item.size_ml ? ` – ${item.size_ml}ml` : ''} × {item.quantity}</span>
                                <span className="text-right text-[#9d174d]">{formatMoney(item.line_total_cents, store)}</span>
                            </div>
                        ))}
                        <div className="grid grid-cols-2 border-t border-[#eee] px-4 py-3">
                            <span>{t('subtotal')}</span>
                            <span className="text-right text-[#9d174d]">{formatMoney(cart.quote.subtotal_cents, store)}</span>
                        </div>
                        {cart.quote.discount_cents > 0 && (
                            <div className="grid grid-cols-2 border-t border-[#eee] px-4 py-3">
                                <span>{t('discount')}</span>
                                <span className="text-right">−{formatMoney(cart.quote.discount_cents, store)}</span>
                            </div>
                        )}
                        <div className="grid grid-cols-2 border-t border-[#eee] px-4 py-3">
                            <span>{t('shipment')}</span>
                            <span className="text-right">{form.data.shipping_zone === 'outside' ? t('outsideDhaka') : t('insideDhaka')}: {cart.quote.shipping_cents === 0 ? t('free') : formatMoney(cart.quote.shipping_cents, store)}</span>
                        </div>
                        <div className="grid grid-cols-2 border-t border-[#eee] px-4 py-3 font-semibold">
                            <span>{t('total')}</span>
                            <span className="text-right text-[#9d174d]">{formatMoney(cart.quote.total_cents, store)}</span>
                        </div>
                    </div>

                    {payments.cod && (
                        <div className="mt-6 rounded border border-[#eee] p-4">
                            <p className="font-medium">{t('cod')}</p>
                            <p className="mt-3 rounded bg-[#f3e8ff] px-4 py-3 text-sm text-stone">{t('codCopy')}</p>
                            <div className="mt-4 flex justify-end">
                                <button className="rounded bg-[#9d174d] px-5 py-2 text-sm font-semibold text-white disabled:opacity-40" disabled={form.processing || cart.items.length === 0}>
                                    {form.processing ? t('placingOrder') : t('placeOrder')}
                                </button>
                            </div>
                        </div>
                    )}

                    {shopper ? (
                        <label className="mt-4 flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={form.data.save_address} onChange={(event) => form.setData('save_address', event.target.checked)} />
                            {t('saveAddress')}
                        </label>
                    ) : (
                        <div className="mt-4 max-w-md space-y-3">
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={form.data.create_account} onChange={(event) => form.setData('create_account', event.target.checked)} />
                                {t('createAccount')}
                            </label>
                            {form.data.create_account && (
                                <>
                                    <Field label={t('password')} type="password" value={form.data.password} error={form.errors.password} onChange={(value) => form.setData('password', value)} />
                                    <Field label={t('confirmPassword')} type="password" value={form.data.password_confirmation} onChange={(value) => form.setData('password_confirmation', value)} />
                                </>
                            )}
                        </div>
                    )}
                </form>
            </div>
        </>
    );
}

function Field({
    label,
    value,
    onChange,
    error,
    type = 'text',
    disabled = false,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    type?: string;
    disabled?: boolean;
}) {
    return (
        <label className="mt-4 block text-sm">
            {label}
            <input type={type} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded border border-[#ddd] px-3 text-sm outline-none focus:border-charcoal disabled:bg-[#f8f8f8]" />
            {error && <span className="mt-1 block text-xs text-red-700" role="alert">{error}</span>}
        </label>
    );
}
