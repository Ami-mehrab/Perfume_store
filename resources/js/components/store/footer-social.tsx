type SocialLink = {
    label: string;
    href: string;
    icon: 'facebook' | 'x' | 'instagram' | 'youtube';
};

export default function FooterSocial({
    facebook,
    twitter,
    instagram,
    youtube,
}: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
}) {
    const links: SocialLink[] = [
        facebook ? { label: 'Facebook', href: facebook, icon: 'facebook' } : null,
        twitter ? { label: 'X', href: twitter, icon: 'x' } : null,
        instagram ? { label: 'Instagram', href: instagram, icon: 'instagram' } : null,
        youtube ? { label: 'YouTube', href: youtube, icon: 'youtube' } : null,
    ].filter((link): link is SocialLink => link !== null);

    if (links.length === 0) {
        return null;
    }

    return (
        <ul className="mt-5 flex flex-wrap gap-2.5">
            {links.map((link) => (
                <li key={link.label}>
                    <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label={link.label}
                        className="grid size-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                    >
                        <SocialIcon name={link.icon} />
                    </a>
                </li>
            ))}
        </ul>
    );
}

function SocialIcon({ name }: { name: SocialLink['icon'] }) {
    const common = {
        viewBox: '0 0 24 24',
        className: 'size-4 fill-current',
        'aria-hidden': true as const,
    };

    switch (name) {
        case 'facebook':
            return (
                <svg {...common}>
                    <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H8v3h3v7h3v-7h3l1-3h-4V9c0-.6.4-1 1-1z" />
                </svg>
            );
        case 'x':
            return (
                <svg {...common}>
                    <path d="M18.2 3H21l-6.6 7.5L22 21h-6.2l-4.3-5.6L6 21H3.2l7-8L2 3h6.3l3.9 5.2L18.2 3zm-1.1 16.2h1.7L7 4.7H5.2l11.9 14.5z" />
                </svg>
            );
        case 'instagram':
            return (
                <svg {...common}>
                    <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7zm5 2.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5zm5.2-3.1a1 1 0 1 1-1 1 1 1 0 0 1 1-1z" />
                </svg>
            );
        case 'youtube':
            return (
                <svg {...common}>
                    <path d="M23 12.2s0-3.4-.4-5a2.9 2.9 0 0 0-2-2C18.7 4.7 12 4.7 12 4.7s-6.7 0-8.6.5a2.9 2.9 0 0 0-2 2c-.4 1.6-.4 5-.4 5s0 3.4.4 5a2.9 2.9 0 0 0 2 2c1.9.5 8.6.5 8.6.5s6.7 0 8.6-.5a2.9 2.9 0 0 0 2-2c.4-1.6.4-5 .4-5zM9.8 15.5v-7l6.3 3.5-6.3 3.5z" />
                </svg>
            );
    }
}
