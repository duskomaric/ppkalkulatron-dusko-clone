import React, { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, SearchIcon, XIcon } from "~/components/ui/icons";

interface SearchSelectProps<T> {
    items: T[];
    value: T | null;
    onChange: (item: T | null) => void;
    getKey: (item: T) => string | number;
    getLabel: (item: T) => string;
    getSearchText?: (item: T) => string;
    renderItem?: (item: T, isSelected: boolean) => React.ReactNode;
    label?: string;
    placeholder?: string;
    required?: boolean;
    error?: string;
    disabled?: boolean;
}

export function SearchSelect<T>({
    items,
    value,
    onChange,
    getKey,
    getLabel,
    getSearchText,
    renderItem,
    label,
    placeholder = "Odaberi...",
    required,
    error,
    disabled
}: SearchSelectProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter items by search
    const filteredItems = items.filter((item) => {
        const searchText = getSearchText ? getSearchText(item) : getLabel(item);
        return searchText.toLowerCase().includes(search.toLowerCase());
    });

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (item: T) => {
        onChange(item);
        setIsOpen(false);
        setSearch("");
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
        setSearch("");
    };

    return (
        <div className="space-y-1.5 w-full" ref={containerRef}>
            {label && (
                <label className="text-[11px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)] ml-1 block">
                    {label}
                    {required && <span className="text-primary ml-0.5">*</span>}
                </label>
            )}

            <div className="relative">
                <div
                    onClick={() => {
                        if (!disabled) {
                            setIsOpen(!isOpen);
                            if (!isOpen) {
                                setTimeout(() => inputRef.current?.focus(), 50);
                            }
                        }
                    }}
                    className={`
                        w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl
                        text-left px-5 py-3.5 flex items-center justify-between gap-2
                        transition-all duration-300 cursor-pointer
                        ${isOpen ? "border-primary/50 ring-4 ring-primary/10 bg-[var(--color-surface-hover)]" : ""}
                        ${error ? "border-red-500/50 ring-red-500/10" : ""}
                        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-[var(--color-border-strong)]"}
                    `}
                >
                    <span className={`text-sm font-bold truncate ${value ? "text-[var(--color-text-main)]" : "text-[var(--color-text-dim)]"}`}>
                        {value ? getLabel(value) : placeholder}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                        {value && !disabled && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="h-5 w-5 rounded-full bg-[var(--color-border)] hover:bg-red-500/20 hover:text-red-500 flex items-center justify-center transition-all cursor-pointer"
                            >
                                <XIcon className="h-3 w-3" />
                            </button>
                        )}
                        <ChevronDownIcon className={`h-4 w-4 text-[var(--color-text-dim)] transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </div>
                </div>

                {/* Dropdown */}
                {isOpen && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                        {/* Search Input */}
                        <div className="p-2 border-b border-[var(--color-border)]">
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-dim)]" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Pretraži..."
                                    className="w-full bg-[var(--color-border)] border-none rounded-xl text-sm font-bold text-[var(--color-text-main)] placeholder:text-[var(--color-text-dim)] pl-9 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        {/* Items List */}
                        <div className="max-h-[240px] overflow-y-auto">
                            {filteredItems.length === 0 ? (
                                <div className="p-4 text-center text-[var(--color-text-dim)] text-sm font-bold">
                                    Nema rezultata
                                </div>
                            ) : (
                                filteredItems.map((item) => {
                                    const isSelected = value ? getKey(value) === getKey(item) : false;
                                    return (
                                        <button
                                            key={getKey(item)}
                                            type="button"
                                            onClick={() => handleSelect(item)}
                                            className={`
                                                w-full text-left px-4 py-3 transition-all cursor-pointer
                                                ${isSelected
                                                    ? "bg-primary/10 text-primary"
                                                    : "text-[var(--color-text-main)] hover:bg-[var(--color-surface-hover)]"
                                                }
                                            `}
                                        >
                                            {renderItem ? renderItem(item, isSelected) : (
                                                <span className="text-sm font-bold">{getLabel(item)}</span>
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <p className="text-[10px] font-bold text-red-500 ml-1 uppercase tracking-tight">
                    {error}
                </p>
            )}
        </div>
    );
}
