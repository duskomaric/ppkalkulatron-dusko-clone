// Config types for form options from /me endpoint

export interface SelectOption {
    value: string;
    label: string;
}

export interface Currency {
    id: number;
    code: string;
    name: string;
    symbol: string;
    is_default: boolean;
}

export interface CompanySettings {
    default_invoice_template: string | null;
    default_invoice_due_days: number | null;
    default_invoice_language: string | null;
    default_invoice_currency: string | null;
    invoice_numbering_reset_yearly: boolean;
    invoice_numbering_pad_zeros: number;
    invoice_numbering_starting_number: number;
    invoice_numbering_prefix: string | null;
    invoice_footer_lines: string[] | null;
}

export interface BankAccountInput {
    company_id: number;
    bank_name: string;
    account_number: string;
    currency: string;
    swift?: string;
    iban?: string;
    is_default: boolean;
}

export interface BankAccount {
    id: number;
    company_id: number;
    bank_name: string;
    account_number: string;
    currency: string;
    swift?: string;
    iban?: string;
    is_default: boolean;
}

export interface CurrencyInput {
    company_id: number;
    code: string;
    name: string;
    symbol: string;
    is_default: boolean;
}

export interface AppConfigData {
    company_settings: CompanySettings;
    languages: SelectOption[];
    frequencies: SelectOption[];
    templates: SelectOption[];
}

export interface AppConfigResponse {
    data: AppConfigData;
}

export interface CurrenciesResponse {
    data: Currency[];
    meta: import("./api").PaginationMeta;
}
