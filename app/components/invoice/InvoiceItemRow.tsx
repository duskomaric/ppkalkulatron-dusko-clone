import React from "react";
import { TrashIcon } from "~/components/ui/icons";
import { SearchSelect } from "~/components/ui/SearchSelect";
import { CurrencyInput } from "~/components/ui/CurrencyInput";
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

    // Get article price for current currency (convert to cents)
    const getArticlePrice = (article: Article): number => {
        if (!article.prices_meta) return 0;
        const price = article.prices_meta[currency];
        // API returns float (e.g., 100.50), we need cents (10050)
        return price ? Math.round(price * 100) : 0;
    };

    // Handle article selection
    const handleArticleChange = (article: Article | null) => {
        if (article) {
            const unitPrice = getArticlePrice(article);
            const subtotal = item.quantity * unitPrice;
            const taxAmount = Math.round(subtotal * (item.tax_rate / 100));
            const total = subtotal + taxAmount;

            onChange(index, {
                ...item,
                article_id: article.id,
                name: article.name,
                description: article.description || null,
                unit_price: unitPrice,
                // Keep existing tax_rate (don't override from article)
                subtotal,
                tax_amount: taxAmount,
                total
            });
        } else {
            onChange(index, {
                ...item,
                article_id: null,
                name: "",
                description: null,
                unit_price: 0,
                subtotal: 0,
                tax_amount: 0,
                total: 0
            });
        }
    };

    // Handle quantity change
    const handleQuantityChange = (qty: number) => {
        const subtotal = qty * item.unit_price;
        const taxAmount = Math.round(subtotal * (item.tax_rate / 100));
        const total = subtotal + taxAmount;

        onChange(index, {
            ...item,
            quantity: qty,
            subtotal,
            tax_amount: taxAmount,
            total
        });
    };

    // Handle unit price change
    const handleUnitPriceChange = (price: number) => {
        const subtotal = item.quantity * price;
        const taxAmount = Math.round(subtotal * (item.tax_rate / 100));
        const total = subtotal + taxAmount;

        onChange(index, {
            ...item,
            unit_price: price,
            subtotal,
            tax_amount: taxAmount,
            total
        });
    };

    // Handle tax rate change
    const handleTaxRateChange = (rate: number) => {
        const taxAmount = Math.round(item.subtotal * (rate / 100));
        const total = item.subtotal + taxAmount;

        onChange(index, {
            ...item,
            tax_rate: rate,
            tax_amount: taxAmount,
            total
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
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 space-y-3">
            {/* Row Header with Remove */}
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-dim)]">
                    Stavka #{index + 1}
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

            {/* Article Select */}
            <SearchSelect
                items={articles}
                value={selectedArticle}
                onChange={handleArticleChange}
                getKey={(a) => a.id}
                getLabel={(a) => a.name}
                getSearchText={(a) => `${a.name} ${a.description || ""}`}
                renderItem={(a, isSelected) => (
                    <div className="flex flex-col gap-0.5">
                        <span className={`text-sm font-bold ${isSelected ? "text-primary" : ""}`}>{a.name}</span>
                        {a.description && (
                            <span className="text-[10px] text-[var(--color-text-dim)] truncate">{a.description}</span>
                        )}
                        <span className="text-[10px] font-bold text-primary">
                            {formatPrice(getArticlePrice(a))} {currency}
                        </span>
                    </div>
                )}
                placeholder="Odaberi artikal..."
                disabled={disabled}
            />

            {/* Количество и цена */}
            <div className="grid grid-cols-2 gap-3">
                {/* Quantity */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)] ml-1 block">
                        Količina
                    </label>
                    <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(Math.max(1, parseInt(e.target.value) || 1))}
                        disabled={disabled}
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] font-bold text-sm px-4 py-2.5 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                </div>

                {/* Unit Price - ATM style input */}
                <CurrencyInput
                    label={`Jed. cijena`}
                    value={item.unit_price}
                    onChange={handleUnitPriceChange}
                    currency={currency}
                    disabled={disabled}
                />
            </div>

            {/* Tax Rate */}
            <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)] ml-1 block">
                    PDV (%)
                </label>
                <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={item.tax_rate}
                    onChange={(e) => handleTaxRateChange(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                    disabled={disabled}
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] font-bold text-sm px-4 py-2.5 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                />
            </div>

            {/* Totals */}
            <div className="pt-2 border-t border-[var(--color-border)] flex justify-between items-center">
                <div className="flex gap-4 text-[10px] text-[var(--color-text-dim)]">
                    <span>Osnovica: <strong className="text-[var(--color-text-main)]">{formatPrice(item.subtotal)}</strong></span>
                    <span>PDV: <strong className="text-[var(--color-text-main)]">{formatPrice(item.tax_amount)}</strong></span>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)]">Ukupno</span>
                    <p className="text-lg font-black text-primary tracking-tighter italic">
                        {formatPrice(item.total)} {currency}
                    </p>
                </div>
            </div>
        </div>
    );
}
