type IconProps = {
    className?: string;
    size?: number;
};

export function Clock1Icon({ className = '', size = 24 }: IconProps) {
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
            <path d="M12 6v6l2-4"/>
            <circle cx="12" cy="12" r="10"/>

        </svg>
    );
}