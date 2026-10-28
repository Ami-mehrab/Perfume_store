import { Link, router } from '@inertiajs/react';
import DeleteButton from '@/components/admin/delete-button';
import { PageHeader } from '@/components/admin/ui';
import type { Paginator } from '@/types/store';

type Row = {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    is_featured?: boolean;
    variants_sum_stock: number | null;
    brand?: { name: string };
};

export default function ProductsIndex({
    products,
    filters,
    brandFilter = null,
}: {
    products: Paginator<Row>;
    filters: { q: string; brand?: string };
    brandFilter?: { name: string; slug: string } | null;
}) {
    return (
        <div className="space-y-6">
            <PageHeader
                title={brandFilter ? `Perfumes · ${brandFilter.name}` : 'Perfumes'}
                description={
                    brandFilter
                        ? `Every bottle under ${brandFilter.name}. Open a name to edit price, offer, stock, or photos.`
                        : 'Search the catalogue, then open a bottle to change its price, offer, stock, or photographs.'
                }
                action={<Link href="/admin/products/create" className="btn-dark">New perfume</Link>}
            />
            {brandFilter && (
                <p className="text-sm text-stone">
                    Showing {brandFilter.name} only.{' '}
                    <Link href="/admin/products" className="underline">Show all perfumes</Link>
                    {' · '}
                    <Link href="/admin/brands" className="underline">Back to brands</Link>
                </p>
            )}
            <form
                className="flex gap-2"
                onSubmit={(event) => {
                    event.preventDefault();
                    const q = new FormData(event.currentTarget).get('q');
                    router.get('/admin/products', {
                        q: q || undefined,
                        brand: filters.brand || undefined,
                    }, { preserveState: true });
                }}
            >
                <label className="sr-only" htmlFor="perfume-search">Search perfumes</label>
                <input id="perfume-search" name="q" defaultValue={filters.q} placeholder="Search by name" className="w-full max-w-sm rounded-lg border border-line bg-white px-3 py-2.5 text-sm" />
                <button className="btn-line" type="submit">Search</button>
            </form>
            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-line text-[11px] tracking-[0.14em] text-stone uppercase">
                            <th className="px-5 py-3 font-medium">Perfume</th>
                            <th className="px-3 py-3 font-medium">House</th>
                            <th className="px-3 py-3 font-medium">Stock</th>
                            <th className="px-5 py-3 font-medium">Shop</th>
                            <th className="px-5 py-3 font-medium"> </th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.data.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-5 py-8 text-stone">No perfumes match that search.</td>
                            </tr>
                        )}
                        {products.data.map((product) => (
                            <tr key={product.id} className="border-b border-line last:border-0">
                                <td className="px-5 py-4">
                                    <Link href={`/admin/products/${product.slug}/edit`} className="font-medium underline decoration-line underline-offset-4">{product.name}</Link>
                                </td>
                                <td className="px-3 py-4 text-stone">{product.brand?.name}</td>
                                <td className="px-3 py-4">{product.variants_sum_stock ?? 0}</td>
                                <td className="px-5 py-4">
                                    <span className={`rounded-full px-2 py-1 text-xs ${product.is_active ? 'bg-[#e7f0e4] text-[#2f5d32]' : 'bg-[#f3e6e4] text-[#8a3b32]'}`}>
                                        {product.is_active ? 'Visible' : 'Hidden'}
                                    </span>
                                </td>
                                <td className="px-5 py-4 text-right">
                                    <DeleteButton href={`/admin/products/${product.slug}`} name={product.name} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
