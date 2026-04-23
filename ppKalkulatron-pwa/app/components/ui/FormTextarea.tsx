import { FieldLabel } from "./FieldLabel";

interface FormTextareaProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    rows?: number;
    placeholder?: string;
    required?: boolean;
}

export function FormTextarea({ label, value, onChange, rows = 3, placeholder, required = false }: FormTextareaProps) {
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
