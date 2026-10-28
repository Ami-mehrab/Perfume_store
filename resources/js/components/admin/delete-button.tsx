import { router } from '@inertiajs/react';

export default function DeleteButton({
    href,
    name,
    label = 'Delete',
}: {
    href: string;
    name: string;
    label?: string;
}) {
    return (
        <button
            type="button"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
            onClick={() => {
                if (confirm(`Delete ${name}? This cannot be undone.`)) {
                    router.delete(href);
                }
            }}
        >
            {label}
        </button>
    );
}
