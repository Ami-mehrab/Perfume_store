import { usePage } from '@inertiajs/react';
import DeleteButton from '@/components/admin/delete-button';
import { formatMoney } from '@/lib/money';

type Order = {
    id: number;
    number: string;
    tracking_token: string;
    status: string;
    payment_status: string;
    total_cents: number;
};

export default function CustomerShow({
    customer,
    orders,
    addresses,
}: {
    customer: { id: number; name: string; email: string; created_at: string };
    orders: Order[];
    addresses: { id: number; label: string; city: string; country: string }[];
}) {
    const { store } = usePage().props;

    return (
        <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="font-display text-4xl">{customer.name}</h1>
                    <p className="mt-2 text-sm">{customer.email}</p>
                </div>
                <DeleteButton href={`/admin/customers/${customer.id}`} name={customer.name} label="Delete customer" />
            </div>
            <h2 className="font-display mt-8 text-2xl">Orders</h2>
            <ul className="mt-3 space-y-2 text-sm">
                {orders.map((order) => (
                    <li key={order.number}>
                        <a className="underline" href={`/admin/orders/${order.id}`}>{order.number}</a>
                        {' '}· {order.status} · {order.payment_status} · {formatMoney(order.total_cents, store)}
                    </li>
                ))}
            </ul>
            <h2 className="font-display mt-8 text-2xl">Addresses</h2>
            <ul className="mt-3 text-sm">
                {addresses.map((address) => (
                    <li key={address.id}>{address.label}: {address.city}, {address.country}</li>
                ))}
            </ul>
        </div>
    );
}
