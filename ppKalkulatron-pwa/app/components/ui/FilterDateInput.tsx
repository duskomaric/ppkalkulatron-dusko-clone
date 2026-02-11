import type { ChangeEvent } from "react";

interface FilterDateInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

// Koristi se na: invoices/quotes/proformas (filter datum)
export function FilterDateInput({ value, onChange, placeholder }: FilterDateInputProps) {
    return (
        <input
            type="date"
            value={value}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
            placeholder={placeholder}
            className="h-9 min-w-[140px] px-3 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-black uppercase tracking-[0.12em] text-[var(--color-text-main)] focus:outline-none focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
        />
    );
}
