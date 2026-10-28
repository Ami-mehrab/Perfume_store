import { Link, usePage } from '@inertiajs/react';
import { formatMoney } from '@/lib/money';

export type PromoBanner = {
    id: number;
    eyebrow: string | null;
    title: string;
    subtitle: string | null;
    image: string | null;
    link_url: string | null;
    placement?: string | null;
    price_cents?: number | null;
    cta?: string | null;
};

export default function PromoBannerStrip({ banners }: { banners: PromoBanner[] }) {
    const { store, locale } = usePage().props;
    const slides = banners.filter((banner) => Boolean(banner.image));

    if (slides.length === 0) {
        return null;
    }

    // Duplicate so the marquee always feels full and loops seamlessly.
    const loop = slides.length < 4 ? [...slides, ...slides, ...slides, ...slides] : [...slides, ...slides];
    const shopLabel = locale === 'bn' ? 'কেনাকাটা করুন' : 'Shop now';
    const fromLabel = locale === 'bn' ? 'থেকে' : 'From';

    return (
        <section className="mx-auto max-w-6xl px-3 py-4 sm:px-4 md:py-5">
            <div className="group/promo overflow-hidden">
                <div className="promo-marquee-track flex w-max gap-2.5 group-hover/promo:[animation-play-state:paused] sm:gap-3">
                    {loop.map((banner, index) => {
                        const href = banner.link_url || '/shop';
                        const cta = banner.cta || shopLabel;

                        return (
                            <Link
                                key={`${banner.id}-${index}`}
                                href={href}
                                className="flex w-[min(86vw,400px)] shrink-0 gap-2.5 sm:w-[440px] sm:gap-3"
                            >
                                <article className="flex min-h-[168px] flex-1 flex-col justify-between rounded-2xl bg-charcoal p-3.5 text-white sm:min-h-[200px] sm:p-4">
                                    <div className="space-y-1.5">
                                        {banner.eyebrow && (
                                            <p className="text-[10px] font-semibold tracking-[0.14em] text-bronze uppercase sm:text-[11px]">
                                                {banner.eyebrow}
                                            </p>
                                        )}
                                        <h3 className="line-clamp-3 text-sm leading-snug font-semibold sm:text-base">
                                            {banner.title}
                                        </h3>
                                        {banner.subtitle && (
                                            <p className="line-clamp-2 text-xs leading-relaxed text-white/70 sm:text-sm">
                                                {banner.subtitle}
                                            </p>
                                        )}
                                    </div>
                                    <div className="mt-3 flex items-end justify-between gap-2">
                                        <span className="text-xs font-medium text-bronze sm:text-sm">{cta}</span>
                                        {banner.price_cents != null && banner.price_cents > 0 && (
                                            <span className="text-xs font-semibold tabular-nums text-white/90 sm:text-sm">
                                                {fromLabel} {formatMoney(banner.price_cents, store)}
                                            </span>
                                        )}
                                    </div>
                                </article>

                                <article className="relative min-h-[168px] w-[42%] shrink-0 overflow-hidden rounded-2xl border border-line bg-[#f3f4f6] sm:min-h-[200px]">
                                    <img
                                        src={banner.image!}
                                        alt={banner.title}
                                        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover/promo:scale-[1.03]"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </article>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
