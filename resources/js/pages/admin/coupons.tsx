import { useForm } from '@inertiajs/react';
import DeleteButton from '@/components/admin/delete-button';

type Coupon = {
    id: number;
    code: string;
    type: string;
    value: number;
    is_active: boolean;
    uses_count: number;
    max_uses: number | null;
};

export default function Coupons({ coupons }: { coupons: Coupon[] }) {
    const form = useForm({
        code: '',
        type: 'percent',
        value: '10',
        min_subtotal: '0',
        max_uses: '',
        is_active: true,
    });

    return (
        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
            <div>
                <h1 className="font-display text-4xl">Coupons</h1>
                <ul className="mt-6 divide-y divide-line text-sm">
                    {coupons.map((coupon) => (
                        <li key={coupon.id} className="flex justify-between py-3">
                            <span>{coupon.code} · {coupon.type} · {coupon.value} · {coupon.uses_count}/{coupon.max_uses ?? '∞'}</span>
                            <DeleteButton href={`/admin/coupons/${coupon.id}`} name={coupon.code} />
                        </li>
                    ))}
                </ul>
            </div>
            <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); form.post('/admin/coupons'); }}>
                <h2 className="font-display text-2xl">New coupon</h2>
                <input value={form.data.code} onChange={(event) => form.setData('code', event.target.value)} placeholder="Code" className="w-full border border-line bg-transparent px-3 py-2" required />
                <select value={form.data.type} onChange={(event) => form.setData('type', event.target.value)} className="w-full border border-line bg-transparent px-3 py-2">
                    <option value="percent">Percent</option>
                    <option value="fixed">Fixed amount</option>
                </select>
                <input value={form.data.value} onChange={(event) => form.setData('value', event.target.value)} placeholder={form.data.type === 'percent' ? 'Percent' : 'Amount'} className="w-full border border-line bg-transparent px-3 py-2" />
                <input value={form.data.min_subtotal} onChange={(event) => form.setData('min_subtotal', event.target.value)} placeholder="Minimum subtotal" className="w-full border border-line bg-transparent px-3 py-2" />
                <input value={form.data.max_uses} onChange={(event) => form.setData('max_uses', event.target.value)} placeholder="Max uses" className="w-full border border-line bg-transparent px-3 py-2" />
                <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.data.is_active} onChange={(event) => form.setData('is_active', event.target.checked)} /> Active</label>
                <button className="btn-dark">Save</button>
            </form>
        </div>
    );
}
