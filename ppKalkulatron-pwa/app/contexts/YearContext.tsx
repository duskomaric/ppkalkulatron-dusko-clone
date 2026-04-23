import { createContext, useCallback, useContext, useMemo, useState } from "react";

const STORAGE_KEY = "selected_year";

function getStoredYear(): number {
    if (typeof window === "undefined") return new Date().getFullYear();
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return new Date().getFullYear();
    const y = parseInt(stored, 10);
    return Number.isNaN(y) ? new Date().getFullYear() : y;
}

type YearContextValue = {
    selectedYear: number;
    setSelectedYear: (year: number) => void;
    availableYears: number[];
    setAvailableYears: (years: number[]) => void;
    yearDrawerOpen: boolean;
    openYearDrawer: () => void;
    closeYearDrawer: () => void;
};

const YearContext = createContext<YearContextValue | null>(null);

export function YearProvider({ children }: { children: React.ReactNode }) {
    const [selectedYear, setSelectedYearState] = useState(getStoredYear);
    const [availableYears, setAvailableYears] = useState<number[]>(() => [new Date().getFullYear()]);
    const [yearDrawerOpen, setYearDrawerOpen] = useState(false);

    const setSelectedYear = useCallback((year: number) => {
        setSelectedYearState(year);
        localStorage.setItem(STORAGE_KEY, String(year));
    }, []);

    const openYearDrawer = useCallback(() => setYearDrawerOpen(true), []);
    const closeYearDrawer = useCallback(() => setYearDrawerOpen(false), []);

    const value = useMemo<YearContextValue>(
        () => ({
            selectedYear,
            setSelectedYear,
            availableYears,
            setAvailableYears,
            yearDrawerOpen,
            openYearDrawer,
            closeYearDrawer,
        }),
        [selectedYear, setSelectedYear, availableYears, yearDrawerOpen, openYearDrawer, closeYearDrawer]
    );

    return <YearContext.Provider value={value}>{children}</YearContext.Provider>;
}

export function useYear(): YearContextValue {
    const ctx = useContext(YearContext);
    if (!ctx) throw new Error("useYear must be used within YearProvider");
    return ctx;
}

/** Hook for selected year only (e.g. list pages). */
export function useSelectedYear(): [number, (year: number) => void] {
    const { selectedYear, setSelectedYear } = useYear();
    return [selectedYear, setSelectedYear];
}
