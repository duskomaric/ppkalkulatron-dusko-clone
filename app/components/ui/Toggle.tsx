import React from "react";

interface ToggleProps {
    id?: string;
    name?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: React.ReactNode;
    disabled?: boolean;
    className?: string;
}

export function Toggle({ id, name, checked, onChange, label, disabled, className = "" }: ToggleProps) {
    return (
        <label
            htmlFor={id}
            className={`flex items-center gap-3 p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
        >
            <div className="relative flex items-center">
                <input
                    type="checkbox"
                    id={id}
                    name={name}
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={disabled}
                    className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[var(--color-border-strong)] rounded-full peer-focus:outline-none peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-gray-400 after:border after:border-gray-300 after:transition-all peer-checked:after:translate-x-full peer-checked:after:bg-white relative" />
            </div>
            {label != null && label !== "" && <span className="text-[13px] font-bold text-[var(--color-text-muted)]">{label}</span>}
        </label>
    );
}
