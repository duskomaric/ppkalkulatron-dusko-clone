import { FileSlidersIcon, ChevronDownIcon } from "~/components/ui/icons";

interface FilterButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

/** Filter toggle button for filter bar; matches YearFilterButton style. */
export function FilterButton({ isOpen, onClick }: FilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer h-9 px-2.5 md:px-4 rounded-full border text-[10px] font-black uppercase tracking-[0.18em] flex items-center gap-2 transition-colors ${
        isOpen
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:border-[var(--color-border-strong)]"
      }`}
    >
      <FileSlidersIcon className="h-3.5 w-3.5" />
      <span className="hidden md:inline">Filteri</span>
      <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
    </button>
  );
}
