export interface Role {
  value: string;
  label: string;
  color: string;
}

export interface UserSummary {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: Role;
  is_active: boolean;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
  companies: import("./company").Company[];
}
