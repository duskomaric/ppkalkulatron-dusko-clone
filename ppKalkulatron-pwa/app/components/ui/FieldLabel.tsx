import type { ReactNode } from "react";

interface FieldLabelProps {
  children: ReactNode;
  required?: boolean;
  variant?: "default" | "settings";
  className?: string;
}

export function FieldLabel({
  children,
  required,
  variant = "default",
  className = ""
}: FieldLabelProps) {
  const baseClass =
    variant === "settings"
      ? "text-[11px] font-black uppercase tracking-wider text-[var(--color-text-dim)] pl-1 block"
      : "text-[11px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)] ml-1 block";
  const requiredClass = variant === "settings" ? "text-primary ml-1" : "text-primary ml-0.5";

  return (
    <label className={`${baseClass} ${className}`.trim()}>
      {children}
      {required && <span className={requiredClass}>*</span>}
    </label>
  );
}
