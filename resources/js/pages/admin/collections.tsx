import { router, useForm } from '@inertiajs/react';
import DeleteButton from '@/components/admin/delete-button';

type Section = {
    id: number;
    name: string;
    name_bn: string | null;
    slug: string;
    audience: string | null;
    is_active: boolean;
    sort_order: number;
    image: string | null;
};

const audiences: Record<string, string> = {
    masculine: 'Male',
    feminine: 'Female',
    unisex: 'Unisex',
    all: 'Everyone',
};

export default function Collections({ collections }: { collections: Section[] }) {
    const form = useForm<{
        name: string;
        name_bn: string;
        description: string;
        audience: string;
        swatch: string;
        is_featured: boolean;
        is_active: boolean;
        sort_order: number;
        image: File | null;
    }>({
        name: '',
        name_bn: '',
        description: '',
        audience: 'masculine',
        swatch: '#9d174d',
        is_featured: true,
        is_active: true,
        sort_order: collections.length,
        image: null,
    });

    return (
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div>
                <h1 className="text-3xl font-semibold">Collections</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-stone">
                    These are the round pictures under the homepage banner, and the links in the menu. A photo is optional. Without one, the circle shows the first letter.
                </p>
                <ul className="mt-6 space-y-3">
                    {collections.map((section) => (
                        <li key={section.id} className="rounded-2xl border border-line bg-white p-4">
                            <form
                                className="flex flex-wrap items-center gap-4"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    const data = new FormData(event.currentTarget);
                                    data.append('_method', 'put');
                                    router.post(`/admin/collections/${section.slug}`, data, { forceFormData: true, preserveScroll: true });
                                }}
                            >
                                {section.image ? (
                                    <img src={section.image} alt="" className="size-16 rounded-full object-cover" />
                                ) : (
                                    <span className="grid size-16 place-items-center rounded-full bg-[#f3f4f6] text-sm">{section.name.slice(0, 1)}</span>
                                )}
                                <div className="min-w-40 flex-1">
                                    <p className="font-medium">{section.name}{section.name_bn ? ` · ${section.name_bn}` : ''}</p>
                                    <p className="text-xs text-stone">{section.audience ? audiences[section.audience] ?? section.audience : 'Hidden'}</p>
                                </div>
                                <input type="hidden" name="name" value={section.name} />
                                <input type="hidden" name="name_bn" value={section.name_bn ?? ''} />
                                <input type="hidden" name="audience" value={section.audience ?? 'all'} />
                                <input type="hidden" name="swatch" value="#9d174d" />
                                <input type="hidden" name="is_featured" value="1" />
                                <input type="hidden" name="is_active" value={section.is_active ? '1' : '0'} />
                                <input type="hidden" name="sort_order" value={section.sort_order} />
                                <label className="text-sm">
                                    Photo
                                    <input name="image" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-52 text-xs" />
                                </label>
                                <button className="btn-dark" type="submit">Save photo</button>
                                <DeleteButton href={`/admin/collections/${section.slug}`} name={section.name} />
                            </form>
                        </li>
                    ))}
                </ul>
            </div>
            <form
                className="space-y-3 rounded-2xl border border-line bg-white p-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post('/admin/collections', { forceFormData: true });
                }}
            >
                <h2 className="text-lg font-semibold">New collection</h2>
                <label className="block text-sm">
                    Collection name
                    <input value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} placeholder="Kids" className="mt-1 w-full border border-line px-3 py-2" required />
                </label>
                <label className="block text-sm">
                    বাংলা নাম
                    <input value={form.data.name_bn} onChange={(event) => form.setData('name_bn', event.target.value)} placeholder="শিশু" className="mt-1 w-full border border-line px-3 py-2" />
                </label>
                <label className="block text-sm">
                    Show perfumes for
                    <select value={form.data.audience} onChange={(event) => form.setData('audience', event.target.value)} className="mt-1 w-full border border-line px-3 py-2">
                        <option value="masculine">Male</option>
                        <option value="feminine">Female</option>
                        <option value="unisex">Unisex</option>
                        <option value="all">Everyone</option>
                    </select>
                </label>
                <label className="block text-sm">
                    Photo, optional
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-xs" onChange={(event) => form.setData('image', event.target.files?.[0] ?? null)} />
                </label>
                <label className="flex gap-2 text-sm">
                    <input type="checkbox" checked={form.data.is_active} onChange={(event) => form.setData('is_active', event.target.checked)} />
                    Show in the shop menu
                </label>
                <button className="btn-dark w-full" disabled={form.processing}>Save collection</button>
            </form>
        </div>
    );
}
