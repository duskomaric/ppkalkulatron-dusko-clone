import React from "react";

interface EmptyStateProps {
    icon: React.ComponentType<{ className?: string; size?: number }>;
    message: string;
}

export function EmptyState({ icon: Icon, message }: EmptyStateProps) {
    return (
        <div className="py-20 text-center bg-[var(--color-surface)]/60 border border-dashed border-[var(--color-border)] rounded-2xl">
            <Icon className="h-8 w-8 text-[var(--color-text-dim)] mx-auto mb-4" />
            <p className="text-[var(--color-text-muted)] font-bold uppercase tracking-widest text-xs">{message}</p>
        </div>
    );
}
