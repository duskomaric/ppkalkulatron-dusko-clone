import type { FormEvent, ReactNode } from "react";
import { MailIcon, FileTextIcon } from "~/components/ui/icons";
import { Input } from "~/components/ui/Input";
import { Toggle } from "~/components/ui/Toggle";

interface EmailForm {
  to: string;
  subject: string;
  body: string;
  attach_pdf: boolean;
}

interface EmailModalProps {
  title: string;
  emailForm: EmailForm;
  onChange: (form: EmailForm) => void;
  onSubmit: (e: FormEvent) => void;
  onClose: () => void;
  loading: boolean;
  pdfLabel?: string;
  extraToggles?: ReactNode;
}

export function EmailModal({
  title,
  emailForm,
  onChange,
  onSubmit,
  onClose,
  loading,
  pdfLabel = "Priloži PDF",
  extraToggles,
}: EmailModalProps) {
  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[12px]"
        onClick={() => !loading && onClose()}
      />
      <div className="relative w-full max-w-[480px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-[var(--color-border)]">
          <h3 className="text-lg font-black text-[var(--color-text-main)] flex items-center gap-2">
            <MailIcon className="h-5 w-5 text-primary" />
            {title}
          </h3>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <Input
            label="Email primaoca"
            type="email"
            value={emailForm.to}
            onChange={(e) => onChange({ ...emailForm, to: e.target.value })}
            icon={MailIcon}
            required
            placeholder="klijent@email.com"
          />
          <Input
            label="Predmet"
            type="text"
            value={emailForm.subject}
            onChange={(e) => onChange({ ...emailForm, subject: e.target.value })}
            icon={FileTextIcon}
            required
          />
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)] ml-1 block">
              Tekst maila
            </label>
            <textarea
              value={emailForm.body}
              onChange={(e) => onChange({ ...emailForm, body: e.target.value })}
              rows={5}
              required
              className="w-full p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] font-bold text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 placeholder:text-[var(--color-text-dim)] resize-none"
              placeholder="Tekst maila..."
            />
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Toggle
              checked={emailForm.attach_pdf}
              onChange={(v) => onChange({ ...emailForm, attach_pdf: v })}
              label={pdfLabel}
              className="!p-2"
            />
            {extraToggles}
          </div>
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => !loading && onClose()}
              disabled={loading}
              className="flex-1 py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] font-bold text-sm hover:bg-[var(--color-surface-hover)] transition-all disabled:opacity-50 cursor-pointer"
            >
              Odustani
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <MailIcon className="h-4 w-4" />}
              {loading ? "Slanje..." : "Pošalji"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
