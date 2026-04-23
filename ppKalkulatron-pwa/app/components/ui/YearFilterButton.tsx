import { useYear } from "~/contexts/YearContext";
import {Calendar1Icon, ChevronDownIcon} from "~/components/ui/icons";

/** Year button for filter bar; opens year drawer. */
export function YearFilterButton({ selectedYear }: { selectedYear: number }) {
  const { openYearDrawer } = useYear();

  return (
    <button
      type="button"
      onClick={openYearDrawer}
      className="cursor-pointer h-9 px-4 rounded-full border border-primary/40 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.18em] flex items-center gap-2 transition-colors hover:bg-primary/20 hover:border-primary/50"
    >
        <Calendar1Icon className="h-3.5 w-3.5" />
        {selectedYear}
        <ChevronDownIcon className="h-3.5 w-3.5" />
    </button>
  );
}
