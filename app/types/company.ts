import type { UserSummary } from "./user";

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
  subscription_ends_at: string;
  created_at: string;
  updated_at: string;
  users?: UserSummary[];
}
