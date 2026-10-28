type BottleProps = {
    tone?: string;
    className?: string;
};

export default function Bottle({ tone = '#8d6e4c', className }: BottleProps) {
    return (
        <svg
            viewBox="0 0 220 460"
            className={className}
            aria-hidden="true"
            role="presentation"
        >
            <ellipse cx="110" cy="430" rx="62" ry="12" fill="#1c1917" opacity="0.08" />
            <rect x="86" y="28" width="48" height="46" rx="3" fill="#c6a36a" />
            <rect x="92" y="18" width="36" height="16" rx="2" fill="#1c1917" />
            <rect x="98" y="74" width="24" height="36" fill="#efe6da" stroke="#d9cbb8" />
            <path
                d="M78 118c8 28 8 40 8 54v196c0 28 10 46 24 46s24-18 24-46V172c0-14 0-26 8-54"
                fill="#f7f3ee"
                stroke="#e4d9cc"
            />
            <path
                d="M90 176c2 18 2 40 2 70v118c0 22 8 36 18 36s18-14 18-36V246c0-30 0-52 2-70v120c0 18-6 30-20 30s-20-12-20-30Z"
                fill={tone}
                opacity="0.92"
            />
            <path d="M96 150c6 8 22 8 28 0" fill="none" stroke="#ffffff" strokeOpacity="0.7" />
            <rect x="122" y="190" width="8" height="150" fill="#ffffff" opacity="0.28" />
        </svg>
    );
}
