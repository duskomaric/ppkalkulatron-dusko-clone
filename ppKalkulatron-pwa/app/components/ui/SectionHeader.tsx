import type { ElementType, ReactNode } from "react";

interface SectionHeaderProps {
  icon?: ElementType;
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
  iconClassName?: string;
  rightElement?: ReactNode;
}

export function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  className = "",
  iconClassName = "",
  rightElement,
}: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between gap-2 ${className}`.trim()}>
      <div className="flex items-center gap-2">
        {Icon && (
          <div className={`h-7 w-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0 ${iconClassName}`.trim()}>
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-dim)]">
            {title}
          </p>
          {subtitle && (
            <p className="text-[10px] text-[var(--color-text-dim)]">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {rightElement && (
        <div className="shrink-0">
          {rightElement}
        </div>
      )}
    </div>
  );
}
