import { router } from '@inertiajs/react';
import DeleteButton from '@/components/admin/delete-button';
import type { Paginator } from '@/types/store';

type Row = {
    id: number;
    product_name: string;
    size_ml: number | null;
    name: string;
    phone: string;
    status: string;
    created_at: string;
};

export default function Preorders({ requests }: { requests: Paginator<Row> }) {
    return (
        <div>
            <h1 className="font-display text-4xl">Pre-orders</h1>
            <p className="mt-2 text-sm text-stone">Requests from shoppers when a size is out of stock.</p>
            {requests.data.length === 0 ? (
                <p className="mt-8 text-sm text-stone">No pre-order requests yet.</p>
            ) : (
                <ul className="mt-6 space-y-3">
                    {requests.data.map((item) => (
                        <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm">
                            <div>
                                <p className="font-medium">{item.product_name}{item.size_ml ? ` · ${item.size_ml} ml` : ''}</p>
                                <p className="text-stone">{item.name} · {item.phone}</p>
                            </div>
                            <div className="flex items-center gap-2">
                            <select
                                className="rounded-lg border border-line bg-transparent px-2 py-2"
                                value={item.status}
                                onChange={(event) => router.patch(`/admin/preorders/${item.id}`, { status: event.target.value }, { preserveScroll: true })}
                            >
                                <option value="new">New</option>
                                <option value="contacted">Contacted</option>
                            </select>
                            <DeleteButton href={`/admin/preorders/${item.id}`} name={item.name} />
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
