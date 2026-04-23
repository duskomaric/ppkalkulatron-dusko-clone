import { FilterBar } from "~/components/ui/FilterBar";
import { FilterButton } from "~/components/ui/FilterButton";
import { YearFilterButton } from "~/components/ui/YearFilterButton";
import { FilterSearchInput } from "~/components/ui/FilterSearchInput";
import { FilterDateInput } from "~/components/ui/FilterDateInput";
import { ActiveFiltersBar } from "~/components/ui/ActiveFiltersBar";

interface IncomeBookFilterSectionProps {
    filtersOpen: boolean;
    onToggleFilters: () => void;
    searchQuery: string;
    onSearchChange: (val: string) => void;
    startDate: string;
    onStartDateChange: (val: string) => void;
    endDate: string;
    onEndDateChange: (val: string) => void;
    selectedYear: number;
    onPageReset: () => void;
}

export function IncomeBookFilterSection({
    filtersOpen,
    onToggleFilters,
    searchQuery,
    onSearchChange,
    startDate,
    onStartDateChange,
    endDate,
    onEndDateChange,
    selectedYear,
    onPageReset,
}: IncomeBookFilterSectionProps) {

    const activeFilters = [
        ...(searchQuery.trim()
            ? [{
                id: "search",
                label: "Pretraga",
                value: searchQuery.trim(),
                onClear: () => onSearchChange(""),
            }]
            : []),
        ...((startDate || endDate)
            ? [{
                id: "date",
                label: "Period",
                value: `${startDate || "—"} → ${endDate || "—"}`,
                onClear: () => { onStartDateChange(""); onEndDateChange(""); },
            }]
            : []),
    ];

    const resetFilters = () => {
        onSearchChange("");
        onStartDateChange("");
        onEndDateChange("");
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
                            // reset to first page on search
                            onPageReset();
                        }}
                        placeholder="Pretraži stavke..."
                    />
                }
            />
            {filtersOpen && (
                <div className="p-4 rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-surface)]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                        <div className="flex flex-col gap-1.5 min-w-0">
                            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-dim)]">
                                Datum knjiženja — Od
                            </span>
                            <FilterDateInput
                                value={startDate}
                                onChange={(val) => { onStartDateChange(val); onPageReset(); }}
                                placeholder="Od"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5 min-w-0">
                            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-dim)]">
                                Datum knjiženja — Do
                            </span>
                            <FilterDateInput
                                value={endDate}
                                onChange={(val) => { onEndDateChange(val); onPageReset(); }}
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
