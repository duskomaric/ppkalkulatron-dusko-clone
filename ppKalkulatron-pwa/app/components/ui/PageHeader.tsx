import type { ReactNode } from "react";
import { ArrowLeftIcon } from "./icons";

interface PageHeaderProps {
  title: string;
  description?: string;
  onBack?: () => void;
  backLabel?: string;
  actions?: ReactNode;
}

// Koristi se na: settings/* (naslov stranice + akcije)
export function PageHeader({
  title,
  description,
  onBack,
  backLabel = "Nazad",
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
      <div>
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-text-dim)] hover:text-primary transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {backLabel}
          </button>
        )}
        <h1 className="text-2xl font-black text-[var(--color-text-main)]">{title}</h1>
        {description && (
          <p className="text-[var(--color-text-dim)]">{description}</p>
        )}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
}
