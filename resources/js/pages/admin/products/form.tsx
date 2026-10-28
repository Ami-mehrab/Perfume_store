import { useForm } from '@inertiajs/react';
import DeleteButton from '@/components/admin/delete-button';
import { Card, inputClass, Label, PageHeader } from '@/components/admin/ui';

type Variant = {
    id?: number;
    concentration: string;
    size_ml: number;
    sku: string;
    price: string;
    compare_at: string;
    reference?: string;
    stock: number;
    is_active: boolean;
};

type ProductForm = {
    name: string;
    name_bn: string;
    slug: string;
    brand_id: string;
    collection_id: string;
    description: string;
    description_bn: string;
    story: string;
    family: string;
    gender: string;
    swatch: string;
    top_notes: string;
    heart_notes: string;
    base_notes: string;
    is_featured: boolean;
    is_active: boolean;
    variants: Variant[];
    images: File[];
    remove_images: number[];
};

type Existing = Omit<ProductForm, 'images' | 'remove_images'> & {
    id: number;
    slug: string;
    images: { id: number; url: string; alt: string }[];
};

const blank = (name = ''): Variant => ({
    concentration: 'edp',
    size_ml: 50,
    sku: suggestSku(name, 'edp', 50),
    price: '',
    compare_at: '',
    stock: 0,
    is_active: true,
});

