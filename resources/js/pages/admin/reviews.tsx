import { router, useForm } from '@inertiajs/react';
import DeleteButton from '@/components/admin/delete-button';
import type { Paginator } from '@/types/store';

type Row = {
    id: number;
    rating: number;
    body: string;
    status: string;
    is_featured: boolean;
    created_at: string;
    product?: { id: number; name: string; slug: string };
    user?: { id: number; name: string; email: string };
};

export default function Reviews({
    reviews,
    filters,
    statuses,
}: {
    reviews: Paginator<Row>;
    filters: { status: string };
    statuses: string[];
}) {
    return (
        <div>
            <h1 className="font-display text-4xl">Reviews</h1>
            <p className="mt-2 text-sm text-stone">Approve reviews before they appear on the product page. Featured reviews show first.</p>

            <div className="mt-4 flex flex-wrap gap-2 text-sm">
                {['all', ...statuses].map((status) => {
                    const active = filters.status === status;

                    return (
                        <button
                            key={status}
                            type="button"
                            className={`rounded-full px-3 py-1.5 capitalize ${active ? 'bg-charcoal text-ivory' : 'border border-line bg-white'}`}
                            onClick={() => router.get('/admin/reviews', status === 'all' ? {} : { status }, { preserveState: true })}
                        >
                            {status}
                        </button>
                    );
                })}
            </div>

            <ul className="mt-6 space-y-4">
                {reviews.data.length === 0 && (
                    <li className="rounded-2xl border border-line bg-white p-5 text-sm text-stone">No reviews in this filter.</li>
                )}
                {reviews.data.map((item) => (
                    <ReviewRow key={item.id} item={item} statuses={statuses} />
                ))}
            </ul>
        </div>
    );
}

function ReviewRow({ item, statuses }: { item: Row; statuses: string[] }) {
    const form = useForm({
        status: item.status,
        is_featured: item.is_featured,
    });

    return (
        <li className="rounded-2xl border border-line bg-white p-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="font-medium text-charcoal">
                        {item.product?.name ?? 'Perfume'} · {item.rating}/5
                        {item.is_featured ? ' · Featured' : ''}
                    </p>
                    <p className="mt-1 text-stone">
                        {item.user?.name} · {item.user?.email} · {new Date(item.created_at).toLocaleDateString()}
                    </p>
                    <p className="mt-3 leading-6 text-charcoal">{item.body}</p>
                </div>
                <DeleteButton href={`/admin/reviews/${item.id}`} name="this review" />
            </div>
            <form
                className="mt-4 flex flex-wrap items-center gap-3"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.patch(`/admin/reviews/${item.id}`, { preserveScroll: true });
                }}
            >
                <label className="text-stone">
                    Status
                    <select
                        value={form.data.status}
                        onChange={(event) => {
                            const status = event.target.value;
                            form.setData((current) => ({
                                ...current,
                                status,
                                is_featured: status === 'approved' ? current.is_featured : false,
                            }));
                        }}
                        className="ml-2 border border-line bg-transparent px-2 py-2 capitalize"
                    >
                        {statuses.map((status) => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </label>
                <label className="inline-flex items-center gap-2 text-stone">
                    <input
                        type="checkbox"
                        checked={form.data.is_featured}
                        disabled={form.data.status !== 'approved'}
                        onChange={(event) => form.setData('is_featured', event.target.checked)}
                    />
                    Featured
                </label>
                <button className="btn-line" disabled={form.processing}>Save</button>
            </form>
        </li>
    );
}
