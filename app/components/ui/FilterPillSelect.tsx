import type { ChangeEvent } from "react";
import { ChevronDownIcon } from "./icons";

export interface FilterOption {
    value: string;
    label: string;
}

interface FilterPillSelectProps {
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
    className?: string;
}

// Koristi se na: articles/clients/invoices/quotes/proformas (filter dropdown pill)
export function FilterPillSelect({ value, options, onChange, className = "" }: FilterPillSelectProps) {
    return (
        <div className={`relative ${className}`}>
            <select
                value={value}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
                className="h-9 pl-4 pr-9 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-main)] appearance-none cursor-pointer focus:outline-none focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
            >
                {options.map((opt) => (
                    <option key={opt.value || opt.label} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)] pointer-events-none">
                <ChevronDownIcon className="h-3.5 w-3.5" />
            </div>
        </div>
    );
}
