import { useForm } from '@inertiajs/react';
import DeleteButton from '@/components/admin/delete-button';
import type { Paginator } from '@/types/store';

type Row = {
    id: number;
    status: string;
    reason: string;
    order?: { number: string };
};

export default function Returns({
    returns,
    statuses,
}: {
    returns: Paginator<Row>;
    statuses: string[];
}) {
    return (
        <div>
            <h1 className="font-display text-4xl">Returns</h1>
            <ul className="mt-6 space-y-4">
                {returns.data.map((item) => (
                    <ReturnRow key={item.id} item={item} statuses={statuses} />
                ))}
            </ul>
        </div>
    );
}

function ReturnRow({ item, statuses }: { item: Row; statuses: string[] }) {
    const form = useForm({ status: item.status, admin_note: '' });

    return (
        <li className="border border-line p-4 text-sm">
            <p>{item.order?.number} · {item.reason}</p>
            <form className="mt-3 flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); form.patch(`/admin/returns/${item.id}`); }}>
                <select value={form.data.status} onChange={(event) => form.setData('status', event.target.value)} className="border border-line bg-transparent px-2 py-2">
                    {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <input value={form.data.admin_note} onChange={(event) => form.setData('admin_note', event.target.value)} placeholder="Note" className="border border-line bg-transparent px-2 py-2" />
                <button className="btn-line">Update</button>
                <DeleteButton href={`/admin/returns/${item.id}`} name={item.order?.number ?? 'this return'} />
            </form>
        </li>
    );
}
