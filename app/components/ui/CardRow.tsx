import type { ReactNode } from "react";

type CardRowElement = "div" | "button" | "label";
type CardRowVariant = "surface" | "muted" | "accent";
type CardRowSize = "sm" | "md" | "lg";

interface CardRowProps {
  as?: CardRowElement;
  variant?: CardRowVariant;
  size?: CardRowSize;
  interactive?: boolean;
  onClick?: () => void;
  htmlFor?: string;
  type?: "button" | "submit" | "reset";
  className?: string;
  children: ReactNode;
}

const variantClasses: Record<CardRowVariant, string> = {
  surface: "bg-[var(--color-surface)] border-[var(--color-border)]",
  muted: "bg-[var(--color-border)] border-[var(--color-border)]",
  accent: "border-amber-500/30 bg-amber-500/10",
};

const sizeClasses: Record<CardRowSize, string> = {
  sm: "p-2 rounded-xl",
  md: "p-3 rounded-xl",
  lg: "p-4 rounded-2xl",
};

// Koristi se na: DrawerNavItem/Toggle/DetailsItem/SectionToggle (settings drawer + detalji + toggles)
export function CardRow({
  as = "div",
  variant = "surface",
  size = "md",
  interactive = false,
  onClick,
  htmlFor,
  type = "button",
  className = "",
  children,
}: CardRowProps) {
  const Component = as;
  const interactiveClass = interactive ? "group cursor-pointer transition-all" : "";

  const sharedProps =
    as === "button"
      ? { type, onClick }
      : as === "label"
        ? { htmlFor }
        : { onClick };

  return (
    <Component
      {...sharedProps}
      className={`flex items-center gap-3 border ${variantClasses[variant]} ${sizeClasses[size]} ${interactiveClass} ${className}`.trim()}
    >
      {children}
    </Component>
  );
}
