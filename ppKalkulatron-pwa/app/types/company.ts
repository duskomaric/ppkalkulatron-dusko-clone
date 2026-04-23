import type { UserSummary } from "./user";

export type CompanyModuleId =
  | "quotes"
  | "proformas"
  | "invoices"
  | "clients"
  | "articles"
  | "incomes"
  | "expenses"
  | "sales"
  | "purchases"
  | "assets"
  | "balances"
  | "vatreturns";

export interface Company {
  id: number;
  name: string;
  slug: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  identification_number: string;
  vat_number: string;
  is_active: boolean;
  is_small_business: boolean;
  is_vat_obligor: boolean;
  subscription_ends_at: string | null;
  enabled_modules?: CompanyModuleId[] | null;
  company_settings?: import("./config").CompanySettings;
  created_at: string;
  updated_at: string;
  users?: UserSummary[];
}
