import type { PaginatedResponse } from "./api";

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  article_id: number;
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

export type StatusColor = 'green' | 'gray' | 'red';

export interface Invoice {
  id: number;
  invoice_number: string;
  company_id: number;
  client_id: number;
  status: string;
  status_color: StatusColor;
  status_label: string;
  language: string;
  language_label: string;
  date: string;
  due_date: string;
  notes: string | null;
  currency: string;
  subtotal: number;
  tax_total: number;
  discount_total: number;
  total: number;
  items: InvoiceItem[];
  created_at: string;
  updated_at: string;
}

export type InvoicesResponse = PaginatedResponse<Invoice>;
