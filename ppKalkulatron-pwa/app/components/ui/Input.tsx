import { forwardRef } from "react";
import type { ElementType, InputHTMLAttributes } from "react";
import { FieldLabel } from "./FieldLabel";
import { FieldError } from "./FieldError";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: ElementType;
    error?: string;
    required?: boolean;
}

// Koristi se na: login (forma prijave) i clients/articles/invoices (forme u drawerima)
export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, icon: Icon, error, required, className = "", ...props }, ref) => {
        return (
            <div className="space-y-1.5 w-full group">
                {label && (
                    <FieldLabel required={required}>{label}</FieldLabel>
                )}
                <div className="relative flex items-center">
                    {Icon && (
                        <div className="absolute left-4 text-[var(--color-text-dim)] group-focus-within:text-primary transition-colors duration-300">
                            <Icon className="h-4 w-4" />
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={`
              w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl text-[var(--color-text-main)] 
              placeholder:text-[var(--color-text-dim)] outline-none transition-all duration-300
              font-bold text-sm
              ${Icon ? "pl-11 pr-4" : "px-5"} 
              py-3.5
              focus:border-primary/50 focus:ring-4 focus:ring-primary/10 
              focus:bg-[var(--color-surface-hover)]
              ${error ? "border-red-500/50 ring-red-500/10" : ""}
              ${className}
            `}
                        {...props}
                    />
                </div>
                {error && <FieldError>{error}</FieldError>}
            </div>
        );
    }
);

Input.displayName = "Input";

/**
 * Settings-style Input (often used in forms within pages)
 */
// Koristi se na: profile i settings/* (tekstualna polja u formama)
export function FormInput({ label, value, onChange, type = "text", required = false, placeholder, maxLength, icon: Icon }: any) {
    return (
        <div className="space-y-1.5 w-full group">
            {label && (
                <FieldLabel required={required} variant="settings">
                    {label}
                </FieldLabel>
            )}
            <div className="relative flex items-center">
                {Icon && (
                    <div className="absolute left-4 text-[var(--color-text-dim)] group-focus-within:text-primary transition-colors">
                        <Icon className="h-4 w-4" />
                    </div>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required={required}
                    maxLength={maxLength}
                    placeholder={placeholder}
                    className={`w-full h-12 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-bold text-sm placeholder:text-[var(--color-text-muted)] ${Icon ? "pl-11 pr-4" : "px-4"}`}
                />
            </div>
        </div>
    );
}

/**
 * Settings-style Select
 */
// Koristi se na: settings/general i settings/fiscal (select polja)
export function FormSelect({ label, value, onChange, options, required = false }: any) {
    return (
        <div className="space-y-1.5 w-full">
            {label && (
                <FieldLabel required={required} variant="settings">
                    {label}
                </FieldLabel>
            )}
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required={required}
                    className="w-full h-12 px-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-bold text-sm appearance-none cursor-pointer"
                >
                    <option value="">Odaberi...</option>
                    {options.map((opt: any) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)] pointer-events-none">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
            </div>
        </div>
    );
}

/**
 * Settings-style Textarea
 */
// Koristi se na: settings/general i settings/fiscal (duga polja/napomene)
export function FormTextarea({ label, value, onChange, rows = 3, placeholder, required = false }: any) {
    return (
        <div className="space-y-1.5 w-full">
            {label && (
                <FieldLabel required={required} variant="settings">
                    {label}
                </FieldLabel>
            )}
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={rows}
                required={required}
                placeholder={placeholder}
                className="w-full p-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-bold text-sm placeholder:text-[var(--color-text-muted)] resize-none"
            />
        </div>
    );
}
