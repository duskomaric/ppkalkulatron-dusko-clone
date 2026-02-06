import React from "react";

interface DetailsItemProps {
    icon: React.ComponentType<{ className?: string; size?: number }>;
    label: string;
    value: string | null | undefined | boolean;
    color?: string;
}

export function DetailsItem({ icon: Icon, label, value, color }: DetailsItemProps) {
    return (
        <div className="flex items-center gap-2.5 p-2 bg-[var(--color-border)] rounded-xl border border-[var(--color-border)]">
            <div className={`h-7 w-7 ${color || 'bg-primary/10 text-primary'} rounded-lg flex items-center justify-center shrink-0`}>
                <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-black text-[var(--color-text-dim)] uppercase tracking-[0.1em] leading-none mb-1">{label}</p>
                <p className="text-sm font-bold text-[var(--color-text-main)] truncate italic leading-tight">
                    {typeof value === 'boolean' ? (value ? 'Aktivan' : 'Neaktivan') : (value || '-')}
                </p>
            </div>
        </div>
    );
}
