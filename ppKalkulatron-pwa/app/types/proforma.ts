import type { PaginatedResponse } from "./api";
import type { Client } from "./client";
import type { Quote } from "./quote";
import type { InvoiceItemInput } from "./invoice";

interface ProformaItem {
    id: number;
    proforma_id: number;
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

import type { StatusColor } from "./api";

export interface Proforma {
    id: number;
    proforma_number: string;
    company_id: number;
    client_id: number;
    client: Client | null;
    status: string;
    status_color: StatusColor;
    status_label: string;
    language: string;
    language_label: string;
    date: string;
    due_date: string | null;
    notes: string | null;
    source_type: string | null;
    source_id: number | null;
    /** Broj ponude kada je učitana relacija source */
    source_document_number?: string | null;
    source?: Quote | null;
    currency: string;
    currency_id: number | null;
    currency_relation?: { id: number; code: string; name: string; symbol: string } | null;
    proforma_template: string;
    proforma_template_label: string;
    subtotal: number;
    tax_total: number;
    discount_total: number;
    total: number;
    items: ProformaItem[];
    created_at: string;
    updated_at: string;
}

export interface ProformaInput {
    proforma_number?: string;
    client_id: number;
    status?: string;
    language?: string;
    date: string;
    due_date?: string | null;
    notes?: string | null;
    currency_id?: number | null;
    proforma_template?: string;
    subtotal: number;
    tax_total: number;
    discount_total: number;
    total: number;
    items: InvoiceItemInput[];
}

export type ProformasResponse = PaginatedResponse<Proforma>;
