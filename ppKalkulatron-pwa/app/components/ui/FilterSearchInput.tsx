import type { ChangeEvent } from "react";
import { SearchIcon } from "./icons";

interface FilterSearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function FilterSearchInput({ value, onChange, placeholder = "Pretraži..." }: FilterSearchInputProps) {
    return (
        <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]">
                <SearchIcon className="h-4 w-4" />
            </div>
            <input
                value={value}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full h-9 pl-10 pr-3 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-bold text-[var(--color-text-main)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
            />
        </div>
    );
}
