import { useState, useEffect } from "react";
import { TrashIcon, BoxesIcon, CurrencyEuroIcon } from "~/components/ui/icons";
import { SearchSelect } from "~/components/ui/SearchSelect";
import { CurrencyInput } from "./CurrencyInput";
import type { Article } from "~/types/article";
import type { InvoiceItemInput } from "~/types/invoice";

interface InvoiceItemRowProps {
    item: InvoiceItemInput;
    index: number;
    articles: Article[];
    currency: string;
    onChange: (index: number, item: InvoiceItemInput) => void;
    onRemove: (index: number) => void;
    disabled?: boolean;
}

export function InvoiceItemRow({
    item,
    index,
    articles,
    currency,
    onChange,
    onRemove,
    disabled
}: InvoiceItemRowProps) {
    // Find selected article
    const selectedArticle = item.article_id
        ? articles.find(a => a.id === item.article_id) || null
        : null;

    // prices_meta = iznos SA porezom (inclusive) - ono što kupac plaća
    const getArticlePriceCents = (article: Article): number => {
        if (!article.prices_meta) return 0;
        const price = article.prices_meta[currency];
        return price ? Math.round(price * 100) : 0;
    };

    // Iz inclusive cijene izračunaj osnovicu i porez
    const inclusiveToBaseAndTax = (inclusiveCents: number, rateBasisPoints: number) => {
        const rate = rateBasisPoints / 10000;
        const base = Math.round(inclusiveCents / (1 + rate));
        const tax = inclusiveCents - base;
        return { base, tax };
    };

    const handleArticleChange = (article: Article | null) => {
        if (article) {
            const unitPriceInclusive = getArticlePriceCents(article);
            const rateBasisPoints = article.tax_rate ? Math.round(article.tax_rate.rate * 100) : 1100;
            const totalInclusive = item.quantity * unitPriceInclusive;
            const { base: subtotal, tax: taxAmount } = inclusiveToBaseAndTax(totalInclusive, rateBasisPoints);

            onChange(index, {
                ...item,
                article_id: article.id,
                name: article.name,
                description: article.description || null,
                unit_price: unitPriceInclusive,
                tax_rate: rateBasisPoints,
                tax_label: article.tax_rate?.label ?? "A",
                subtotal,
                tax_amount: taxAmount,
                total: totalInclusive
            });
        } else {
            onChange(index, {
                ...item,
                article_id: null,
                name: "",
                description: null,
                unit_price: 0,
                subtotal: 0,
                tax_rate: 1700,
                tax_label: "A",
                tax_amount: 0,
                total: 0
            });
        }
    };

    const handleQuantityChange = (qty: number) => {
        const totalInclusive = qty * item.unit_price;
        const { base: subtotal, tax: taxAmount } = inclusiveToBaseAndTax(totalInclusive, item.tax_rate);

        onChange(index, {
            ...item,
            quantity: qty,
            subtotal,
            tax_amount: taxAmount,
            total: totalInclusive
        });
    };

    // Lokalni string za količinu da se može normalno editirati (brisati, mijenjati) bez skakanja na 1
    const [quantityFocused, setQuantityFocused] = useState(false);
    const [quantityStr, setQuantityStr] = useState(() => String(item.quantity));

    useEffect(() => {
        if (!quantityFocused) setQuantityStr(String(item.quantity));
    }, [item.quantity, quantityFocused]);

    const handleQuantityBlur = () => {
        setQuantityFocused(false);
        const parsed = parseInt(quantityStr, 10);
        const qty = Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
        if (qty !== item.quantity) handleQuantityChange(qty);
        setQuantityStr(String(qty));
    };

    // Jed. cijena = cijena SA porezom (inclusive) - ono što kupac plaća
    const handleUnitPriceChange = (unitPriceInclusiveCents: number) => {
        const totalInclusive = item.quantity * unitPriceInclusiveCents;
        const { base: subtotal, tax: taxAmount } = inclusiveToBaseAndTax(totalInclusive, item.tax_rate);

        onChange(index, {
            ...item,
            unit_price: unitPriceInclusiveCents,
            subtotal,
            tax_amount: taxAmount,
            total: totalInclusive
        });
    };

    // Format price for display
    const formatPrice = (amount: number): string => {
        return new Intl.NumberFormat('de-DE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount / 100);
    };

    return (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-3 space-y-2">
            {/* Row Header with Remove */}
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-dim)]">
                    #{index + 1}
                </span>
                <button
                    type="button"
                    onClick={() => onRemove(index)}
                    disabled={disabled}
                    className="h-7 w-7 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                >
                    <TrashIcon className="h-3.5 w-3.5" />
                </button>
            </div>

            {/* Article + quantity + unit price - compact */}
            <div className="flex flex-col md:flex-row md:items-end gap-2">
                <div className="flex-1 min-w-0">
                    <SearchSelect
                        items={articles}
                        value={selectedArticle}
                        onChange={handleArticleChange}
                        getKey={(a) => a.id}
                        getLabel={(a) => a.name}
                        getSearchText={(a) => `${a.name} ${a.description || ""}`}
                        icon={BoxesIcon}
                        renderValue={(a) => (
                            <div className="flex flex-col gap-0.5 min-w-0">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="font-bold truncate">{a.name}</span>
                                    {a.tax_rate && (
                                        <span className="inline-flex px-2 py-0.5 rounded-md bg-primary/15 text-primary text-[9px] font-black uppercase tracking-wider shrink-0">
                                            PDV {a.tax_rate.label} ({a.tax_rate.rate}%)
                                        </span>
                                    )}
                                </div>
                                {a.description && (
                                    <span className="text-[10px] text-[var(--color-text-dim)] truncate">{a.description}</span>
                                )}
                            </div>
                        )}
                        renderItem={(a, isSelected) => (
                            <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-sm font-bold ${isSelected ? "text-primary" : ""}`}>{a.name}</span>
                                    {a.tax_rate && (
                                        <span className="inline-flex px-2 py-0.5 rounded-md bg-primary/15 text-primary text-[10px] font-black uppercase tracking-wider shrink-0">
                                            PDV {a.tax_rate.label} ({a.tax_rate.rate}%)
                                        </span>
                                    )}
                                </div>
                                {a.description && (
                                    <span className="text-[10px] text-[var(--color-text-dim)] truncate">{a.description}</span>
                                )}
                                <div className="flex gap-2 text-[10px]">
                                    <span className="font-bold text-primary">
                                        {formatPrice(getArticlePriceCents(a))} {currency}
                                    </span>
                                </div>
                            </div>
                        )}
                        placeholder="Odaberi artikal..."
                        disabled={disabled}
                    />
                </div>

                <div className="flex flex-row gap-2 md:flex-shrink-0 items-end">
                    <div className="w-24 md:w-24 flex flex-col gap-1 group">
                        <label className="text-[11px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)] ml-1 shrink-0">
                            Kol.
                        </label>
                        <div className="relative">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]">
                                <BoxesIcon className="h-3.5 w-3.5" />
                            </div>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={quantityStr}
                                onChange={(e) => setQuantityStr(e.target.value.replace(/\D/g, ""))}
                                onFocus={() => setQuantityFocused(true)}
                                onBlur={handleQuantityBlur}
                                disabled={disabled}
                                className="w-full h-[44px] min-h-[44px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-main)] font-bold text-sm pl-8 pr-2 py-2 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex-1 min-w-[90px] md:min-w-[100px]">
                        <CurrencyInput
                            label="Cijena"
                            icon={CurrencyEuroIcon}
                            value={item.unit_price}
                            onChange={handleUnitPriceChange}
                            currency={currency}
                            disabled={disabled}
                        />
                    </div>
                </div>
            </div>

            {/* Totals - compact */}
            <div className="pt-1.5 border-t border-[var(--color-border)] flex justify-between items-center gap-2">
                <div className="flex gap-2 text-[9px] text-[var(--color-text-dim)] flex-wrap">
                    <span>Osnovica: <strong className="text-[var(--color-text-main)]">{formatPrice(item.subtotal)}</strong></span>
                    <span>PDV: <strong className="text-[var(--color-text-main)]">{formatPrice(item.tax_amount)}</strong></span>
                </div>
                <p className="text-base font-black text-primary tracking-tighter italic shrink-0">
                    {formatPrice(item.total)} {currency}
                </p>
            </div>
        </div>
    );
}
