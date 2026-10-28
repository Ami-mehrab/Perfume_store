import { Link, usePage } from '@inertiajs/react';
import { PageHeader } from '@/components/admin/ui';
import { formatMoney } from '@/lib/money';

type Stats = {
    orders: number;
    revenue_cents: number;
    pending_orders: number;
    customers: number;
    products: number;
    low_stock: number;
    open_returns: number;
};

type Order = {
    id: number;
    number: string;
    tracking_token: string;
    customer_name: string;
    total_cents: number;
    status: string;
    payment_status: string;
};

export default function Dashboard({ stats, recentOrders }: { stats: Stats; recentOrders: Order[] }) {
    const { store } = usePage().props;
    const cards = [
        ['Orders', stats.orders, '/admin/orders', 'Every order placed'],
        ['Paid revenue', formatMoney(stats.revenue_cents, store), '/admin/orders', 'Confirmed payments only'],
        ['Needs action', stats.pending_orders, '/admin/orders', 'Still waiting to ship'],
        ['Customers', stats.customers, '/admin/customers', 'Registered accounts'],
        ['Perfumes', stats.products, '/admin/products', 'In the catalogue'],
        ['Low stock', stats.low_stock, '/admin/inventory', 'Sizes running short'],
        ['Open returns', stats.open_returns, '/admin/returns', 'Waiting for a decision'],
    ];

    return (
        <div className="space-y-8">
            <PageHeader
                title="Overview"
                description="What needs attention today, then a short path into the catalogue."
                action={<Link href="/admin/products/create" className="btn-dark">Add a perfume</Link>}
            />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map(([label, value, href, hint]) => (
                    <Link key={String(label)} href={String(href)} className="rounded-2xl border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5">
                        <p className="text-[11px] tracking-[0.16em] text-stone uppercase">{label}</p>
                        <p className="font-display mt-2 text-3xl text-charcoal">{value}</p>
                        <p className="mt-2 text-xs text-stone">{hint}</p>
                    </Link>
                ))}
            </div>
            <section className="rounded-2xl border border-line bg-white shadow-sm">
                <div className="flex items-center justify-between px-5 py-4">
                    <h2 className="font-display text-2xl">Recent orders</h2>
                    <Link href="/admin/orders" className="text-sm underline">All orders</Link>
                </div>
                {recentOrders.length === 0 ? (
                    <p className="px-5 pb-5 text-sm text-stone">No orders yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-y border-line text-[11px] tracking-[0.14em] text-stone uppercase">
                                    <th className="px-5 py-2 font-medium">Order</th>
                                    <th className="px-3 py-2 font-medium">Customer</th>
                                    <th className="px-3 py-2 font-medium">Fulfillment</th>
                                    <th className="px-3 py-2 font-medium">Payment</th>
                                    <th className="px-5 py-2 text-right font-medium">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.map((order) => (
                                    <tr key={order.number} className="border-b border-line last:border-0">
                                        <td className="px-5 py-3">
                                            <Link href={`/admin/orders/${order.id}`} className="underline">{order.number}</Link>
                                        </td>
                                        <td className="px-3 py-3">{order.customer_name}</td>
                                        <td className="px-3 py-3 capitalize">{order.status}</td>
                                        <td className="px-3 py-3 capitalize">{order.payment_status}</td>
                                        <td className="px-5 py-3 text-right">{formatMoney(order.total_cents, store)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
