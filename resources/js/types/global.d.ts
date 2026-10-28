import type { Auth } from '@/types/auth';
import type { CartPayload, ShopSection, StoreProfile } from '@/types/store';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            store: StoreProfile;
            cartCount: number;
            cart: CartPayload;
            locale: string;
            wishlistIds: number[];
            sections: ShopSection[];
            errors?: Record<string, string>;
            [key: string]: unknown;
        };
    }
}
