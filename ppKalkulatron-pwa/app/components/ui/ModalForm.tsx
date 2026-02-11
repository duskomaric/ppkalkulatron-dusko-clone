import type { FormEvent, ReactNode } from "react";

interface ModalFormProps {
  title: string;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  children: ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  sizeClassName?: string;
}

// Koristi se na: settings/bank-accounts i settings/currencies (modal za kreiranje/uredjivanje)
export function ModalForm({
  title,
  onClose,
  onSubmit,
  children,
  submitLabel = "Sačuvaj",
  cancelLabel = "Odustani",
  sizeClassName = "max-w-md md:max-w-lg",
}: ModalFormProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <form
        onSubmit={onSubmit}
        className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 w-full ${sizeClassName} shadow-2xl`}
      >
        <h3 className="text-xl font-black mb-6 border-b border-[var(--color-border)] pb-4">
          {title}
        </h3>
        <div className="space-y-4">{children}</div>
        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-[var(--color-text-dim)] hover:text-[var(--color-text-main)] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            className="bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-6 rounded-xl shadow-glow-primary transition-all text-sm"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
