import type { ComponentType, SVGProps, ReactNode } from "react";
import { formatPrice } from "~/utils/format";
import {
  ContactRoundIcon,
  Calendar1Icon,
  Clock1Icon,
  GlobeIcon,
  CreditCardIcon,
  FileTextIcon,
  StickyNoteIcon,
  BoxesIcon,
  MailIcon,
} from "~/components/ui/icons";
import { SectionBlock } from "~/components/ui/SectionBlock";
import { SectionHeader } from "~/components/ui/SectionHeader";
import { DetailsGrid } from "~/components/ui/DetailsGrid";
import { DetailsItem } from "~/components/ui/DetailsItem";

interface DocumentItem {
  id?: number;
  name: string;
  description?: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  article_id?: number | null;
}

interface DocumentData {
  client?: { name: string } | null;
  language_label?: string;
  date: string;
  currency?: string | null;
  notes?: string | null;
  items: DocumentItem[];
  subtotal: number;
  tax_total: number;
  total: number;
}

interface DocumentDetailViewProps {
  document: DocumentData;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  secondaryDateLabel: string;
  secondaryDateValue: string | null;
  templateLabel?: string;
  /** Optional source label (e.g. "Iz ponude: PON-001", "Iz predračuna: PRF-001") */
  sourceLabel?: string | null;
  /** Ikona za red Izvor (npr. FileSlidersIcon za ponudu, FileCheckIcon za predračun) */
  sourceIcon?: ComponentType<SVGProps<SVGSVGElement>>;
  onDownloadPdf: () => void;
  pdfLoading: boolean;
  onSendEmail: () => void;
  convertButton?: ReactNode;
  extraContent?: ReactNode;
}

export function DocumentDetailView({
  document: doc,
  icon: Icon,
  secondaryDateLabel,
  secondaryDateValue,
  templateLabel,
  sourceLabel,
  sourceIcon,
  onDownloadPdf,
  pdfLoading,
  onSendEmail,
  convertButton,
  extraContent,
}: DocumentDetailViewProps) {
  const currency = doc.currency || "BAM";

  return (
    <div className="space-y-3">
      <SectionBlock variant="plain">
        <SectionHeader icon={Icon} title="Osnovni podaci" />
        <DetailsGrid columns={2}>
          <DetailsItem icon={ContactRoundIcon} label="Klijent" value={doc.client?.name} color="bg-blue-500/10 text-blue-500" />
          {sourceLabel && (
            <DetailsItem icon={sourceIcon ?? FileTextIcon} label="Izvor" value={sourceLabel} color="bg-[var(--color-text-dim)]/10 text-[var(--color-text-dim)]" />
          )}
          <DetailsItem icon={GlobeIcon} label="Jezik" value={doc.language_label} color="bg-purple-500/10 text-purple-500" />
          <DetailsItem icon={Calendar1Icon} label="Datum" value={doc.date} color="bg-green-500/10 text-green-500" />
          <DetailsItem icon={Clock1Icon} label={secondaryDateLabel} value={secondaryDateValue || "—"} color="bg-green-500/10 text-green-500" />
          <DetailsItem icon={CreditCardIcon} label="Valuta" value={currency} color="bg-amber-500/10 text-amber-500" />
          {templateLabel && (
            <DetailsItem icon={FileTextIcon} label="Predložak" value={templateLabel} color="bg-indigo-500/10 text-indigo-500" />
          )}
        </DetailsGrid>
      </SectionBlock>

      {doc.notes && (
        <div className="p-3 bg-[var(--color-border)] rounded-2xl border border-[var(--color-border-strong)]">
          <div className="flex items-center gap-2 mb-1">
            <StickyNoteIcon className="h-3 w-3 text-[var(--color-text-dim)]" />
            <span className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-dim)]">Napomena</span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">{doc.notes}</p>
        </div>
      )}

      <SectionBlock variant="plain">
        <SectionHeader icon={BoxesIcon} title={`Stavke (${doc.items.length})`} />
        <div className="hidden md:grid grid-cols-[minmax(0,1fr)_70px_110px_80px_120px] gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-dim)] px-2">
          <span>Stavka</span>
          <span className="text-right">Kol.</span>
          <span className="text-right">Cijena</span>
          <span className="text-right">PDV</span>
          <span className="text-right">Ukupno</span>
        </div>
        <div className="space-y-2">
          {doc.items.map((item, idx) => {
            const unitPrice = item.quantity > 0 ? Math.round(item.total / item.quantity) : 0;
            return (
              <div key={item.id || idx} className="p-3 bg-[var(--color-border)] rounded-xl border border-[var(--color-border-strong)]">
                <div className="md:hidden">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-bold text-[var(--color-text-main)]">{item.name}</p>
                      {item.description && <p className="text-[10px] text-[var(--color-text-dim)]">{item.description}</p>}
                    </div>
                    <p className="text-sm font-black text-primary">{formatPrice(item.total)} {currency}</p>
                  </div>
                  <div className="flex gap-4 text-[10px] text-[var(--color-text-dim)]">
                    <span>Kol: <strong className="text-[var(--color-text-muted)]">{item.quantity}</strong></span>
                    <span>Cijena: <strong className="text-[var(--color-text-muted)]">{formatPrice(unitPrice)} {currency}</strong></span>
                    <span>PDV: <strong className="text-[var(--color-text-muted)]">{item.tax_rate / 100}%</strong></span>
                  </div>
                </div>
                <div className="hidden md:grid grid-cols-[minmax(0,1fr)_70px_110px_80px_120px] gap-2 items-center">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--color-text-main)]">{item.name}</p>
                    {item.description && <p className="text-[10px] text-[var(--color-text-dim)]">{item.description}</p>}
                  </div>
                  <div className="text-xs font-bold text-[var(--color-text-muted)] text-right">{item.quantity}</div>
                  <div className="text-xs font-bold text-[var(--color-text-muted)] text-right">{formatPrice(unitPrice)} {currency}</div>
                  <div className="text-xs font-bold text-[var(--color-text-muted)] text-right">{item.tax_rate / 100}%</div>
                  <div className="text-sm font-black text-primary text-right">{formatPrice(item.total)} {currency}</div>
                </div>
              </div>
            );
          })}
        </div>
      </SectionBlock>

      {/* Totals */}
      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-text-dim)]">Osnovica:</span>
          <span className="font-bold text-[var(--color-text-main)]">{formatPrice(doc.subtotal)} {currency}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-text-dim)]">PDV:</span>
          <span className="font-bold text-[var(--color-text-main)]">{formatPrice(doc.tax_total)} {currency}</span>
        </div>
        <div className="h-[1px] bg-amber-500/20" />
        <div className="flex justify-between">
          <span className="text-sm font-bold text-[var(--color-text-main)]">Ukupno:</span>
          <span className="text-xl font-black text-primary tracking-tighter italic">{formatPrice(doc.total)} {currency}</span>
        </div>
      </div>

      {extraContent}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={pdfLoading}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-primary/30 bg-primary/10 text-primary font-bold text-sm hover:bg-primary/20 transition-all disabled:opacity-50 cursor-pointer min-h-[44px]"
        >
          {pdfLoading ? (
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
          ) : (
            <FileTextIcon className="h-4 w-4" />
          )}
          Preuzmi PDF
        </button>
        <button
          type="button"
          onClick={onSendEmail}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-primary/30 bg-primary/10 text-primary font-bold text-sm hover:bg-primary/20 transition-all cursor-pointer min-h-[44px]"
        >
          <MailIcon className="h-4 w-4" />
          Pošalji mail
        </button>
      </div>
      {convertButton}
    </div>
  );
}
