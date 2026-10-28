export type StoreProfile = {
    name: string;
    tagline: string;
    announcement: string;
    currency_code: string;
    currency_symbol: string;
    currency_decimals: number;
    delivery_estimate: string;
    default_country: string;
    contact_email: string;
    contact_phone: string;
    address: string;
    about: string;
    meta_description: string;
    facebook_url: string;
    instagram_url: string;
    twitter_url: string;
    youtube_url: string;
    whatsapp_phone: string;
    messenger_url: string;
    warranty_text: string;
    returns_text: string;
    cod_enabled: boolean;
    online_payments_enabled: boolean;
    free_shipping_over_cents: number;
    shipping_flat_cents: number;
    shipping_inside_cents: number;
    shipping_outside_cents: number;
};

export type ShopSection = {
    name: string;
    name_bn: string | null;
    slug: string;
    audience: string | null;
    image: string | null;
};

export type Seo = {
    title: string;
    description: string;
    canonical: string;
};

export type ProductCard = {
    id: number;
    name: string;
    slug: string;
    swatch: string;
    family: string;
    gender: string;
    brand: string | null;
    collection: string | null;
    image: string | null;
    image_alt: string;
    variant_id: number | null;
    name_bn: string | null;
    price_cents: number | null;
    compare_at_cents: number | null;
    discount_percent?: number | null;
    in_stock: boolean;
};

export type Variant = {
    id: number;
    concentration: string;
    concentration_label: string;
    size_ml: number;
    sku: string;
    price_cents: number;
    compare_at_cents: number | null;
    stock: number;
    is_active: boolean;
    in_stock: boolean;
    label: string;
};

export type ProductDetail = ProductCard & {
    description: string;
    story: string | null;
    description_bn: string | null;
    top_notes: string[];
    heart_notes: string[];
    base_notes: string[];
    images: { id: number; url: string; alt: string }[];
    variants: Variant[];
};

export type CartLine = {
    id: number;
    quantity: number;
    variant_id: number | null;
    sku: string | null;
    label: string | null;
    unit_price_cents: number | null;
    line_total_cents: number;
    stock: number;
    available: boolean;
    product_name: string | null;
    product_name_bn: string | null;
    size_ml: number | null;
    product_slug: string | null;
    brand: string | null;
    swatch: string;
    image: string | null;
    image_alt: string | null;
};

export type Quote = {
    subtotal_cents: number;
    discount_cents: number;
    shipping_cents: number;
    total_cents: number;
    coupon_code: string | null;
    coupon_error: string | null;
    shipping_zone: 'inside' | 'outside';
};

export type CartPayload = {
    items: CartLine[];
    quote: Quote;
};

export type Address = {
    id: number;
    label: string;
    recipient_name: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    region: string | null;
    postal_code: string | null;
    country: string;
    is_default: boolean;
};

export type OrderItem = {
    product_name: string;
    brand_name: string | null;
    sku: string;
    concentration_label: string;
    size_ml: number;
    unit_price_cents: number;
    quantity: number;
    line_total_cents: number;
    image: string | null;
};

export type PublicOrder = {
    number: string;
    tracking_token: string;
    email: string;
    customer_name: string;
    phone: string;
    status: string;
    status_label: string;
    payment_status: string;
    payment_status_label: string;
    payment_method: string;
    payment_method_label: string;
    currency_code: string;
    subtotal_cents: number;
    discount_cents: number;
    shipping_cents: number;
    total_cents: number;
    coupon_code: string | null;
    shipping_address: Record<string, string | null>;
    notes: string | null;
    placed_at: string;
    items: OrderItem[];
    can_request_return: boolean;
};

export type Paginator<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
    from: number | null;
    to: number | null;
};
