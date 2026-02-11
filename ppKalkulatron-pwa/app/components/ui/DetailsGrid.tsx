import type { ReactNode } from "react";

interface DetailsGridProps {
  columns?: 2 | 3 | 4;
  className?: string;
  children: ReactNode;
}

const columnClasses: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

// Koristi se na: clients/articles/invoices (grid detalja u view draweru)
export function DetailsGrid({
  columns = 2,
  className = "",
  children,
}: DetailsGridProps) {
  const cols = columnClasses[columns] || columnClasses[2];
  return (
    <div className={`grid ${cols} gap-2 ${className}`.trim()}>
      {children}
    </div>
  );
}
