import type { ComponentType, SVGProps } from "react";
import { formatPrice, getCurrencyCode } from "~/utils/format";
import {
  ContactRoundIcon,
  Calendar1Icon,
  Clock1Icon,
  CreditCardIcon,
  GlobeIcon,
  FileTextIcon,
  StickyNoteIcon,
  BoxesIcon,
  PlusIcon,
} from "~/components/ui/icons";
import { SearchSelect } from "~/components/ui/SearchSelect";
import { Input } from "~/components/ui/Input";
import { SectionBlock } from "~/components/ui/SectionBlock";
import { SectionHeader } from "~/components/ui/SectionHeader";
import { SectionToggle } from "~/components/ui/SectionToggle";
import { InvoiceItemRow } from "./InvoiceItemRow";
import type { InvoiceItemInput } from "~/types/invoice";
import type { Client } from "~/types/client";
import type { Article } from "~/types/article";
import type { Currency, SelectOption } from "~/types/config";

interface DocumentFormFieldsProps {
  formData: {
    date: string;
    currency_id?: number | null;
    language?: string;
    notes?: string | null;
    items: InvoiceItemInput[];
    subtotal: number;
    tax_total: number;
    total: number;
    [key: string]: any;
  };
  onFormChange: (updater: (prev: any) => any) => void;
  secondaryDateLabel: string;
  secondaryDateValue: string | undefined;
  secondaryDateKey: string;
  templateKey: string;
  templateValue: string;
  clients: Client[];
  articles: Article[];
  currencies: Currency[];
  languages: SelectOption[];
  templates: SelectOption[];
  selectedClient: Client | null;
  onClientChange: (client: Client | null) => void;
  onItemChange: (index: number, item: InvoiceItemInput) => void;
  onItemRemove: (index: number) => void;
  onAddItem: () => void;
  showMoreFields: boolean;
  onToggleMoreFields: () => void;
}

