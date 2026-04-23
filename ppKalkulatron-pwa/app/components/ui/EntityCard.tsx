import type { ReactNode } from "react";

interface EntityCardProps {
    children: ReactNode;
    onClick?: () => void;
    className?: string;
}

export function EntityCard({ children, onClick, className = "" }: EntityCardProps) {
    return (
        <div
            onClick={onClick}
            className={`group cursor-pointer bg-[var(--color-glass)] backdrop-blur-xl border border-[var(--color-border)] rounded-xl transition-all duration-500 hover:bg-[var(--color-surface-hover)] hover:border-primary/40 p-3 flex flex-col gap-2 relative overflow-hidden ${className}`.trim()}
            style={{ boxShadow: '0 4px 20px rgba(var(--primary-base), 0.05)' }}
        >
            {children}
        </div>
    );
}
