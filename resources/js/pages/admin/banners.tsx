import { router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import DeleteButton from '@/components/admin/delete-button';

type BannerRow = {
    id: number;
    kind: string;
    title: string;
    subtitle?: string | null;
    eyebrow?: string | null;
    is_active: boolean;
    image: string | null;
    placement?: string | null;
    product_id?: number | null;
    collection_id?: number | null;
    brand_id?: number | null;
    product_name?: string | null;
    collection_name?: string | null;
    brand_name?: string | null;
    link_url?: string | null;
};

type Option = { id: number; name: string };
type LinkType = 'brand' | 'product' | 'collection';

function linkTypeOf(banner: BannerRow): LinkType {
    if (banner.brand_id) {
        return 'brand';
    }

    if (banner.collection_id) {
        return 'collection';
    }

    return 'product';
}

function linkLabel(banner: BannerRow): string {
    if (banner.brand_name) {
        return `Brand: ${banner.brand_name}`;
    }

    if (banner.product_name) {
        return `Product: ${banner.product_name}`;
    }

    if (banner.collection_name) {
        return `Collection: ${banner.collection_name}`;
    }

    return 'No link target';
}

function PromoCardPreview({
    title,
    subtitle,
    eyebrow,
    image,
    cta = 'Shop now',
}: {
    title: string;
    subtitle?: string | null;
    eyebrow?: string | null;
    image?: string | null;
    cta?: string;
}) {
    return (
        <div className="flex max-w-md gap-2.5">
            <div className="flex min-h-[148px] flex-1 flex-col justify-between rounded-2xl bg-charcoal p-3.5 text-white">
                <div className="space-y-1.5">
                    {eyebrow ? (
                        <p className="text-[10px] font-semibold tracking-[0.14em] text-bronze uppercase">{eyebrow}</p>
                    ) : null}
                    <h3 className="line-clamp-3 text-sm leading-snug font-semibold">{title || 'Promo title'}</h3>
                    {subtitle ? <p className="line-clamp-2 text-xs leading-relaxed text-white/70">{subtitle}</p> : null}
                </div>
                <p className="mt-3 text-xs font-medium text-bronze">{cta}</p>
            </div>
            <div className="relative min-h-[148px] w-[42%] shrink-0 overflow-hidden rounded-2xl border border-line bg-[#f3f4f6]">
                {image ? (
                    <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                    <div className="grid h-full place-items-center px-2 text-center text-[11px] text-stone">Photo</div>
                )}
            </div>
        </div>
    );
}

export default function Banners({
    banners,
    promoBanners = [],
    products = [],
    collections = [],
    brands = [],
}: {
    banners: BannerRow[];
    promoBanners?: BannerRow[];
    products?: Option[];
    collections?: Option[];
    brands?: Option[];
}) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const homeForm = useForm<{
        kind: 'homepage';
        is_active: boolean;
        sort_order: number;
        image: File | null;
    }>({
        kind: 'homepage',
        is_active: true,
        sort_order: banners.length,
        image: null,
    });

    const promoForm = useForm<{
        kind: 'promo';
        title: string;
        subtitle: string;
        eyebrow: string;
        is_active: boolean;
        sort_order: number;
        placement: 'trending';
        link_type: LinkType;
        brand_id: string;
        product_id: string;
        collection_id: string;
        image: File | null;
    }>({
        kind: 'promo',
        title: '',
        subtitle: '',
        eyebrow: '',
        is_active: true,
        sort_order: promoBanners.length,
        placement: 'trending',
        link_type: 'brand',
        brand_id: brands[0] ? String(brands[0].id) : '',
        product_id: products[0] ? String(products[0].id) : '',
        collection_id: collections[0] ? String(collections[0].id) : '',
        image: null,
    });

    const previewCta = useMemo(() => {
        if (promoForm.data.link_type === 'brand') {
            const brand = brands.find((item) => String(item.id) === promoForm.data.brand_id);

            return brand ? `Shop ${brand.name}` : 'Shop brand';
        }

        if (promoForm.data.link_type === 'collection') {
            return 'Shop collection';
        }

        return 'Shop now';
    }, [brands, promoForm.data.brand_id, promoForm.data.link_type]);

    function onPromoImage(file: File | null) {
        promoForm.setData('image', file);

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        setPreviewUrl(file ? URL.createObjectURL(file) : null);
    }

    function toggleActive(banner: BannerRow) {
        const linkType = linkTypeOf(banner);

        router.put(
            `/admin/banners/${banner.id}`,
            {
                kind: banner.kind,
                title: banner.title,
                subtitle: banner.subtitle ?? '',
                eyebrow: banner.eyebrow ?? '',
                is_active: !banner.is_active,
                placement: 'trending',
                link_type: linkType,
                brand_id: banner.brand_id ?? '',
                product_id: banner.product_id ?? '',
                collection_id: banner.collection_id ?? '',
            },
            { preserveScroll: true },
        );
    }

    return (
        <div className="space-y-10">
            <div className="min-w-0 max-w-3xl">
                <h1 className="text-3xl font-semibold">Banner</h1>
                <p className="mt-2 text-sm leading-6 text-stone">
                    Homepage hero under the menu, plus product-style promo cards above Trending on the shop.
                </p>
            </div>

            <section className="space-y-4">
                <div>
                    <h2 className="text-xl font-semibold">Homepage banners</h2>
                    <p className="mt-1 text-sm leading-6 text-stone">
                        Wide picture under the menu. Upload a landscape photo at about 1920 × 400 px (JPG, PNG, or WebP, max 4 MB).
                        Keep the main subject in the centre — the edges may be cropped. One visible banner shows alone; two or more become a sliding carousel.
                    </p>
                </div>

                <form
                    className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 sm:flex-row sm:items-end sm:gap-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        homeForm.post('/admin/banners', { forceFormData: true });
                    }}
                >
                    <label className="block min-w-0 flex-1 text-sm">
                        <span className="font-medium text-charcoal">New banner photo</span>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            required
                            className="mt-1.5 block w-full text-xs"
                            onChange={(event) => homeForm.setData('image', event.target.files?.[0] ?? null)}
                        />
                        {homeForm.errors.image && <p className="mt-1 text-sm text-red-700">{homeForm.errors.image}</p>}
                    </label>
                    <button
                        className="btn-dark shrink-0 sm:min-w-36"
                        disabled={homeForm.processing || !homeForm.data.image}
                    >
                        Save banner
                    </button>
                </form>

                {banners.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-line bg-white px-4 py-10 text-center text-sm text-stone">
                        No homepage banners yet. Upload a 1920 × 400 photo above.
                    </p>
                ) : (
                    <ul className="grid gap-4 sm:grid-cols-2">
                        {banners.map((banner) => (
                            <li key={banner.id} className="overflow-hidden rounded-2xl border border-line bg-white">
                                {banner.image ? (
                                    <img src={banner.image} alt="" className="aspect-[24/5] w-full object-cover" />
                                ) : (
                                    <div className="grid aspect-[24/5] place-items-center bg-[#f3f4f6] text-xs text-stone">
                                        No image
                                    </div>
                                )}
                                <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                                    <span className="text-xs text-stone">
                                        {banner.is_active ? 'Visible under the menu' : 'Hidden'}
                                    </span>
                                    <DeleteButton href={`/admin/banners/${banner.id}`} name={banner.title || 'banner'} />
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section className="space-y-4 border-t border-line pt-8">
                <div>
                    <h2 className="text-xl font-semibold">Promotional banners</h2>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-stone">
                        Cards in the infinite slider above Trending. Add a title, short description, photo, and link to a
                        brand (Dior, Versace, etc.), a product, or a collection.
                    </p>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
                    <form
                        className="grid gap-3 rounded-2xl border border-line bg-white p-4 md:grid-cols-2"
                        onSubmit={(event) => {
                            event.preventDefault();
                            promoForm.post('/admin/banners', {
                                forceFormData: true,
                                onSuccess: () => {
                                    promoForm.reset('title', 'subtitle', 'eyebrow', 'image');
                                    if (previewUrl) {
                                        URL.revokeObjectURL(previewUrl);
                                    }
                                    setPreviewUrl(null);
                                },
                            });
                        }}
                    >
                        <label className="block text-sm md:col-span-2">
                            <span className="font-medium text-charcoal">Title</span>
                            <input
                                type="text"
                                className="mt-1.5 w-full rounded-xl border border-line px-3 py-2"
                                placeholder="e.g. Discover Dior"
                                value={promoForm.data.title}
                                onChange={(event) => promoForm.setData('title', event.target.value)}
                                required
                            />
                            {promoForm.errors.title && <p className="mt-1 text-sm text-red-700">{promoForm.errors.title}</p>}
                        </label>

                        <label className="block text-sm md:col-span-2">
                            <span className="font-medium text-charcoal">Short description</span>
                            <textarea
                                className="mt-1.5 min-h-20 w-full rounded-xl border border-line px-3 py-2"
                                placeholder="One or two short lines under the title"
                                maxLength={180}
                                value={promoForm.data.subtitle}
                                onChange={(event) => promoForm.setData('subtitle', event.target.value)}
                            />
                            {promoForm.errors.subtitle && (
                                <p className="mt-1 text-sm text-red-700">{promoForm.errors.subtitle}</p>
                            )}
                        </label>

                        <label className="block text-sm">
                            <span className="font-medium text-charcoal">Label (optional)</span>
                            <input
                                type="text"
                                className="mt-1.5 w-full rounded-xl border border-line px-3 py-2"
                                placeholder="e.g. Brand / New"
                                value={promoForm.data.eyebrow}
                                onChange={(event) => promoForm.setData('eyebrow', event.target.value)}
                            />
                        </label>

                        <label className="block text-sm">
                            <span className="font-medium text-charcoal">Link type</span>
                            <select
                                className="mt-1.5 w-full rounded-xl border border-line px-3 py-2"
                                value={promoForm.data.link_type}
                                onChange={(event) => promoForm.setData('link_type', event.target.value as LinkType)}
                            >
                                <option value="brand">Brand</option>
                                <option value="product">Product</option>
                                <option value="collection">Collection</option>
                            </select>
                        </label>

                        {promoForm.data.link_type === 'brand' && (
                            <label className="block text-sm md:col-span-2">
                                <span className="font-medium text-charcoal">Brand</span>
                                <select
                                    className="mt-1.5 w-full rounded-xl border border-line px-3 py-2"
                                    value={promoForm.data.brand_id}
                                    onChange={(event) => promoForm.setData('brand_id', event.target.value)}
                                    required
                                >
                                    <option value="">Select a brand</option>
                                    {brands.map((brand) => (
                                        <option key={brand.id} value={brand.id}>
                                            {brand.name}
                                        </option>
                                    ))}
                                </select>
                                {promoForm.errors.brand_id && (
                                    <p className="mt-1 text-sm text-red-700">{promoForm.errors.brand_id}</p>
                                )}
                            </label>
                        )}

                        {promoForm.data.link_type === 'product' && (
                            <label className="block text-sm md:col-span-2">
                                <span className="font-medium text-charcoal">Product</span>
                                <select
                                    className="mt-1.5 w-full rounded-xl border border-line px-3 py-2"
                                    value={promoForm.data.product_id}
                                    onChange={(event) => promoForm.setData('product_id', event.target.value)}
                                    required
                                >
                                    <option value="">Select a product</option>
                                    {products.map((product) => (
                                        <option key={product.id} value={product.id}>
                                            {product.name}
                                        </option>
                                    ))}
                                </select>
                                {promoForm.errors.product_id && (
                                    <p className="mt-1 text-sm text-red-700">{promoForm.errors.product_id}</p>
                                )}
                            </label>
                        )}

                        {promoForm.data.link_type === 'collection' && (
                            <label className="block text-sm md:col-span-2">
                                <span className="font-medium text-charcoal">Collection</span>
                                <select
                                    className="mt-1.5 w-full rounded-xl border border-line px-3 py-2"
                                    value={promoForm.data.collection_id}
                                    onChange={(event) => promoForm.setData('collection_id', event.target.value)}
                                    required
                                >
                                    <option value="">Select a collection</option>
                                    {collections.map((collection) => (
                                        <option key={collection.id} value={collection.id}>
                                            {collection.name}
                                        </option>
                                    ))}
                                </select>
                                {promoForm.errors.collection_id && (
                                    <p className="mt-1 text-sm text-red-700">{promoForm.errors.collection_id}</p>
                                )}
                            </label>
                        )}

                        <label className="block text-sm md:col-span-2">
                            <span className="font-medium text-charcoal">Promo photo</span>
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                required
                                className="mt-1.5 block w-full text-xs"
                                onChange={(event) => onPromoImage(event.target.files?.[0] ?? null)}
                            />
                            <p className="mt-1 text-xs text-stone">About 800 × 1000 or square. JPG, PNG, or WebP, max 4 MB.</p>
                            {promoForm.errors.image && <p className="mt-1 text-sm text-red-700">{promoForm.errors.image}</p>}
                        </label>

                        <label className="flex items-center gap-2 text-sm md:col-span-2">
                            <input
                                type="checkbox"
                                checked={promoForm.data.is_active}
                                onChange={(event) => promoForm.setData('is_active', event.target.checked)}
                            />
                            Active on homepage
                        </label>

                        <div className="md:col-span-2">
                            <button
                                className="btn-dark"
                                disabled={promoForm.processing || !promoForm.data.image || !promoForm.data.title.trim()}
                            >
                                Save promotional banner
                            </button>
                        </div>
                    </form>

                    <aside className="rounded-2xl border border-dashed border-line bg-white p-4">
                        <p className="text-xs font-semibold tracking-wide text-stone uppercase">Live preview</p>
                        <p className="mt-1 text-xs text-stone">How this card will look in the slider (inside page margins).</p>
                        <div className="mt-4">
                            <PromoCardPreview
                                title={promoForm.data.title}
                                subtitle={promoForm.data.subtitle}
                                eyebrow={promoForm.data.eyebrow}
                                image={previewUrl}
                                cta={previewCta}
                            />
                        </div>
                    </aside>
                </div>

                {promoBanners.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-line bg-white px-4 py-10 text-center text-sm text-stone">
                        No promotional banners yet.
                    </p>
                ) : (
                    <ul className="grid gap-4 lg:grid-cols-2">
                        {promoBanners.map((banner) => (
                            <li key={banner.id} className="space-y-3 rounded-2xl border border-line bg-white p-3">
                                <PromoCardPreview
                                    title={banner.title}
                                    subtitle={banner.subtitle}
                                    eyebrow={banner.eyebrow || banner.brand_name || undefined}
                                    image={banner.image}
                                    cta={
                                        banner.brand_name
                                            ? `Shop ${banner.brand_name}`
                                            : banner.collection_name
                                              ? 'Shop collection'
                                              : 'Shop now'
                                    }
                                />
                                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                                    <p className="text-xs text-stone">
                                        Above Trending · {linkLabel(banner)} · {banner.is_active ? 'Active' : 'Inactive'}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-[#f8f7f5]"
                                            onClick={() => toggleActive(banner)}
                                        >
                                            {banner.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <DeleteButton href={`/admin/banners/${banner.id}`} name={banner.title || 'promo'} />
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
