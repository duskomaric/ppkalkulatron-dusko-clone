import type { ElementType, ReactNode } from "react";

interface MetaItemProps {
  icon: ElementType;
  label: string;
  value?: ReactNode;
  valueClassName?: string;
  className?: string;
}

// Koristi se na: clients/articles/invoices/quotes/proformas (mobile kartice -> meta redovi)
export function MetaItem({
  icon: Icon,
  label,
  value,
  valueClassName = "",
  className = "",
}: MetaItemProps) {
  return (
    <div className={`flex flex-col gap-0.5 ${className}`.trim()}>
      <div className="flex items-center gap-1 text-[var(--color-text-dim)]">
        <Icon className="w-2.5 h-2.5" />
        <span className="text-[9px] font-black uppercase tracking-tight">
          {label}
        </span>
      </div>
      {value != null && (
        <p className={`text-xs font-bold text-[var(--color-text-muted)] ${valueClassName}`.trim()}>
          {value}
        </p>
      )}
    </div>
  );
}
