import { ChevronDownIcon, ChevronUpIcon } from "./icons";
import { CardRow } from "./CardRow";

interface SectionToggleProps {
  open: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
  className?: string;
}

// Koristi se na: app/routes/invoices.tsx, app/routes/quotes.tsx, app/routes/proformas.tsx (kreiranje/uredjivanje -> Prikazi vise)
export function SectionToggle({
  open,
  onClick,
  title,
  subtitle,
  className = "",
}: SectionToggleProps) {
  return (
    <CardRow
      as="button"
      onClick={onClick}
      variant="accent"
      size="md"
      interactive
      className={`w-full justify-between gap-2 px-3 py-2.5 hover:bg-[var(--color-page-bg-hover)] transition-colors ${className}`.trim()}
    >
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 bg-[var(--color-page-bg-strong)] text-[var(--color-primary)] rounded-lg flex items-center justify-center shrink-0">
          {open ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
        </div>
        <div className="text-left">
          <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[var(--color-primary)]">
            {title}
          </p>
          {subtitle && (
            <p className="text-[10px] text-[var(--color-primary)] opacity-80">{subtitle}</p>
          )}
        </div>
      </div>
      <span className="text-[11px] font-bold text-[var(--color-primary)]">
        {open ? "Sakrij" : "Prikaži"}
      </span>
    </CardRow>
  );
}
