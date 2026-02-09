import React, { useState, useEffect } from "react";

interface CurrencyInputProps {
    value: number; // Value in cents (smallest currency unit)
    onChange: (valueInCents: number) => void;
    currency?: string;
    label?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    /** Ikona unutar inputa (lijeva strana) */
    icon?: React.ElementType;
}

/**
 * ATM-style currency input.
 * - Always shows 2 decimal places
 * - When typing digits, they fill from right to left
 * - Example: type "50" = 0,50 | type "5000" = 50,00
 * - Accepts both comma and dot as decimal separator for display
 * - Internally stores value in cents (smallest unit)
 */
export function CurrencyInput({
    value,
    onChange,
    currency = "",
    label,
    required,
    disabled,
    className = "",
    icon: Icon
}: CurrencyInputProps) {
    // Display value formatted with 2 decimals
    const formatDisplay = (cents: number): string => {
        const whole = Math.floor(cents / 100);
        const decimal = Math.abs(cents % 100);
        return `${whole},${decimal.toString().padStart(2, "0")}`;
    };

    const [displayValue, setDisplayValue] = useState(formatDisplay(value));

    // Sync display when external value changes
    useEffect(() => {
        setDisplayValue(formatDisplay(value));
    }, [value]);

    // Handle input - ATM style (digits fill from right)
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let input = e.target.value;

        // Remove all non-digits
        const digits = input.replace(/[^0-9]/g, "");

        // Convert to cents - the raw number IS cents
        const cents = parseInt(digits, 10) || 0;

        // Update display with formatted value
        setDisplayValue(formatDisplay(cents));
        onChange(cents);
    };

    // Handle focus - select all for easy replacement
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.select();
    };

    // Handle key events for better UX
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Allow: backspace, delete, tab, escape, enter, arrows
        const allowedKeys = ["Backspace", "Delete", "Tab", "Escape", "Enter", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
        if (allowedKeys.includes(e.key)) {
            return;
        }
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        if ((e.ctrlKey || e.metaKey) && ["a", "c", "v", "x"].includes(e.key.toLowerCase())) {
            return;
        }
        // Allow: digits and comma/dot (for UX, but we strip them anyway)
        if (!/^[0-9,.]$/.test(e.key)) {
            e.preventDefault();
        }
    };

    return (
        <div className={`space-y-1.5 ${className}`}>
            {label && (
                <label className="text-[11px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)] ml-1 block">
                    {label}
                    {required && <span className="text-primary ml-0.5">*</span>}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]">
                        <Icon className="h-4 w-4" />
                    </div>
                )}
                <input
                    type="text"
                    inputMode="numeric"
                    value={displayValue}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    className={`w-full h-[44px] min-h-[44px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] font-bold text-sm py-2.5 pr-12 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all text-right ${Icon ? "pl-10" : "px-4"}`}
                />
                {currency && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--color-text-dim)]">
                        {currency}
                    </span>
                )}
            </div>
        </div>
    );
}
