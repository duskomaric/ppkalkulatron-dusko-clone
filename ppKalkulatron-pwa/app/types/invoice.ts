import type { PaginatedResponse } from "./api";

export interface InvoiceItem {
    id: number;
    invoice_id: number;
    article_id: number | null;
    name: string;
    description: string | null;
    quantity: number;
    unit_price: number;
    subtotal: number;
    tax_rate: number;
    tax_label: string | null;
    tax_amount: number;
    total: number;
    unit_price_bam?: number | null;
    subtotal_bam?: number | null;
    tax_amount_bam?: number | null;
    total_bam?: number | null;
    created_at: string;
    updated_at: string;
    article?: import("./article").Article | null;
}

// Input type for creating/updating invoice items (no id, invoice_id, timestamps)
// tax_rate: basis points (1700 = 17%), tax_label: OFS label (F, N, A, ...)
export interface InvoiceItemInput {
    article_id?: number | null;
    name: string;
    description?: string | null;
    quantity: number;
    unit_price: number;
    subtotal: number;
    tax_rate: number;
    tax_label?: string | null;
    tax_amount: number;
    total: number;
}

import type { StatusColor } from "./api";

/** Jedan fiskalni zapis (original / kopija / refund). fiscalized_at dolazi iz backenda (npr. dd.MM.yyyy HH:mm). */
interface FiscalRecord {
    id: number;
    type: 'original' | 'copy' | 'refund';
    type_label: string;
    fiscal_invoice_number: string | null;
    fiscal_counter: string | null;
    verification_url: string | null;
    fiscalized_at: string | null;
    fiscal_receipt_image_path: string | null;
}

export interface Invoice {
    id: number;
    invoice_number: string;
    company_id: number;
    client_id: number | null;
    client: import("./client").Client | null;
    status: string;
    status_color: StatusColor;
    status_label: string;
    language: string;
    language_label: string;
    date: string;
    due_date: string;
    notes: string | null;

    // Recurring
    is_recurring: boolean;
    frequency: string | null;
    frequency_label: string | null;
    next_invoice_date: string | null;
    parent_id: number | null;
    refund_invoice_id: number | null;
    refund_invoice_number?: string | null;
    original_invoice_id?: number | null;
    original_invoice_number?: string | null;
    original_fiscal_invoice_number?: string | null;
    original_fiscalized_at?: string | null;

    // Source
    source_type: string | null;
    source_id: number | null;
    /** Broj izvornog dokumenta (predračun/ugovor) kada je učitana relacija source */
    source_document_number?: string | null;

    // Currency & Template
    currency: string | null; // From currencyRelation->code
    currency_id: number | null;
    invoice_template: string;
    invoice_template_label: string;
    payment_type?: string;
    payment_type_label?: string;

    // Fiscal (status: created | fiscalized | refund_created | refunded)
    fiscal_invoice_number: string | null;
    fiscal_counter: string | number | null;
    fiscal_verification_url: string | null;
    fiscalized_at: string | null;
    fiscal_meta: Record<string, unknown> | null;
    fiscal_receipt_image_path: string | null;
    fiscal_records?: FiscalRecord[];

    // Totals
    subtotal: number;
    tax_total: number;
    discount_total: number;
    total: number;
    subtotal_bam?: number | null;
    tax_total_bam?: number | null;
    discount_total_bam?: number | null;
    total_bam?: number | null;

    items: InvoiceItem[];
    created_at: string;
    updated_at: string;
}

// Input type for creating/updating invoices
export interface InvoiceInput {
    invoice_number?: string;
    client_id: number | null;
    status?: string;
    language?: string;
    date: string;
    due_date: string;
    notes?: string | null;
    is_recurring: boolean;
    frequency?: string | null;
    next_invoice_date?: string | null;
    currency_id?: number | null;
    invoice_template?: string;
    payment_type?: string;
    subtotal: number;
    tax_total: number;
    discount_total: number;
    total: number;
    /** BAM equivalents (from API when editing); shown in parentheses when currency !== BAM */
    subtotal_bam?: number | null;
    tax_total_bam?: number | null;
    total_bam?: number | null;
    items: InvoiceItemInput[];
}

export type InvoicesResponse = PaginatedResponse<Invoice>;
