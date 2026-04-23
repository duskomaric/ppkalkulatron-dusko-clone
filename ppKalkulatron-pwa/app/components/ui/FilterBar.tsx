import type { ReactNode } from "react";

interface FilterBarProps {
    filters?: ReactNode;
    search?: ReactNode;
    actions?: ReactNode;
}

export function FilterBar({ filters, search, actions }: FilterBarProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
                {filters}
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
                {actions}
                {search && (
                    <div className="w-full md:w-[320px]">
                        {search}
                    </div>
                )}
            </div>
        </div>
    );
}
