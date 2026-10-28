import { Link, router } from '@inertiajs/react';
import DeleteButton from '@/components/admin/delete-button';
import { formatMoney } from '@/lib/money';
import { usePage } from '@inertiajs/react';
import type { Paginator } from '@/types/store';

type Row = {
    id: number;
    number: string;
    tracking_token: string;
    customer_name: string;
    email: string;
    status: string;
    payment_status: string;
    total_cents: number;
};

export default function OrdersIndex({
    orders,
    filters,
    statuses,
}: {
    orders: Paginator<Row>;
    filters: { q: string; status: string };
    statuses: string[];
}) {
    const { store } = usePage().props;

    return (
        <div>
            <h1 className="font-display text-4xl">Orders</h1>
            <form className="mt-6 flex gap-2" onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                router.get('/admin/orders', { q: data.get('q'), status: data.get('status') }, { preserveState: true });
            }}>
                <input name="q" defaultValue={filters.q} placeholder="Number, name, email" className="border border-line bg-transparent px-3 py-2" />
                <select name="status" defaultValue={filters.status} className="border border-line bg-transparent px-3 py-2">
                    <option value="">Any status</option>
                    {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <button className="btn-line">Filter</button>
            </form>
            <ul className="mt-6 divide-y divide-line">
                {orders.data.map((order) => (
                    <li key={order.number} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                        <Link className="underline" href={`/admin/orders/${order.id}`}>{order.number}</Link>
                        <span>{order.customer_name}</span>
                        <span>{order.status} · {order.payment_status}</span>
                        <span>{formatMoney(order.total_cents, store)}</span>
                        <DeleteButton href={`/admin/orders/${order.id}`} name={order.number} />
                    </li>
                ))}
            </ul>
        </div>
    );
}
