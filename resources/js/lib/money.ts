import type { StoreProfile } from '@/types/store';

export function formatMoney(cents: number | null | undefined, store: StoreProfile): string {
    if (cents === null || cents === undefined) {
        return '—';
    }

    const formatted = (cents / 100).toLocaleString(undefined, {
        minimumFractionDigits: store.currency_decimals,
        maximumFractionDigits: store.currency_decimals,
    });

    return `${store.currency_symbol}${formatted}`;
}
