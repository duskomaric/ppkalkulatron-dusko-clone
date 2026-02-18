import type { PaginatedResponse } from "./api";
import type { Client } from "./client";
import type { InvoiceItemInput } from "./invoice";

interface QuoteItem {
    id: number;
    quote_id: number;
    article_id: number | null;
    name: string;
    description: string | null;
    quantity: number;
    unit_price: number;
    subtotal: number;
    tax_rate: number;
    tax_amount: number;
    total: number;
    created_at: string;
    updated_at: string;
}

type StatusColor = 'green' | 'gray' | 'red' | 'amber' | 'blue';

export interface Quote {
    id: number;
    quote_number: string;
    company_id: number;
    client_id: number;
    client: Client | null;
    status: string;
    status_color: StatusColor;
    status_label: string;
    language: string;
    language_label: string;
    date: string;
    valid_until: string | null;
    notes: string | null;
    currency: string;
    currency_id: number | null;
    currency_relation?: { id: number; code: string; name: string; symbol: string } | null;
    bank_account_id: number | null;
    bank_account?: { id: number; bank_name: string; account_number: string } | null;
    quote_template: string;
    quote_template_label: string;
    subtotal: number;
    tax_total: number;
    discount_total: number;
    total: number;
    items: QuoteItem[];
    created_at: string;
    updated_at: string;
}

export interface QuoteInput {
    quote_number?: string;
    client_id: number;
    status?: string;
    language?: string;
    date: string;
    valid_until?: string | null;
    notes?: string | null;
    currency_id?: number | null;
    bank_account_id?: number | null;
    quote_template?: string;
    subtotal: number;
    tax_total: number;
    discount_total: number;
    total: number;
    items: InvoiceItemInput[];
}

export type QuotesResponse = PaginatedResponse<Quote>;
