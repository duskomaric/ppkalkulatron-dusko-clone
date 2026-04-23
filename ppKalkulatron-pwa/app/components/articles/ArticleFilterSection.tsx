import { FilterBar } from "~/components/ui/FilterBar";
import { FilterButton } from "~/components/ui/FilterButton";
import { FilterSearchInput } from "~/components/ui/FilterSearchInput";
import { FilterPillSelect } from "~/components/ui/FilterPillSelect";
import { ActiveFiltersBar } from "~/components/ui/ActiveFiltersBar";
import type { SelectOption, TaxRateOption } from "~/types/config";

interface ArticleFilterSectionProps {
  filtersOpen: boolean;
  onToggleFilters: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  typeFilter: string;
  onTypeChange: (val: string) => void;
  articleTypes: SelectOption[];
  taxFilter: string;
  onTaxChange: (val: string) => void;
  taxRates: TaxRateOption[];
  onPageReset: () => void;
}

const statusOptions = [
  { value: "", label: "Status: Svi" },
  { value: "active", label: "Status: Aktivan" },
  { value: "inactive", label: "Status: Neaktivan" },
];

export function ArticleFilterSection({
  filtersOpen,
  onToggleFilters,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  articleTypes,
  taxFilter,
  onTaxChange,
  taxRates,
  onPageReset,
}: ArticleFilterSectionProps) {
  const typeOptions = [
    { value: "", label: "Tip: Svi" },
    ...articleTypes.map((t) => ({
      value: t.value,
      label: `Tip: ${t.label}`,
    })),
  ];

  const taxOptions = [
    { value: "", label: "Porez: Svi" },
    { value: "none", label: "Porez: Bez poreza" },
    ...taxRates.map((t) => ({
      value: t.value,
      label: `Porez: ${t.label} (${t.rate}%)`,
    })),
  ];

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
    ...(typeFilter
      ? [{
        id: "type",
        label: "Tip",
        value: articleTypes.find((t) => t.value === typeFilter)?.label || typeFilter,
        onClear: () => onTypeChange(""),
      }]
      : []),
    ...(taxFilter
      ? [{
        id: "tax",
        label: "Porez",
        value: taxFilter === "none"
          ? "Bez poreza"
          : (taxRates.find((t) => t.value === taxFilter)?.label || taxFilter),
        onClear: () => onTaxChange(""),
      }]
      : []),
  ];

  const resetFilters = () => {
    onSearchChange("");
    onStatusChange("");
    onTypeChange("");
    onTaxChange("");
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
            placeholder="Pretraži artikle..."
          />
        }
      />
      {filtersOpen && (
        <div className="p-4 rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-surface)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div className="flex flex-col gap-1.5 min-w-0">
              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-dim)]">
                Status
              </span>
              <FilterPillSelect
                value={statusFilter}
                options={statusOptions}
                onChange={(val) => { onStatusChange(val); onPageReset(); }}
              />
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-dim)]">
                Tip
              </span>
              <FilterPillSelect
                value={typeFilter}
                options={typeOptions}
                onChange={(val) => { onTypeChange(val); onPageReset(); }}
              />
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-dim)]">
                Porez
              </span>
              <FilterPillSelect
                value={taxFilter}
                options={taxOptions}
                onChange={(val) => { onTaxChange(val); onPageReset(); }}
              />
            </div>
          </div>
        </div>
      )}
      <ActiveFiltersBar filters={activeFilters} onReset={resetFilters} />
    </div>
  );
}
