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
  tax_amount: number;
  total: number;
  created_at: string;
  updated_at: string;
}

// Input type for creating/updating invoice items (no id, invoice_id, timestamps)
export interface InvoiceItemInput {
  article_id?: number | null;
  name: string;
  description?: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
}

export type StatusColor = 'green' | 'gray' | 'red' | 'amber' | 'blue';

export interface Invoice {
  id: number;
  invoice_number: string;
  company_id: number;
  client_id: number;
  client: import("./client").Client;
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

  // Source
  source_type: string | null;
  source_id: number | null;

  // Currency & Template
  currency: string;
  invoice_template: string;
  invoice_template_label: string;

  // Fiscal
  is_fiscalized: boolean;
  fiscal_invoice_number: string | null;
  fiscal_counter: number | null;
  fiscal_verification_url: string | null;
  fiscalized_at: string | null;

  // Totals
  subtotal: number;
  tax_total: number;
  discount_total: number;
  total: number;

  items: InvoiceItem[];
  created_at: string;
  updated_at: string;
}

// Input type for creating/updating invoices
export interface InvoiceInput {
  invoice_number?: string;
  client_id: number;
  status?: string;
  language?: string;
  date: string;
  due_date: string;
  notes?: string | null;
  is_recurring?: boolean;
  frequency?: string | null;
  next_invoice_date?: string | null;
  currency: string;
  invoice_template?: string;
  subtotal: number;
  tax_total: number;
  discount_total: number;
  total: number;
  items: InvoiceItemInput[];
}

export type InvoicesResponse = PaginatedResponse<Invoice>;

