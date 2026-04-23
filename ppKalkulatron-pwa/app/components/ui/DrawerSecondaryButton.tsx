interface DrawerSecondaryButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function DrawerSecondaryButton({
  label,
  onClick,
  disabled,
  className = ""
}: DrawerSecondaryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3.5 bg-[var(--color-border)] text-[var(--color-text-muted)] border border-[var(--color-border)] rounded-xl font-black text-[10px] uppercase tracking-widest hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-hover)] transition-all cursor-pointer ${className}`}
    >
      {label}
    </button>
  );
}
