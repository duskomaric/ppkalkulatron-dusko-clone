import { FilterBar } from "~/components/ui/FilterBar";
import { FilterButton } from "~/components/ui/FilterButton";
import { YearFilterButton } from "~/components/ui/YearFilterButton";
import { FilterSearchInput } from "~/components/ui/FilterSearchInput";
import { FilterPillSelect } from "~/components/ui/FilterPillSelect";
import { FilterDateInput } from "~/components/ui/FilterDateInput";
import { ActiveFiltersBar } from "~/components/ui/ActiveFiltersBar";

interface DocumentFilterSectionProps {
  filtersOpen: boolean;
  onToggleFilters: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder: string;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  statusOptions: { value: string; label: string }[];
  dateFrom: string;
  onDateFromChange: (val: string) => void;
  dateTo: string;
  onDateToChange: (val: string) => void;
  dateLabel: string;
  selectedYear: number;
  onPageReset: () => void;
}

/**
 * Shared filter section for document list pages (quotes, proformas).
 * Renders: FilterBar with buttons + search, expandable filter panel, active filters bar.
 */
export function DocumentFilterSection({
  filtersOpen,
  onToggleFilters,
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  statusFilter,
  onStatusChange,
  statusOptions,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  dateLabel,
  selectedYear,
  onPageReset,
}: DocumentFilterSectionProps) {
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
        value: statusOptions.find((s) => s.value === statusFilter)?.label.replace("Status: ", "") || statusFilter,
        onClear: () => onStatusChange(""),
      }]
      : []),
    ...((dateFrom || dateTo)
      ? [{
        id: "date",
        label: "Datum",
        value: `${dateFrom || "—"} → ${dateTo || "—"}`,
        onClear: () => { onDateFromChange(""); onDateToChange(""); },
      }]
      : []),
  ];

  const resetFilters = () => {
    onSearchChange("");
    onStatusChange("");
    onDateFromChange("");
    onDateToChange("");
    onPageReset();
  };

  return (
    <div className="space-y-3 mb-4">
      <FilterBar
        actions={
          <div className="flex items-center gap-2">
            <FilterButton isOpen={filtersOpen} onClick={onToggleFilters} />
            <YearFilterButton selectedYear={selectedYear} />
          </div>
        }
        search={
          <FilterSearchInput
            value={searchQuery}
            onChange={(val) => {
              onSearchChange(val);
              if (val.trim().length >= 3 || val.trim().length === 0) onPageReset();
            }}
            placeholder={searchPlaceholder}
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
                {dateLabel} — Od
              </span>
              <FilterDateInput
                value={dateFrom}
                onChange={(val) => { onDateFromChange(val); onPageReset(); }}
                placeholder="Od"
              />
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-dim)]">
                {dateLabel} — Do
              </span>
              <FilterDateInput
                value={dateTo}
                onChange={(val) => { onDateToChange(val); onPageReset(); }}
                placeholder="Do"
              />
            </div>
          </div>
        </div>
      )}
      <ActiveFiltersBar filters={activeFilters} onReset={resetFilters} />
    </div>
  );
}
