import { Link, usePage } from '@inertiajs/react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
    compact = false,
}: AuthLayoutProps) {
    const { store } = usePage().props;

    if (compact) {
        return (
            <div className="grid min-h-svh place-items-center bg-white p-4 text-black">
                <div className="w-full max-w-[320px] rounded-2xl border border-[#e7e0d6] bg-white px-5 py-6">
                    <p className="text-center font-display text-3xl tracking-wide">{store.name}</p>
                    {title && <h1 className="mt-1 text-center text-sm text-[#78716c]">{title}</h1>}
                    <div className="mt-5">{children}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-white p-6 text-black md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href={home()}
                            className="font-display text-4xl tracking-wide"
                        >
                            {store.name}
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="font-display text-4xl">{title}</h1>
                            <p className="text-center text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
