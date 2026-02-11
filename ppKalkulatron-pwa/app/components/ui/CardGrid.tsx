import type { ReactNode } from "react";

interface CardGridProps {
  gridClassName?: string;
  isEmpty?: boolean;
  empty?: ReactNode;
  children: ReactNode;
}

// Koristi se na: app/routes/settings/bank-accounts.tsx i app/routes/settings/currencies.tsx (grid kartica liste)
export function CardGrid({
  gridClassName = "grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500",
  isEmpty = false,
  empty,
  children,
}: CardGridProps) {
  return (
    <div className={gridClassName}>
      {children}
      {isEmpty && empty}
    </div>
  );
}
