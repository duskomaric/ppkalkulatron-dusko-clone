import type { ReactNode } from "react";

interface ListHeaderColumn {
  label: ReactNode;
  align?: "left" | "center" | "right";
}

interface ListHeaderProps {
  columns: ListHeaderColumn[];
  grid: string;
}

// Koristi se na: clients/articles/invoices (desktop header tabele)
export function ListHeader({ columns, grid }: ListHeaderProps) {
  return (
    <div
      className={`hidden md:grid ${grid} gap-3 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-dim)]`}
    >
      {columns.map((col, idx) => (
        <span
          key={idx}
          className={`${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""}`.trim()}
        >
          {col.label}
        </span>
      ))}
    </div>
  );
}
