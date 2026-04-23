import type { Currency } from "~/types/config";
import type { InvoiceItemInput } from "~/types/invoice";

const priceFormatter = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format price stored in cents to display string (e.g. 12345 → "123,45"). */
export function formatPrice(amountInCents: number): string {
  return priceFormatter.format(amountInCents / 100);
}

/** Parse backend date (d.m.Y or ISO) to HTML input value (YYYY-MM-DD). */
export function parseDateForInput(dateStr: string | null): string {
  if (!dateStr) return "";
  if (dateStr.includes(".")) {
    const [day, month, year] = dateStr.split(".");
    return `${year}-${month}-${day}`;
  }
  return dateStr.split("T")[0];
}

/** Format date (Y-m-d or ISO) for display as dd.MM.yyyy (e.g. "20.02.2026"). Returns "—" if null/empty. */
export function formatDisplayDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const s = dateStr.split("T")[0];
  const [y, m, d] = s.split("-");
  if (!y || !m || !d) return "—";
  return `${d.padStart(2, "0")}.${m.padStart(2, "0")}.${y}`;
}

/** Default empty document item (tax_rate in basis points: 1700 = 17%). */
export const emptyDocumentItem: InvoiceItemInput = {
  article_id: null,
  name: "",
  description: null,
  quantity: 1,
  unit_price: 0,
  subtotal: 0,
  tax_rate: 1700,
  tax_label: "A",
  tax_amount: 0,
  total: 0,
};

/** Resolve currency code from currency_id, defaulting to BAM. */
export function getCurrencyCode(
  currencyId: number | null | undefined,
  currencies: Currency[]
): string {
  if (!currencyId) return "BAM";
  return currencies.find((c) => c.id === currencyId)?.code || "BAM";
}
