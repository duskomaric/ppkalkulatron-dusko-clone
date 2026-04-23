export interface IncomeBookEntry {
    id: number;
    company_id: number;
    entry_number: number;
    booking_date: string; // Y-m-d format
    description: string | null;

    amount_services: number;
    amount_goods: number;
    amount_products: number;
    amount_other_income: number;
    amount_financial_income: number;
    total_amount: number;
    vat_amount: number;

    bank_account_id: number | null;
    payment_date: string | null; // Y-m-d format

    invoice_id: number | null;

    created_at: string;
    updated_at: string;

    // Optional expansive relations passed by controller
    invoice?: {
        id: number;
        invoice_number: string;
        total: number;
        client?: {
            id: number;
            name: string;
        };
    } | null;
    bank_account?: any;
}

export interface IncomeBookEntryInput {
    entry_number?: number; // optional on create; backend assigns
    booking_date: string;
    payment_date: string | null;
    description: string;
    amount_services: number;
    amount_goods: number;
    amount_products: number;
    amount_other_income: number;
    amount_financial_income: number;
    total_amount: number;
    vat_amount: number;
    bank_account_id: number | null;
    invoice_id: number | null;
}

export interface IncomeBookAllocationInput {
    invoice_id: number;
    payment_amount: number;
}

export interface IncomeBookAllocationResponse {
    data: {
        invoice_id: number;
        payment_amount: number;
        amount_services: number;
        amount_goods: number;
        amount_products: number;
        amount_other_income: number;
        amount_financial_income: number;
        total_amount: number;
        vat_amount: number;
    };
}

export interface IncomeBookEntriesResponse {
    data: IncomeBookEntry[];
}
