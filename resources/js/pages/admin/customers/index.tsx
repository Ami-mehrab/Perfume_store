import { Link } from '@inertiajs/react';
import DeleteButton from '@/components/admin/delete-button';
import type { Paginator } from '@/types/store';

type Customer = {
    id: number;
    name: string;
    email: string;
    orders_count: number;
};

export default function Customers({
    customers,
    filters,
}: {
    customers: Paginator<Customer>;
    filters: { q: string };
}) {
    return (
        <div>
            <h1 className="font-display text-4xl">Customers</h1>
            <p className="mt-2 max-w-xl text-sm text-stone">Accounts created from the shop stay customers. Administrator access is only granted with the store:admin command.</p>
            <form className="mt-6" action="/admin/customers">
                <input name="q" defaultValue={filters.q} placeholder="Search" className="border border-line bg-transparent px-3 py-2" />
            </form>
            <ul className="mt-6 divide-y divide-line">
                {customers.data.map((customer) => (
                    <li key={customer.id} className="flex justify-between py-3 text-sm">
                        <Link href={`/admin/customers/${customer.id}`} className="underline">{customer.name}</Link>
                        <span>{customer.email}</span>
                        <span>{customer.orders_count} orders</span>
                        <DeleteButton href={`/admin/customers/${customer.id}`} name={customer.name} />
                    </li>
                ))}
            </ul>
        </div>
    );
}
