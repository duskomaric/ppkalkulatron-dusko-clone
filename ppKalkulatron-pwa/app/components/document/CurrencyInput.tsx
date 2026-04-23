import { useState, useEffect } from "react";
import type { ChangeEvent, FocusEvent, KeyboardEvent, ElementType } from "react";
import { FieldLabel } from "~/components/ui/FieldLabel";

interface CurrencyInputProps {
    value: number;
    onChange: (valueInCents: number) => void;
    currency?: string;
    label?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    icon?: ElementType;
}

/**
 * ATM-style currency input.
 * - Always shows 2 decimal places
 * - When typing digits, they fill from right to left
 * - Example: type "50" = 0,50 | type "5000" = 50,00
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
    const formatDisplay = (cents: number): string => {
        const whole = Math.floor(cents / 100);
        const decimal = Math.abs(cents % 100);
        return `${whole},${decimal.toString().padStart(2, "0")}`;
    };

    const [displayValue, setDisplayValue] = useState(formatDisplay(value));

    useEffect(() => {
        setDisplayValue(formatDisplay(value));
    }, [value]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/[^0-9]/g, "");
        const cents = parseInt(digits, 10) || 0;
        setDisplayValue(formatDisplay(cents));
        onChange(cents);
    };

    const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
        e.target.select();
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        const allowedKeys = ["Backspace", "Delete", "Tab", "Escape", "Enter", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
        if (allowedKeys.includes(e.key)) return;
        if ((e.ctrlKey || e.metaKey) && ["a", "c", "v", "x"].includes(e.key.toLowerCase())) return;
        if (!/^[0-9,.]$/.test(e.key)) e.preventDefault();
    };

    return (
        <div className={`space-y-1.5 ${className}`}>
            {label && (
                <FieldLabel required={required}>{label}</FieldLabel>
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
