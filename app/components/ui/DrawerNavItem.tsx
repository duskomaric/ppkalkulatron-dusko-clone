import type { ComponentType, SVGProps } from "react";
import { ChevronRightIcon } from "~/components/ui/icons";
import { CardRow } from "./CardRow";

interface DrawerNavItemProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  onClick: () => void;
  className?: string;
}

// Koristi se na: AppLayout (settings drawer -> navigacioni linkovi)
export function DrawerNavItem({
  icon: Icon,
  title,
  description,
  onClick,
  className = ""
}: DrawerNavItemProps) {
  return (
    <CardRow
      as="button"
      onClick={onClick}
      variant="surface"
      size="lg"
      interactive
      className={`relative gap-4 overflow-hidden hover:border-primary/30 hover:bg-[var(--color-surface-hover)] ${className}`}
    >
      <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 text-left">
        <h3 className="text-sm font-bold text-[var(--color-text-main)] group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-[10px] text-[var(--color-text-dim)] leading-tight">{description}</p>
      </div>
      <ChevronRightIcon className="h-4 w-4 text-[var(--color-text-muted)] group-hover:text-primary transition-colors" />
    </CardRow>
  );
}