export default function ProductFormPage({
    product,
    brands,
    families,
    concentrations,
}: {
    product: Existing | null;
    brands: { id: number; name: string }[];
    collections: { id: number; name: string }[];
    families: string[];
    genders: string[];
    concentrations: { value: string; label: string }[];
}) {
    const form = useForm<ProductForm>({
        name: product?.name ?? '',
        name_bn: product?.name_bn ?? '',
        slug: product?.slug ?? '',
        brand_id: String(product?.brand_id ?? brands[0]?.id ?? ''),
        collection_id: product?.collection_id ? String(product.collection_id) : '',
        description: product?.description ?? '',
        description_bn: product?.description_bn ?? '',
        story: product?.story ?? '',
        family: product?.family ?? 'woody',
        gender: product?.gender ?? 'unisex',
        swatch: product?.swatch ?? '#8d6e4c',
        top_notes: product?.top_notes ?? '',
        heart_notes: product?.heart_notes ?? '',
        base_notes: product?.base_notes ?? '',
        is_featured: product?.is_featured ?? false,
        is_active: product?.is_active ?? true,
        variants: product?.variants?.length ? product.variants : [blank()],
        images: [],
        remove_images: [],
    });

    function submit(event: React.FormEvent) {
        event.preventDefault();
        const url = product ? `/admin/products/${product.slug}` : '/admin/products';
        form.transform((data) => (product ? { ...data, _method: 'put' } : data));
        form.post(url, { forceFormData: true });
    }

    const errors = Object.entries(form.errors);

    return (
        <form className="space-y-6" onSubmit={submit}>
            <PageHeader
                title={product ? 'Edit perfume' : 'New perfume'}
                description="Name, who it is for, selling price, offer price, stock, and photos. Leave the offer blank if there is no discount."
            />
            {errors.length > 0 && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                    {errors.map(([key, message]) => (
                        <p key={key}>{message}</p>
                    ))}
                </div>
            )}
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-6">
                    <Card title="Perfume" description="Name, brand, and who it is for. The brand is the name on the product card.">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Text label="Perfume name" hint="English, for example Dior Sauvage." value={form.data.name} onChange={(value) => form.setData('name', value)} />
                            <Text label="বাংলা নাম" hint="উদাহরণ: ডিওর সাভাজ" value={form.data.name_bn} onChange={(value) => form.setData('name_bn', value)} />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <label>
                                <Label hint="Shown on the card, the product page, and the Brands row.">Brand</Label>
                                <select value={form.data.brand_id} onChange={(event) => form.setData('brand_id', event.target.value)} className={inputClass}>
                                    {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                                </select>
                            </label>
                            <label>
                                <Label hint="Male, female, or unisex. This decides which shop section lists it.">For</Label>
                                <select value={form.data.gender} onChange={(event) => form.setData('gender', event.target.value)} className={inputClass}>
                                    <option value="masculine">Male</option>
                                    <option value="feminine">Female</option>
                                    <option value="unisex">Unisex</option>
                                </select>
                            </label>
                        </div>
                        <Select label="Smell type" value={form.data.family} options={families} onChange={(value) => form.setData('family', value)} />
                    </Card>

                    <Card title="Story" description="The shop shows the Bangla description when the visitor is reading Bangla, and keeps the other language underneath.">
                        <Area label="English description" value={form.data.description} onChange={(value) => form.setData('description', value)} />
                        <Area label="Bangla description" value={form.data.description_bn} onChange={(value) => form.setData('description_bn', value)} />
                        <Area label="Longer story" hint="Optional. Shown further down the product page." value={form.data.story} onChange={(value) => form.setData('story', value)} />
                    </Card>

                    <Card title="Fragrance notes" description="Separate notes with commas.">
                        <Text label="Top notes" value={form.data.top_notes} onChange={(value) => form.setData('top_notes', value)} />
                        <Text label="Heart notes" value={form.data.heart_notes} onChange={(value) => form.setData('heart_notes', value)} />
                        <Text label="Base notes" value={form.data.base_notes} onChange={(value) => form.setData('base_notes', value)} />
                        <label className="block max-w-xs">
                            <Label hint="The colour behind the bottle when there is no photograph.">Swatch</Label>
                            <span className="mt-1.5 flex items-center gap-3">
                                <input type="color" value={form.data.swatch} onChange={(event) => form.setData('swatch', event.target.value)} className="size-11 cursor-pointer rounded-lg border border-line bg-white" />
                                <input value={form.data.swatch} onChange={(event) => form.setData('swatch', event.target.value)} className={inputClass + ' mt-0'} />
                            </span>
                        </label>
                    </Card>

                    <Card title="Sizes, price, and offers" description="Each size has its own price, offer, SKU, and stock. The offer is the higher price shown with a line through it. Leave it blank when the size is not on sale. Amounts are in taka, such as 3200.">
                        <div className="flex justify-end">
                            <button
                                type="button"
                                className="text-sm underline"
                                onClick={() => form.setData('variants', [...form.data.variants, blank(form.data.name)])}
                            >
                                Add a size
                            </button>
                        </div>
                        {form.data.variants.map((variant, index) => (
                            <div key={variant.id ?? index} className="rounded-xl border border-line bg-[#fbf8f4] p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <p className="text-sm font-medium">Size {index + 1}</p>
                                    {form.data.variants.length > 1 && (
                                        <button type="button" className="text-sm text-red-700 underline" onClick={() => form.setData('variants', form.data.variants.filter((_, item) => item !== index))}>
                                            Remove
                                        </button>
                                    )}
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <label>
                                        <Label>Concentration</Label>
                                        <select value={variant.concentration} onChange={(event) => updateVariant(form, index, { concentration: event.target.value })} className={inputClass}>
                                            {concentrations.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                                        </select>
                                    </label>
                                    <label>
                                        <Label>Bottle size (ml)</Label>
                                        <input type="number" min={1} value={variant.size_ml} onChange={(event) => updateVariant(form, index, { size_ml: Number(event.target.value) })} className={inputClass} />
                                    </label>
                                    <label>
                                        <Label hint="What the customer pays, in taka.">Selling price (৳)</Label>
                                        <input inputMode="decimal" value={variant.price} onChange={(event) => updateVariant(form, index, { price: event.target.value })} className={inputClass} placeholder="3200" />
                                        {variant.reference && (
                                            <p className="mt-1 text-xs text-stone">Market reference ৳{variant.reference}. Not our selling price.</p>
                                        )}
                                    </label>
                                    <label>
                                        <Label hint="Optional. The old price, shown crossed out. Not the market reference.">Offer price (৳)</Label>
                                        <input inputMode="decimal" value={variant.compare_at} onChange={(event) => updateVariant(form, index, { compare_at: event.target.value })} className={inputClass} placeholder="3900" />
                                    </label>
                                    <label>
                                        <Label hint="Unique code for this size.">SKU</Label>
                                        <input value={variant.sku} onChange={(event) => updateVariant(form, index, { sku: event.target.value })} className={inputClass} />
                                    </label>
                                    <label>
                                        <Label hint="Whole bottles only. 0 means out of stock.">Bottles in stock</Label>
                                        <input
                                            type="number"
                                            min={0}
                                            step={1}
                                            inputMode="numeric"
                                            value={Number.isFinite(variant.stock) ? variant.stock : 0}
                                            onChange={(event) => {
                                                const raw = event.target.value;
                                                const stock = raw === '' ? 0 : Math.max(0, Math.trunc(Number(raw)) || 0);
                                                updateVariant(form, index, { stock });
                                            }}
                                            className={inputClass}
                                        />
                                    </label>
                                </div>
                                <label className="mt-3 flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={variant.is_active} onChange={(event) => updateVariant(form, index, { is_active: event.target.checked })} />
                                    Sell this size
                                </label>
                            </div>
                        ))}
                    </Card>
                </div>

                <div className="space-y-6 lg:sticky lg:top-24">
                    <Card title="Publish">
                        {!form.data.is_active && (
                            <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                                This perfume is hidden. Stock and prices do not appear in Shop or search until you turn on Visible in the shop.
                            </p>
                        )}
                        <Toggle
                            checked={form.data.is_active}
                            onChange={(checked) => form.setData('is_active', checked)}
                            title="Visible in the shop"
                            copy="Must be on for search, Shop, and buying. Hidden bottles stay in the atelier only."
                        />
                        <Toggle
                            checked={form.data.is_featured}
                            onChange={(checked) => form.setData('is_featured', checked)}
                            title="Featured on the homepage"
                            copy="Featured bottles appear in Shop by featured."
                        />
                        <button className="btn-dark w-full" disabled={form.processing}>
                            {form.processing ? 'Saving' : 'Save perfume'}
                        </button>
                        {product && <DeleteButton href={`/admin/products/${product.slug}`} name={product.name} label="Delete perfume" />}
                    </Card>
                    <Card title="Photographs" description="Add several photos. The first one is the large picture and the product card. The rest appear as the small pictures underneath.">
                        {product?.images && product.images.length > 0 && (
                            <div className="mb-4 flex flex-wrap gap-3">
                                {product.images.map((image, index) => (
                                    <label key={image.id} className={`w-24 text-xs ${index === 0 ? 'text-[#9d174d]' : 'text-stone'}`}>
                                        <img src={image.url} alt={image.alt} className={`mb-2 aspect-square w-full rounded-xl border-2 bg-[#f3f4f6] object-contain p-1 ${index === 0 ? 'border-[#db2777]' : 'border-transparent'}`} />
                                        <span className="block">{index === 0 ? 'Large photo' : `Small photo ${index + 1}`}</span>
                                        <span className="mt-1 flex items-center gap-1">
                                            <input
                                                type="checkbox"
                                                checked={form.data.remove_images.includes(image.id)}
                                                onChange={(event) => form.setData('remove_images', event.target.checked ? [...form.data.remove_images, image.id] : form.data.remove_images.filter((id) => id !== image.id))}
                                            />
                                            Remove
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                        <label className="block rounded-xl border border-dashed border-line bg-[#fbf8f4] px-4 py-6 text-center text-sm text-stone">
                            Choose one or several photographs
                            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="mt-3 block w-full text-xs" onChange={(event) => form.setData('images', Array.from(event.target.files ?? []))} />
                            {form.data.images.length > 0 && <span className="mt-2 block text-charcoal">{form.data.images.length} ready to upload</span>}
                        </label>
                    </Card>
                </div>
            </div>
        </form>
    );
}

function suggestSku(name: string, concentration: string, size: number): string {
    const base = name.toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 16);

    if (!base) {
        return '';
    }

    return `${base}-${concentration.toUpperCase()}-${size}`;
}

function updateVariant(form: { data: ProductForm; setData: (key: 'variants', value: Variant[]) => void }, index: number, patch: Partial<Variant>) {
    form.setData('variants', form.data.variants.map((variant, item) => item === index ? { ...variant, ...patch } : variant));
}

function Text({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (value: string) => void }) {
    return (
        <label className="block">
            <Label hint={hint}>{label}</Label>
            <input value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} />
        </label>
    );
}

function Area({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (value: string) => void }) {
    return (
        <label className="block">
            <Label hint={hint}>{label}</Label>
            <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className={inputClass} />
        </label>
    );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
    return (
        <label className="block">
            <Label>{label}</Label>
            <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>
                {options.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
        </label>
    );
}

function Toggle({ checked, onChange, title, copy }: { checked: boolean; onChange: (checked: boolean) => void; title: string; copy: string }) {
    return (
        <label className="flex items-start gap-3 rounded-xl border border-line px-3 py-3">
            <input type="checkbox" className="mt-1" checked={checked} onChange={(event) => onChange(event.target.checked)} />
            <span>
                <span className="block text-sm font-medium">{title}</span>
                <span className="mt-1 block text-xs leading-5 text-stone">{copy}</span>
            </span>
        </label>
    );
}
