export interface Client {
    id: number;
    company_id: number
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    zip: string;
    country: string;
    tax_id: string;
    vat_id: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}