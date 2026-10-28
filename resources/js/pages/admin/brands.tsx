import { Link, useForm } from '@inertiajs/react';
import DeleteButton from '@/components/admin/delete-button';

type Brand = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    country: string | null;
    is_active: boolean;
    products_count: number;
};

export default function Brands({ brands }: { brands: Brand[] }) {
    const form = useForm({ name: '', description: '', country: '', is_active: true });

    return (
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div>
                <h1 className="text-3xl font-semibold">Brands</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-stone">
                    The brand name is what shoppers see on a perfume card, on the product page, and on the Brands page in the shop header.
                    Open a brand’s perfume count to view and edit those bottles. You can delete a brand when it has no stock left.
                </p>
                <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-white">
                    {brands.map((brand) => (
                        <li key={brand.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                            <span>
                                <Link
                                    href={`/admin/products?brand=${brand.slug}`}
                                    className="font-medium underline decoration-line underline-offset-4"
                                >
                                    {brand.name}
                                </Link>
                                <span className="mt-1 block text-xs text-stone">
                                    {brand.products_count > 0 ? (
                                        <Link
                                            href={`/admin/products?brand=${brand.slug}`}
                                            className="underline decoration-line underline-offset-2"
                                        >
                                            {brand.products_count} perfume{brand.products_count === 1 ? '' : 's'}
                                        </Link>
                                    ) : (
                                        <span>0 perfumes</span>
                                    )}
                                    {brand.country ? ` · ${brand.country}` : ''}
                                    {brand.is_active ? '' : ' · hidden'}
                                </span>
                            </span>
                            <DeleteButton href={`/admin/brands/${brand.slug}`} name={brand.name} />
                        </li>
                    ))}
                </ul>
            </div>
            <form
                className="space-y-3 rounded-2xl border border-line bg-white p-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post('/admin/brands');
                }}
            >
                <h2 className="text-lg font-semibold">New brand</h2>
                <label className="block text-sm">
                    Brand name
                    <input value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} placeholder="Dior" className="mt-1 w-full border border-line px-3 py-2" required />
                </label>
                <label className="block text-sm">
                    Country, optional
                    <input value={form.data.country} onChange={(event) => form.setData('country', event.target.value)} placeholder="France" className="mt-1 w-full border border-line px-3 py-2" />
                </label>
                <label className="block text-sm">
                    Short description, optional
                    <textarea value={form.data.description} onChange={(event) => form.setData('description', event.target.value)} className="mt-1 w-full border border-line px-3 py-2" />
                </label>
                {form.errors.name && <p className="text-sm text-red-700">{form.errors.name}</p>}
                <button className="btn-dark w-full" disabled={form.processing}>Save brand</button>
            </form>
        </div>
    );
}
