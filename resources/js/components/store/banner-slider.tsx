import { Link, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

export type HomeBanner = {
    id: number;
    eyebrow: string | null;
    title: string;
    subtitle: string | null;
    image: string | null;
    link_url: string | null;
};

export default function BannerSlider({ banners }: { banners: HomeBanner[] }) {
    const { store } = usePage().props;
    const slides = banners.length > 0 ? banners : [null];
    const [index, setIndex] = useState(0);
    const multi = slides.length > 1;

    useEffect(() => {
        if (!multi) {
            return;
        }

        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduced) {
            return;
        }

        const timer = window.setInterval(() => {
            setIndex((current) => (current + 1) % slides.length);
        }, 5500);

        return () => window.clearInterval(timer);
    }, [multi, slides.length]);

    useEffect(() => {
        setIndex(0);
    }, [banners]);

    const current = slides[index] ?? null;
    const href = current?.link_url || '/shop';

    function go(next: number) {
        setIndex((next + slides.length) % slides.length);
    }

    return (
        <section className="group/banner relative bg-white">
            <Link href={href} className="block overflow-hidden">
                {current?.image ? (
                    <img
                        key={current.id}
                        src={current.image}
                        alt={current.title}
                        className="banner-slide h-44 w-full object-cover md:h-72"
                    />
                ) : (
                    <div
                        key={current?.id ?? 'fallback'}
                        className="banner-slide bg-gradient-to-r from-[#7ec8e3] to-[#d7efe4] px-6 py-12 md:px-16 md:py-20"
                    >
                        <p className="text-sm text-bronze">{current?.eyebrow || store.tagline}</p>
                        <h1 className="mt-2 text-3xl font-semibold text-[#9d174d] md:text-5xl">
                            {current?.title || store.name}
                        </h1>
                        <p className="mt-3 text-lg">{current?.subtitle || store.announcement}</p>
                    </div>
                )}
            </Link>

            {multi && (
                <>
                    <button
                        type="button"
                        aria-label="Previous banner"
                        className="absolute top-1/2 left-2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-white opacity-100 backdrop-blur-sm transition-opacity hover:bg-black/50 md:left-4 md:size-10 md:opacity-0 md:group-hover/banner:opacity-100 md:focus-visible:opacity-100"
                        onClick={() => go(index - 1)}
                    >
                        <ChevronLeft className="size-5" />
                    </button>
                    <button
                        type="button"
                        aria-label="Next banner"
                        className="absolute top-1/2 right-2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-white opacity-100 backdrop-blur-sm transition-opacity hover:bg-black/50 md:right-4 md:size-10 md:opacity-0 md:group-hover/banner:opacity-100 md:focus-visible:opacity-100"
                        onClick={() => go(index + 1)}
                    >
                        <ChevronRight className="size-5" />
                    </button>
                    <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-2">
                        {slides.map((slide, slideIndex) => (
                            <button
                                key={slide?.id ?? slideIndex}
                                type="button"
                                aria-label={`Banner ${slideIndex + 1}`}
                                aria-current={slideIndex === index}
                                className={`h-2 rounded-full transition-all ${slideIndex === index ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`}
                                onClick={() => setIndex(slideIndex)}
                            />
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}
