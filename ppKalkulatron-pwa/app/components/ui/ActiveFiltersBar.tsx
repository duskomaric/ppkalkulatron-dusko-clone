import { XIcon } from "./icons";

interface ActiveFilterItem {
    id: string;
    label: string;
    value: string;
    onClear: () => void;
}

interface ActiveFiltersBarProps {
    filters: ActiveFilterItem[];
    onReset: () => void;
}

export function ActiveFiltersBar({ filters, onReset }: ActiveFiltersBarProps) {
    if (filters.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter) => (
                <button
                    key={filter.id}
                    type="button"
                    onClick={filter.onClear}
                    className="flex items-center gap-2 h-8 px-3 rounded-full border border-primary/20 bg-primary/10 text-[10px] font-black uppercase tracking-[0.18em] text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                >
                    <span className="text-primary/70">{filter.label}:</span>
                    <span className="text-[var(--color-text-main)]">{filter.value}</span>
                    <XIcon className="h-3 w-3 opacity-70" />
                </button>
            ))}
            <button
                type="button"
                onClick={onReset}
                className="h-8 px-3 rounded-full border border-red-500/20 bg-red-500/10 text-[10px] font-black uppercase tracking-[0.18em] text-red-500 hover:bg-red-500/20 transition-colors cursor-pointer"
            >
                Reset
            </button>
        </div>
    );
}
