import { Link, usePage } from '@inertiajs/react';
import { translate } from '@/lib/i18n';

export default function PageBanner({ title, crumb }: { title: string; crumb: string }) {
    const { locale } = usePage().props;

    return (
        <div className="relative overflow-hidden bg-[#9d174d] text-white">
            <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-30" viewBox="0 0 1440 180" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 80 C 180 20 360 140 540 80 C 720 20 900 140 1080 80 C 1260 20 1380 100 1440 70 L1440 180 L0 180 Z" fill="none" stroke="white" strokeWidth="8" />
                <path d="M0 120 C 200 60 400 160 640 110 C 860 60 1100 150 1440 100" fill="none" stroke="white" strokeWidth="6" />
            </svg>
            <div className="relative mx-auto max-w-6xl px-4 py-10 text-center">
                <h1 className="text-4xl font-semibold">{title}</h1>
                <p className="mt-2 text-sm text-white/85">
                    <Link href="/" className="hover:underline">{translate(locale, 'home')}</Link>
                    <span className="px-2">·</span>
                    {crumb}
                </p>
            </div>
        </div>
    );
}
