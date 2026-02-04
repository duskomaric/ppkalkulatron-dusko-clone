interface EntityCardProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

export function EntityCard({ children, onClick, className = "" }: EntityCardProps) {
    return (
        <div
            onClick={onClick}
            className={`group cursor-pointer bg-[#16161E]/80 backdrop-blur-xl border border-white/5 rounded-xl transition-all duration-500 hover:bg-[#1C1C26] hover:border-primary/40 p-3 flex flex-col gap-2 relative overflow-hidden ${className}`.trim()}
            style={{ boxShadow: '0 4px 20px rgba(var(--primary-base), 0.05)' }}
        >
            {children}
        </div>
    );
}
