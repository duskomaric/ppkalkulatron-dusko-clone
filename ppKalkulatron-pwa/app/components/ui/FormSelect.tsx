import { FieldLabel } from "./FieldLabel";

interface FormSelectOption {
    value: string;
    label: string;
}

interface FormSelectProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: FormSelectOption[];
    required?: boolean;
}

export function FormSelect({ label, value, onChange, options, required = false }: FormSelectProps) {
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
                    {options.map((opt) => (
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
