import { Head, Link, usePage } from '@inertiajs/react';
import { logout } from '@/routes';
import {
    Image,
    Layers,
    LayoutDashboard,
    Menu,
    Package,
    RotateCcw,
    Settings,
    Bell,
    ShoppingBag,
    Sparkles,
    Star,
    Tag,
    Ticket,
    Users,
    Warehouse,
} from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

const groups = [
    {
        label: 'Run the shop',
        links: [
            { label: 'Overview', href: '/admin', icon: LayoutDashboard },
            { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
            { label: 'Pre-orders', href: '/admin/preorders', icon: Bell },
            { label: 'Customers', href: '/admin/customers', icon: Users },
            { label: 'Returns', href: '/admin/returns', icon: RotateCcw },
            { label: 'Reviews', href: '/admin/reviews', icon: Star },
        ],
    },
    {
        label: 'Catalogue',
        links: [
            { label: 'Perfumes', href: '/admin/products', icon: Sparkles },
            { label: 'Inventory', href: '/admin/inventory', icon: Warehouse },
            { label: 'Brands', href: '/admin/brands', icon: Tag },
            { label: 'Collections', href: '/admin/collections', icon: Layers },
        ],
    },
    {
        label: 'Promote',
        links: [
            { label: 'Coupons', href: '/admin/coupons', icon: Ticket },
            { label: 'Banner', href: '/admin/banners', icon: Image },
        ],
    },
    {
        label: 'Store',
        links: [{ label: 'Settings', href: '/admin/settings', icon: Settings }],
    },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const page = usePage();
    const { store, auth } = page.props;
    const [open, setOpen] = useState(false);
    const current = page.url.split('?')[0];

    return (
        <div className="min-h-screen bg-[#f4efe8] text-charcoal">
            <Head>
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-[#1c1917] text-ivory md:flex">
                <Sidebar storeName={store.name} current={current} name={auth.user?.name} />
            </aside>
            <div className="md:pl-64">
                <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-line bg-[#f4efe8]/90 px-4 backdrop-blur md:px-8">
                    <div className="flex items-center gap-3">
                        <button type="button" className="md:hidden" aria-label="Open admin menu" onClick={() => setOpen(true)}>
                            <Menu className="size-5" />
                        </button>
                        <p className="text-sm text-stone">
                            <span className="font-medium text-charcoal">{store.name}</span>
                            <span className="hidden sm:inline"> atelier</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <Link href="/admin/products/create" className="hidden items-center gap-2 rounded-full bg-charcoal px-4 py-2 text-xs tracking-[0.14em] text-ivory uppercase sm:inline-flex">
                            <Package className="size-3.5" />
                            New perfume
                        </Link>
                        <Link href="/" className="underline decoration-line underline-offset-4">
                            View shop
                        </Link>
                    </div>
                </header>
                <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</main>
            </div>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="left" className="w-72 border-0 bg-[#1c1917] p-0 text-ivory">
                    <SheetTitle className="sr-only">Admin menu</SheetTitle>
                    <Sidebar storeName={store.name} current={current} name={auth.user?.name} onNavigate={() => setOpen(false)} />
                </SheetContent>
            </Sheet>
        </div>
    );
}

function Sidebar({
    storeName,
    current,
    name,
    onNavigate,
}: {
    storeName: string;
    current: string;
    name?: string;
    onNavigate?: () => void;
}) {
    return (
        <div className="flex h-full flex-col">
            <div className="px-5 pt-6 pb-4">
                <Link href="/admin" onClick={onNavigate} className="font-display text-3xl">
                    {storeName}
                </Link>
                <p className="mt-1 text-[11px] tracking-[0.2em] text-ivory/50 uppercase">Atelier</p>
            </div>
            <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6" aria-label="Admin">
                {groups.map((group) => (
                    <div key={group.label}>
                        <p className="px-3 pb-2 text-[10px] tracking-[0.18em] text-ivory/40 uppercase">{group.label}</p>
                        <div className="space-y-1">
                            {group.links.map((link) => {
                                const active = link.href === '/admin' ? current === '/admin' : current === link.href || current.startsWith(`${link.href}/`);
                                const Icon = link.icon;

                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={onNavigate}
                                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${active ? 'bg-white text-charcoal' : 'text-ivory/80 hover:bg-white/10 hover:text-ivory'}`}
                                    >
                                        <Icon className="size-4 shrink-0" />
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>
            <div className="border-t border-white/10 px-5 py-4">
                <p className="truncate text-sm">{name}</p>
                <Link href={logout()} method="post" as="button" className="mt-2 text-left text-xs tracking-[0.14em] text-ivory/60 uppercase">
                    Sign out
                </Link>
            </div>
        </div>
    );
}
