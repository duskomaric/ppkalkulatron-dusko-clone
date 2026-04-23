import type { ComponentType, SVGProps } from "react";
import { formatPrice } from "~/utils/format";
import {
  HashIcon,
  ContactRoundIcon,
  Calendar1Icon,
  Clock1Icon,
  FileTextIcon,
} from "~/components/ui/icons";
import { EntityCard } from "~/components/ui/EntityCard";
import { StatusBadge, type BadgeColor } from "~/components/ui/StatusBadge";
import { ListHeader } from "~/components/ui/ListHeader";
import { MetaItem } from "~/components/ui/MetaItem";

interface DocumentListItem {
  id: number;
  date: string;
  total: number;
  currency?: string | null;
  status_label: string;
  status_color: string;
  client?: { name: string } | null;
}

interface DocumentListViewProps<T extends DocumentListItem> {
  items: T[];
  onRowClick: (item: T) => void;
  getNumber: (item: T) => string;
  getSecondaryDate: (item: T) => string | null;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  headerLabel: string;
  secondaryDateLabel: string;
  /** Optional label for document source (e.g. "Iz ponude: PON-001"). Prikazuje se kao red s ikonom, kao Storno od. */
  getSourceLabel?: (item: T) => string | null;
  /** Ikona za red izvora (npr. FileSlidersIcon za ponudu, FileCheckIcon za predračun). */
  getSourceIcon?: (item: T) => ComponentType<SVGProps<SVGSVGElement>> | null;
}

export function DocumentListView<T extends DocumentListItem>({
  items,
  onRowClick,
  getNumber,
  getSecondaryDate,
  icon: Icon,
  headerLabel,
  secondaryDateLabel,
  getSourceLabel,
  getSourceIcon,
}: DocumentListViewProps<T>) {
  return (
    <>
      {/* Mobile: cards */}
      <div className="md:hidden space-y-3">
        {items.map((item) => (
          <EntityCard key={item.id} onClick={() => onRowClick(item)}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <HashIcon className="w-3 h-3 text-primary" />
                <span className="text-base font-black text-[var(--color-text-main)] tracking-tighter italic leading-none group-hover:text-primary transition-colors">
                  {getNumber(item)}
                </span>
              </div>
              <StatusBadge label={item.status_label} color={(item.status_color as BadgeColor) || "gray"} />
            </div>
            <div className="flex items-center gap-2">
              <ContactRoundIcon className="w-3.5 h-3.5 text-[var(--color-text-dim)]" />
              <span className="text-xs font-bold text-[var(--color-text-muted)] tracking-tight truncate">
                {item.client?.name || "Nepoznat klijent"}
              </span>
            </div>
            {getSourceLabel?.(item) && (() => {
              const SourceIcon = getSourceIcon?.(item) ?? FileTextIcon;
              return (
                <div className="flex items-center gap-2">
                  <SourceIcon className="w-3 h-3 text-[var(--color-text-dim)]" />
                  <span className="text-[10px] font-bold text-[var(--color-text-dim)] tracking-tight truncate">
                    {getSourceLabel(item)}
                  </span>
                </div>
              );
            })()}
            <div className="h-[1px] w-full bg-[var(--color-border)]" />
            <div className="flex justify-between items-end">
              <div className="flex gap-4">
                <MetaItem icon={Calendar1Icon} label="Datum" value={item.date} />
                <MetaItem icon={Clock1Icon} label={secondaryDateLabel} value={getSecondaryDate(item) || "—"} />
              </div>
              <p className="text-lg font-black text-[var(--color-text-main)] tracking-tighter italic">
                {formatPrice(item.total)} {item.currency || "BAM"}
              </p>
            </div>
          </EntityCard>
        ))}
      </div>

      {/* Desktop: header */}
      <ListHeader
        grid="grid-cols-[minmax(0,1.6fr)_0.6fr_0.7fr_0.7fr_0.7fr]"
        columns={[
          { label: headerLabel },
          { label: "Status" },
          { label: "Datum" },
          { label: secondaryDateLabel },
          { label: "Ukupno", align: "right" },
        ]}
      />

      {/* Desktop: list */}
      <div className="hidden md:block space-y-3">
        {items.map((item) => (
          <EntityCard key={item.id} onClick={() => onRowClick(item)}>
            <div className="grid grid-cols-[minmax(0,1.6fr)_0.6fr_0.7fr_0.7fr_0.7fr] gap-3 items-center">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <HashIcon className="w-3 h-3 text-primary" />
                    <span className="text-sm font-black text-[var(--color-text-main)] tracking-tighter italic leading-none truncate">
                      {getNumber(item)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs font-bold text-[var(--color-text-muted)] min-w-0">
                    <ContactRoundIcon className="w-3.5 h-3.5 text-[var(--color-text-dim)] shrink-0" />
                    <span className="truncate">{item.client?.name || "Nepoznat klijent"}</span>
                  </div>
                  {getSourceLabel?.(item) && (() => {
                    const SourceIcon = getSourceIcon?.(item) ?? FileTextIcon;
                    return (
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-[var(--color-text-dim)] min-w-0">
                        <SourceIcon className="w-3 h-3 shrink-0 text-[var(--color-text-dim)]" />
                        <span className="truncate">{getSourceLabel(item)}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <StatusBadge label={item.status_label} color={(item.status_color as BadgeColor) || "gray"} />
              <div className="flex items-center gap-1 text-xs font-bold text-[var(--color-text-muted)]">
                <Calendar1Icon className="w-3 h-3 text-[var(--color-text-dim)]" />
                <span>{item.date}</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-[var(--color-text-muted)]">
                <Clock1Icon className="w-3 h-3 text-[var(--color-text-dim)]" />
                <span>{getSecondaryDate(item) || "—"}</span>
              </div>
              <p className="text-right text-lg font-black text-[var(--color-text-main)] tracking-tighter italic">
                {formatPrice(item.total)} {item.currency || "BAM"}
              </p>
            </div>
          </EntityCard>
        ))}
      </div>
    </>
  );
}
