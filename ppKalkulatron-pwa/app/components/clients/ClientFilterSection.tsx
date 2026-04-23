import { FilterBar } from "~/components/ui/FilterBar";
import { FilterButton } from "~/components/ui/FilterButton";
import { FilterSearchInput } from "~/components/ui/FilterSearchInput";
import { FilterPillSelect } from "~/components/ui/FilterPillSelect";
import { ActiveFiltersBar } from "~/components/ui/ActiveFiltersBar";

interface ClientFilterSectionProps {
  filtersOpen: boolean;
  onToggleFilters: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  onPageReset: () => void;
}

const statusOptions = [
  { value: "", label: "Status: Svi" },
  { value: "active", label: "Status: Aktivan" },
  { value: "inactive", label: "Status: Neaktivan" },
];

export function ClientFilterSection({
  filtersOpen,
  onToggleFilters,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onPageReset,
}: ClientFilterSectionProps) {
  const activeFilters = [
    ...(searchQuery.trim()
      ? [{
        id: "search",
        label: "Pretraga",
        value: searchQuery.trim(),
        onClear: () => onSearchChange(""),
      }]
      : []),
    ...(statusFilter
      ? [{
        id: "status",
        label: "Status",
        value: statusFilter === "active" ? "Aktivan" : "Neaktivan",
        onClear: () => onStatusChange(""),
      }]
      : []),
  ];

  const resetFilters = () => {
    onSearchChange("");
    onStatusChange("");
    onPageReset();
  };

  return (
    <div className="space-y-3 mb-4">
      <FilterBar
        actions={
          <FilterButton isOpen={filtersOpen} onClick={onToggleFilters} />
        }
        search={
          <FilterSearchInput
            value={searchQuery}
            onChange={(val) => { onSearchChange(val); onPageReset(); }}
            placeholder="Pretraži klijente..."
          />
        }
      />
      {filtersOpen && (
        <div className="p-4 rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-surface)]">
          <div className="flex flex-col gap-1.5 max-w-xs">
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-dim)]">
              Status
            </span>
            <FilterPillSelect
              value={statusFilter}
              options={statusOptions}
              onChange={(val) => { onStatusChange(val); onPageReset(); }}
            />
          </div>
        </div>
      )}
      <ActiveFiltersBar filters={activeFilters} onReset={resetFilters} />
    </div>
  );
}
