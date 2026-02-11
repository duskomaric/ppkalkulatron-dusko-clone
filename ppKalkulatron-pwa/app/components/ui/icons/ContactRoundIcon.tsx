type IconProps = {
    className?: string;
    size?: number;
};

export function ContactRoundIcon({ className = '', size = 24 }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M16 2v2"/><path d="M17.915 22a6 6 0 0 0-12 0"/>
            <path d="M8 2v2"/>
            <circle cx="12" cy="12" r="4"/>
            <rect x="3" y="4" width="18" height="18" rx="2"/>
        </svg>
    );
}