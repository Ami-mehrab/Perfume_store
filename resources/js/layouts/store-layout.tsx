import { Link, router, usePage } from '@inertiajs/react';
import { Heart, Home, Menu, Package, Search, ShoppingBag, UserRound } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import CartDrawer from '@/components/store/cart-drawer';
import ChatWidget from '@/components/store/chat-widget';
import FooterSocial from '@/components/store/footer-social';
import ShopperMenu from '@/components/store/shopper-menu';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { translate } from '@/lib/i18n';
import type { ShopSection } from '@/types/store';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
    const page = usePage();
    const { store, auth, cartCount, wishlistIds, locale, sections } = page.props;
    const path = page.url.split('?')[0];
    const showDock = !path.startsWith('/products/') && path !== '/checkout';
    // Strict customer-only: staff sessions must never look signed-in on the shop.
    const shopper = auth.user?.role === 'customer' ? auth.user : null;
    const accountHref = '/customer-account';
    const firstName = shopper ? shopper.name.trim().split(/\s+/)[0] : '';
    const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
    const [open, setOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const closeCart = useCallback(() => setCartOpen(false), []);

    const links = [
        ...sections.map((section: ShopSection) => ({
            href: `/collections/${section.slug}`,
            label: locale === 'bn' && section.name_bn ? section.name_bn : section.name,
        })),
        { href: '/brands', label: t('brands') },
        { href: '/shop', label: t('shop') },
    ];

    useEffect(() => {
        return router.on('flash', (event) => {
            const flash = (event as CustomEvent<{ flash?: { openCart?: boolean } }>).detail?.flash;

            if (flash?.openCart) {
                setCartOpen(true);
            }
        });
    }, []);

    function chooseLocale(next: 'en' | 'bn') {
        if (next !== locale) {
            router.post('/locale', { locale: next }, { preserveScroll: true });
        }
    }

    return (
        <div className="store-shell min-h-screen">
            <a
                href="#main"
                className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-charcoal focus:px-3 focus:py-2 focus:text-ivory"
            >
                {t('skip')}
            </a>
            {store.announcement && (
                <div className="store-announcement bg-[#111827] px-4 py-2.5 text-center text-white">
                    <p className="mx-auto max-w-5xl text-[12px] leading-5 font-medium md:text-[13px]">
                        {store.announcement}
                    </p>
                </div>
            )}
            <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-sm">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
                    <button
                        type="button"
                        className="text-charcoal md:hidden"
                        aria-label={t('openMenu')}
                        onClick={() => setOpen(true)}
                    >
                        <Menu className="size-5" />
                    </button>
                    <Link href="/" className="font-display text-[1.35rem] leading-none tracking-[0.04em] text-bronze md:text-[1.5rem]">
                        {store.name}
                    </Link>
                    <nav className="hidden flex-1 items-center justify-center gap-6 lg:gap-8 md:flex" aria-label="Primary">
                        {links.map((link) => {
                            const active = link.href === '/' ? path === '/' : path === link.href || path.startsWith(`${link.href}/`);

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`store-nav-link text-[12px] font-medium transition-colors lg:text-[13px] ${active ? 'text-bronze' : 'text-charcoal hover:text-bronze'}`}
                                    aria-current={active ? 'page' : undefined}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="flex items-center gap-3 text-charcoal md:gap-3.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium md:text-xs" aria-label={t('language')}>
                            <button
                                type="button"
                                aria-pressed={locale === 'en'}
                                className={locale === 'en' ? 'text-bronze' : 'text-stone hover:text-charcoal'}
                                onClick={() => chooseLocale('en')}
                            >
                                EN
                            </button>
                            <span className="text-stone/70" aria-hidden="true">/</span>
                            <button
                                type="button"
                                aria-pressed={locale === 'bn'}
                                className={locale === 'bn' ? 'text-bronze' : 'text-stone hover:text-charcoal'}
                                onClick={() => chooseLocale('bn')}
                            >
                                বাংলা
                            </button>
                        </div>
                        <button
                            type="button"
                            aria-label={t('search')}
                            className="hover:text-bronze"
                            onClick={() => setSearchOpen((value) => !value)}
                        >
                            <Search className="size-[1.15rem]" strokeWidth={1.75} />
                        </button>
                        <Link href="/wishlist" aria-label={t('wishlist')} className="relative hover:text-bronze">
                            <Heart className="size-[1.15rem]" strokeWidth={1.75} />
                            {wishlistIds.length > 0 && (
                                <span className="absolute -top-1.5 -right-2 min-w-4 rounded-full bg-bronze px-1 text-center text-[10px] leading-4 font-semibold text-white">
                                    {wishlistIds.length}
                                </span>
                            )}
                        </Link>
                        <button type="button" aria-label={t('bag')} className="relative hidden hover:text-bronze md:inline-flex" onClick={() => setCartOpen(true)}>
                            <ShoppingBag className="size-[1.15rem]" strokeWidth={1.75} />
                            {cartCount > 0 && (
                                <span className="absolute -top-1.5 -right-2 min-w-4 rounded-full bg-bronze px-1 text-center text-[10px] leading-4 font-semibold text-white">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                        {shopper ? (
                            <div className="hidden md:block">
                                <ShopperMenu
                                    firstName={firstName}
                                    fullName={shopper.name}
                                    accountLabel={t('myAccount')}
                                    logOutLabel={t('logOut')}
                                    accountHref={accountHref}
                                    side="bottom"
                                    align="end"
                                />
                            </div>
                        ) : (
                            <Link href={accountHref} className="hidden items-center gap-1.5 text-[13px] font-medium hover:text-bronze md:inline-flex" aria-label={t('signIn')}>
                                <UserRound className="size-[1.15rem] shrink-0" strokeWidth={1.75} />
                                <span>{t('signIn')}</span>
                            </Link>
                        )}
                    </div>
                </div>
                {searchOpen && (
                    <form action="/shop" method="get" className="border-t border-line px-4 py-3">
                        <label className="sr-only" htmlFor="site-search">
                            {t('search')}
                        </label>
                        <input
                            id="site-search"
                            name="q"
                            placeholder={t('searchPlaceholder')}
                            className="w-full bg-transparent font-display text-2xl outline-none placeholder:text-stone"
                            autoFocus
                        />
                    </form>
                )}
            </header>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="left" className="bg-white text-charcoal">
                    <SheetTitle className="font-display text-3xl text-bronze">{store.name}</SheetTitle>
                    <nav className="mt-8 flex flex-col gap-1" aria-label="Mobile">
                        {links.map((link) => {
                            const active = link.href === '/' ? path === '/' : path === link.href || path.startsWith(`${link.href}/`);

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`rounded-lg px-2 py-2.5 text-base ${active ? 'bg-ivory font-semibold text-bronze' : 'text-charcoal'}`}
                                    onClick={() => setOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                        <Link href="/orders/track" className="rounded-lg px-2 py-2.5 text-base text-charcoal" onClick={() => setOpen(false)}>
                            {t('track')}
                        </Link>
                    </nav>
                </SheetContent>
            </Sheet>
            <CartDrawer open={cartOpen} onClose={closeCart} />
            <ChatWidget raised={showDock} />
            <main id="main" className={showDock ? 'pb-24 md:pb-0' : undefined}>{children}</main>
            {showDock && (
                <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ivory/95 backdrop-blur md:hidden" aria-label="Mobile">
                    <div className="grid grid-cols-5 pb-[max(0.4rem,env(safe-area-inset-bottom))]">
                        <DockLink href="/" label={t('home')} active={path === '/'}>
                            <Home className="size-5" />
                        </DockLink>
                        <DockLink href="/shop" label={t('shop')} active={path.startsWith('/shop') || path.startsWith('/collections') || path.startsWith('/brands')}>
                            <Search className="size-5" />
                        </DockLink>
                        <button type="button" className="flex flex-col items-center gap-1 py-2 text-xs" onClick={() => setCartOpen(true)}>
                            <span className="relative">
                                <ShoppingBag className="size-5" />
                                {cartCount > 0 && <span className="absolute -top-1.5 -right-2 text-[10px]">{cartCount}</span>}
                            </span>
                            {t('bag')}
                        </button>
                        <DockLink href="/orders/track" label={t('trackShort')} active={path.startsWith('/orders/track')}>
                            <Package className="size-5" />
                        </DockLink>
                        {shopper ? (
                            <ShopperMenu
                                firstName={firstName}
                                fullName={shopper.name}
                                accountLabel={t('myAccount')}
                                logOutLabel={t('logOut')}
                                accountHref={accountHref}
                                side="top"
                                align="end"
                                dock
                                triggerClassName={`flex min-w-0 flex-col items-center gap-1 px-1 py-2 text-[11px] leading-tight ${path.startsWith('/customer-account') ? 'text-charcoal' : 'text-stone'}`}
                            />
                        ) : (
                            <DockLink href={accountHref} label={t('signIn')} active={path.startsWith('/customer-account')}>
                                <UserRound className="size-5" />
                            </DockLink>
                        )}
                    </div>
                </nav>
            )}
            <footer className={`mt-12 bg-[#111] text-white md:mt-16 ${showDock ? 'pb-28 md:pb-0' : ''}`}>
                <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:gap-10 md:grid-cols-4 md:py-12">
                    <div>
                        <p className="text-lg font-semibold text-[#f472b6]">{store.name}</p>
                        <p className="mt-3 max-w-xs text-sm leading-6 text-white/70">{store.about}</p>
                        <FooterSocial
                            facebook={store.facebook_url}
                            twitter={store.twitter_url}
                            instagram={store.instagram_url}
                            youtube={store.youtube_url}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-6 text-sm leading-7 sm:contents">
                        <div>
                            <p className="font-semibold">{locale === 'bn' ? 'সেকশন' : 'Categories'}</p>
                            {sections.map((section: ShopSection) => (
                                <Link key={section.slug} href={`/collections/${section.slug}`} className="block text-white/70">
                                    {locale === 'bn' && section.name_bn ? section.name_bn : section.name}
                                </Link>
                            ))}
                        </div>
                        <div>
                            <p className="font-semibold">{locale === 'bn' ? 'কাস্টমার সেবা' : 'Customer service'}</p>
                            <Link href="/orders/track" className="block text-white/70">
                                {t('track')}
                            </Link>
                            <p className="text-white/70">{store.delivery_estimate}</p>
                            <p className="text-white/70">{store.returns_text}</p>
                        </div>
                    </div>
                    <div className="text-sm leading-7">
                        <p className="font-semibold">{locale === 'bn' ? 'যোগাযোগ' : 'Company info'}</p>
                        <p className="text-white/70">{store.address}</p>
                        <p className="text-white/70">{store.contact_phone}</p>
                        <a className="break-all text-white/70" href={`mailto:${store.contact_email}`}>
                            {store.contact_email}
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function DockLink({
    href,
    label,
    active,
    children,
}: {
    href: string;
    label: string;
    active: boolean;
    children: React.ReactNode;
}) {
    return (
        <Link href={href} className={`flex min-w-0 flex-col items-center gap-1 px-1 py-2 text-[11px] leading-tight ${active ? 'text-charcoal' : 'text-stone'}`}>
            {children}
            <span className="max-w-full truncate">{label}</span>
        </Link>
    );
}
