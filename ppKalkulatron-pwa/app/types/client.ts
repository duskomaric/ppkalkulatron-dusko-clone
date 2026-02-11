import type { PaginatedResponse } from "./api";

export interface Client {
  id: number;
  company_id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  country: string | null;
  tax_id: string | null;
  vat_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ClientsResponse = PaginatedResponse<Client>;
