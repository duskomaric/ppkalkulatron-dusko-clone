import { FilterBar } from "~/components/ui/FilterBar";
import { FilterButton } from "~/components/ui/FilterButton";
import { YearFilterButton } from "~/components/ui/YearFilterButton";
import { FilterSearchInput } from "~/components/ui/FilterSearchInput";
import { FilterPillSelect } from "~/components/ui/FilterPillSelect";
import { FilterDateInput } from "~/components/ui/FilterDateInput";
import { ActiveFiltersBar } from "~/components/ui/ActiveFiltersBar";
import type { SelectOption } from "~/types/config";

interface InvoiceFilterSectionProps {
  filtersOpen: boolean;
  onToggleFilters: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  paymentFilter: string;
  onPaymentChange: (val: string) => void;
  paymentTypes: SelectOption[];
  createdFrom: string;
  onCreatedFromChange: (val: string) => void;
  createdTo: string;
  onCreatedToChange: (val: string) => void;
  selectedYear: number;
  onPageReset: () => void;
}

const statusOptions = [
  { value: "", label: "Status: Svi" },
  { value: "created", label: "Status: Kreiran" },
  { value: "fiscalized", label: "Status: Fiskaliziran" },
  { value: "refund_created", label: "Status: Storno kreiran" },
  { value: "refunded", label: "Status: Storniran" },
];

export function InvoiceFilterSection({
  filtersOpen,
  onToggleFilters,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  paymentFilter,
  onPaymentChange,
  paymentTypes,
  createdFrom,
  onCreatedFromChange,
  createdTo,
  onCreatedToChange,
  selectedYear,
  onPageReset,
}: InvoiceFilterSectionProps) {
  const paymentOptions = [
    { value: "", label: "Plaćanje: Svi" },
    ...paymentTypes.map((pt) => ({
      value: pt.value,
      label: `Plaćanje: ${pt.label}`,
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
        value: statusOptions.find((s) => s.value === statusFilter)?.label.replace("Status: ", "") || statusFilter,
        onClear: () => onStatusChange(""),
      }]
      : []),
    ...(paymentFilter
      ? [{
        id: "payment",
        label: "Plaćanje",
        value: paymentOptions.find((p) => p.value === paymentFilter)?.label.replace("Plaćanje: ", "") || paymentFilter,
        onClear: () => onPaymentChange(""),
      }]
      : []),
    ...((createdFrom || createdTo)
      ? [{
        id: "created",
        label: "Datum",
        value: `${createdFrom || "—"} → ${createdTo || "—"}`,
        onClear: () => { onCreatedFromChange(""); onCreatedToChange(""); },
      }]
      : []),
  ];

  const resetFilters = () => {
    onSearchChange("");
    onStatusChange("");
    onPaymentChange("");
    onCreatedFromChange("");
    onCreatedToChange("");
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
            placeholder="Pretraži račune (min. 3 znaka)..."
          />
        }
      />
      {filtersOpen && (
        <div className="p-4 rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-surface)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
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
                Plaćanje
              </span>
              <FilterPillSelect
                value={paymentFilter}
                options={paymentOptions}
                onChange={(val) => { onPaymentChange(val); onPageReset(); }}
              />
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-dim)]">
                Datum kreiranja — Od
              </span>
              <FilterDateInput
                value={createdFrom}
                onChange={(val) => { onCreatedFromChange(val); onPageReset(); }}
                placeholder="Od"
              />
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-dim)]">
                Datum kreiranja — Do
              </span>
              <FilterDateInput
                value={createdTo}
                onChange={(val) => { onCreatedToChange(val); onPageReset(); }}
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
