import { Link, usePage } from '@inertiajs/react';
import { translate } from '@/lib/i18n';

export default function AccountNav() {
    const page = usePage();
    const { locale } = page.props;
    const path = page.url.split('?')[0];
    const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
    const items = [
        { href: '/customer-account', label: t('myAccount'), exact: true },
        { href: '/customer-account/orders', label: t('orders'), exact: false },
        { href: '/customer-account/addresses', label: t('addresses'), exact: false },
        { href: '/wishlist', label: t('wishlist'), exact: false },
        { href: '/orders/track', label: t('track'), exact: false },
    ];

    return (
        <nav className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" aria-label={t('account')}>
            {items.map((item) => {
                const active = item.exact ? path === item.href : path.startsWith(item.href);

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`rounded-full px-4 py-2.5 text-center text-sm whitespace-nowrap ${active ? 'bg-charcoal text-white' : 'border border-line bg-white text-charcoal'}`}
                        aria-current={active ? 'page' : undefined}
                    >
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}
