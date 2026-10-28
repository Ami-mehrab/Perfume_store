import { Head } from '@inertiajs/react';
import type { Seo } from '@/types/store';

export default function SeoHead({
    seo,
    jsonLd,
}: {
    seo: Seo;
    jsonLd?: Record<string, unknown>;
}) {
    return (
        <Head title={seo.title}>
            <meta name="description" content={seo.description} />
            <link rel="canonical" href={seo.canonical} />
            <meta property="og:title" content={seo.title} />
            <meta property="og:description" content={seo.description} />
            <meta property="og:url" content={seo.canonical} />
            <meta property="og:type" content="website" />
            {jsonLd && (
                <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
            )}
        </Head>
    );
}
