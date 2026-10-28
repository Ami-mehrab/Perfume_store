import { useForm, usePage } from '@inertiajs/react';
import DeleteButton from '@/components/admin/delete-button';
import { OrderBody } from '@/pages/store/confirmation';
import type { PublicOrder } from '@/types/store';

type Detail = PublicOrder & {
    id: number;
    returns: { id: number; status: string; reason: string; admin_note: string | null }[];
    refunds: { id: number; amount_cents: number; status: string; notes: string | null }[];
    payments: { id: number; gateway: string; status: string; amount_cents: number }[];
};

export default function OrderShow({
    order,
    statuses,
    paymentStatuses,
}: {
    order: Detail;
    statuses: { value: string; label: string }[];
    paymentStatuses: { value: string; label: string }[];
}) {
    const { store } = usePage().props;
    const form = useForm({ status: order.status, payment_status: order.payment_status });
    const refund = useForm({ amount: '', notes: '', return_request_id: '' });

    return (
        <div className="max-w-3xl">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="font-display text-4xl">{order.number}</h1>
                    <p className="mt-2 text-sm text-stone">{order.customer_name} · {order.email}</p>
                </div>
                <DeleteButton href={`/admin/orders/${order.id}`} name={order.number} label="Delete order" />
            </div>
            <OrderBody order={order} symbol={store} />
            <form
                className="mt-6 grid gap-3 md:grid-cols-2"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.patch(`/admin/orders/${order.id}`);
                }}
            >
                <label className="text-sm">Fulfillment
                    <select value={form.data.status} onChange={(event) => form.setData('status', event.target.value)} className="mt-1 w-full border border-line bg-transparent px-3 py-2">
                        {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                    </select>
                </label>
                <label className="text-sm">Payment
                    <select value={form.data.payment_status} onChange={(event) => form.setData('payment_status', event.target.value)} className="mt-1 w-full border border-line bg-transparent px-3 py-2">
                        {paymentStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                    </select>
                </label>
                <button className="btn-dark md:col-span-2">Update statuses</button>
            </form>
            <p className="mt-4 text-sm text-stone">Cancelling restores stock once. Marking a card payment paid does not change fulfillment.</p>
            <h2 className="font-display mt-10 text-2xl">Refund</h2>
            <p className="mt-2 text-sm text-stone">This records the refund in the store. Online refunds still need to be issued in the SSLCOMMERZ merchant panel.</p>
            <form
                className="mt-3 space-y-3"
                onSubmit={(event) => {
                    event.preventDefault();
                    refund.post(`/admin/orders/${order.id}/refunds`);
                }}
            >
                <input value={refund.data.amount} onChange={(event) => refund.setData('amount', event.target.value)} placeholder="Amount" className="w-full border border-line bg-transparent px-3 py-2" />
                <textarea value={refund.data.notes} onChange={(event) => refund.setData('notes', event.target.value)} className="w-full border border-line bg-transparent px-3 py-2" rows={3} placeholder="Note" />
                {(refund.errors.amount) && <p className="text-sm text-red-700">{refund.errors.amount}</p>}
                <button className="btn-line">Record refund</button>
            </form>
            <ul className="mt-4 text-sm">
                {order.refunds.map((item) => (
                    <li key={item.id}>{item.status} · {(item.amount_cents / 100).toFixed(2)}</li>
                ))}
            </ul>
            <h2 className="font-display mt-8 text-2xl">Returns</h2>
            <ul className="mt-3 space-y-2 text-sm">
                {order.returns.map((item) => (
                    <li key={item.id} className="border border-line p-3">{item.status}: {item.reason}</li>
                ))}
            </ul>
        </div>
    );
}
