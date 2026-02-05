import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: React.ElementType;
    error?: string;
    required?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, icon: Icon, error, required, className = "", ...props }, ref) => {
        return (
            <div className="space-y-1.5 w-full group">
                {label && (
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)] ml-1 block">
                        {label}
                        {required && <span className="text-primary ml-0.5">*</span>}
                    </label>
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
                {error && (
                    <p className="text-[9px] font-bold text-red-500 ml-1 uppercase tracking-tight">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";
