import type { ReactNode } from "react";
import { EntityCard } from "./EntityCard";

interface ResponsiveEntityCardProps {
  onClick?: () => void;
  mobile: ReactNode;
  desktop: ReactNode;
}

// Koristi se na: clients i articles (kartica sa mobile/desktop prikazom)
export function ResponsiveEntityCard({
  onClick,
  mobile,
  desktop,
}: ResponsiveEntityCardProps) {
  return (
    <EntityCard onClick={onClick}>
      <div className="md:hidden">{mobile}</div>
      <div className="hidden md:block">{desktop}</div>
    </EntityCard>
  );
}