export function DocumentFormFields({
  formData,
  onFormChange,
  secondaryDateLabel,
  secondaryDateValue,
  secondaryDateKey,
  templateKey,
  templateValue,
  clients,
  articles,
  currencies,
  languages,
  templates,
  selectedClient,
  onClientChange,
  onItemChange,
  onItemRemove,
  onAddItem,
  showMoreFields,
  onToggleMoreFields,
}: DocumentFormFieldsProps) {
  const currencyCode = getCurrencyCode(formData.currency_id, currencies);

  return (
    <div className="space-y-3">
      <SectionBlock variant="card">
        <SectionHeader icon={ContactRoundIcon} title="Osnovni podaci" />
        <div className="space-y-1.5">
          <label className="text-[11px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)] ml-1 block">
            Klijent <span className="text-primary">*</span>
          </label>
          <SearchSelect
            items={clients}
            value={selectedClient}
            onChange={onClientChange}
            getKey={(c) => c.id}
            getLabel={(c) => c.name}
            getSearchText={(c) => `${c.name} ${c.email || ""} ${c.phone || ""}`}
            renderItem={(c, isSelected) => (
              <div className="flex flex-col gap-0.5">
                <span className={`text-sm font-bold ${isSelected ? "text-primary" : ""}`}>{c.name}</span>
                {c.email && <span className="text-[10px] text-[var(--color-text-dim)]">{c.email}</span>}
              </div>
            )}
            icon={ContactRoundIcon}
            placeholder="Odaberi klijenta..."
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
          <Input
            label="Datum"
            type="date"
            value={formData.date}
            onChange={(e) => onFormChange(prev => ({ ...prev, date: e.target.value }))}
            icon={Calendar1Icon}
            required
            className="h-[44px] min-h-[44px] py-2 rounded-xl"
          />
          <Input
            label={secondaryDateLabel}
            type="date"
            value={secondaryDateValue}
            onChange={(e) => onFormChange(prev => ({ ...prev, [secondaryDateKey]: e.target.value }))}
            icon={Clock1Icon}
            className="h-[44px] min-h-[44px] py-2 rounded-xl"
          />
        </div>
      </SectionBlock>

      <SectionBlock variant="accent">
        <SectionToggle
          open={showMoreFields}
          onClick={onToggleMoreFields}
          title="Dodatna polja"
          subtitle="Valuta, predložak, napomena..."
        />
        {showMoreFields && (
          <div className="space-y-3 pt-3 mt-2 border-t-2 border-dashed border-[var(--color-page-border-subtle)]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-start">
              <SelectField
                label="Valuta"
                icon={CreditCardIcon}
                value={formData.currency_id ?? ""}
                onChange={(val) => onFormChange(prev => ({ ...prev, currency_id: val ? parseInt(val) : null }))}
                options={currencies.map(c => ({ value: String(c.id), label: `${c.code} - ${c.name}` }))}
                noEmpty
              />
              <SelectField
                label="Jezik"
                icon={GlobeIcon}
                value={formData.language ?? ""}
                onChange={(val) => onFormChange(prev => ({ ...prev, language: val }))}
                options={languages.map(l => ({ value: l.value, label: l.label }))}
                noEmpty
              />
              <SelectField
                label="Predložak"
                icon={FileTextIcon}
                value={templateValue}
                onChange={(val) => onFormChange(prev => ({ ...prev, [templateKey]: val }))}
                options={templates.map(t => ({ value: t.value, label: t.label }))}
                noEmpty
              />
            </div>
            <div className="rounded-xl border border-dashed border-[var(--color-border)] overflow-hidden">
              <div className="flex items-center gap-2 p-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]/50">
                <div className="h-7 w-7 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center shrink-0">
                  <StickyNoteIcon className="h-3.5 w-3.5" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)]">Napomena</span>
              </div>
              <textarea
                value={formData.notes || ""}
                onChange={(e) => onFormChange(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="w-full bg-[var(--color-surface)] border-none text-[var(--color-text-main)] font-bold text-sm px-4 py-3 outline-none focus:ring-0 placeholder:text-[var(--color-text-dim)] resize-none"
                placeholder="Dodatne napomene..."
              />
            </div>
          </div>
        )}
      </SectionBlock>

      <SectionBlock variant="card">
        <SectionHeader icon={BoxesIcon} title={`Stavke (${formData.items.length})`} />
        <div className="space-y-2">
          {formData.items.map((item, index) => (
            <InvoiceItemRow
              key={index}
              item={item}
              index={index}
              articles={articles}
              currency={currencyCode}
              onChange={onItemChange}
              onRemove={onItemRemove}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={onAddItem}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-primary/40 bg-primary/5 text-primary hover:border-primary/60 hover:bg-primary/10 transition-colors cursor-pointer"
        >
          <PlusIcon className="h-4 w-4" />
          <span className="text-[11px] font-bold">Dodaj stavku</span>
        </button>
      </SectionBlock>

      {/* Totals preview */}
      <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-2xl">
        <div className="h-9 w-9 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
          <FileTextIcon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-dim)]">Osnovica:</span>
            <span className="font-bold text-[var(--color-text-main)]">{formatPrice(formData.subtotal)} {currencyCode}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-dim)]">PDV:</span>
            <span className="font-bold text-[var(--color-text-main)]">{formatPrice(formData.tax_total)} {currencyCode}</span>
          </div>
          <div className="h-[1px] bg-primary/20" />
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-[var(--color-text-main)]">Ukupno</span>
            <span className="text-xl font-black text-primary tracking-tighter italic">{formatPrice(formData.total)} {currencyCode}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SelectField({ label, icon: Icon, value, onChange, options, noEmpty }: {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  value: string | number;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  noEmpty?: boolean;
}) {
  return (
    <div className="space-y-1.5 group">
      <label className="text-[11px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)] ml-1 block">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]">
          <Icon className="h-4 w-4" />
        </div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-h-[44px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] font-bold text-sm pl-10 pr-10 py-3 outline-none focus:border-primary/50 cursor-pointer"
        >
          {!noEmpty && <option value="">—</option>}
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    </div>
  );
}
