export function PageHeader({
    title,
    description,
    action,
}: {
    title: string;
    description?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
                <h1 className="font-display text-4xl text-charcoal">{title}</h1>
                {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-stone">{description}</p>}
            </div>
            {action}
        </div>
    );
}

export function Card({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <h2 className="font-display text-2xl text-charcoal">{title}</h2>
            {description && <p className="mt-1 text-sm leading-6 text-stone">{description}</p>}
            <div className="mt-4 space-y-4">{children}</div>
        </section>
    );
}

export const inputClass = 'mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-charcoal outline-none focus:border-charcoal';

export function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
    return (
        <span className="block text-sm text-charcoal">
            <span className="font-medium">{children}</span>
            {hint && <span className="mt-0.5 block text-xs leading-5 font-normal text-stone">{hint}</span>}
        </span>
    );
}
