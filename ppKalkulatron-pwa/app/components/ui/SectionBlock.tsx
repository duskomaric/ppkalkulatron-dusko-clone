import type { ReactNode } from "react";

type SectionVariant = "plain" | "card" | "accent";

interface SectionBlockProps {
  variant?: SectionVariant;
  className?: string;
  children: ReactNode;
}

const variantClasses: Record<SectionVariant, string> = {
  plain: "space-y-2",
  card: "rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/40 p-3 space-y-3",
  accent: "rounded-2xl border-2 border-dashed border-[var(--color-page-border)] bg-[var(--color-page-bg)] p-3 space-y-3",
};

export function SectionBlock({
  variant = "plain",
  className = "",
  children,
}: SectionBlockProps) {
  return (
    <div className={`${variantClasses[variant]} ${className}`.trim()}>
      {children}
    </div>
  );
}
