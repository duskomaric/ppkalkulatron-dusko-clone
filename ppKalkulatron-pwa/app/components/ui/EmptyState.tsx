import type { ComponentType } from "react";

interface EmptyStateProps {
    icon: ComponentType<{ className?: string; size?: number }>;
    message: string;
}

// Koristi se na: clients/articles/invoices (prazna lista)
export function EmptyState({ icon: Icon, message }: EmptyStateProps) {
    return (
        <div className="py-20 text-center bg-[var(--color-surface)]/60 border border-dashed border-[var(--color-border)] rounded-2xl">
            <Icon className="h-10 w-10 text-[var(--color-text-dim)] mx-auto mb-4" />
            <p className="text-[var(--color-text-muted)] font-black uppercase tracking-[0.2em] text-sm">{message}</p>
        </div>
    );
}
