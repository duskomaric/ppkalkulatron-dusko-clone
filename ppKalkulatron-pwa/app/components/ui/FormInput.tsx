import type { ElementType } from "react";
import { FieldLabel } from "./FieldLabel";

interface FormInputProps {
    label?: string;
    value: string | number | null;
    onChange: (value: string) => void;
    type?: string;
    required?: boolean;
    placeholder?: string;
    maxLength?: number;
    icon?: ElementType;
}

export function FormInput({ label, value, onChange, type = "text", required = false, placeholder, maxLength, icon: Icon }: FormInputProps) {
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
                    value={value ?? ""}
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
