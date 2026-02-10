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
    default_invoice_notes: string | null;
    invoice_numbering_reset_yearly: boolean;
    invoice_numbering_pad_zeros: number;
    invoice_numbering_starting_number: number;
    invoice_numbering_prefix: string | null;

    // OFS fiskalizacija
    ofs_base_url: string | null;
    ofs_api_key: string | null;
    ofs_serial_number: string | null;
    ofs_pac: string | null;
    ofs_receipt_layout: string | null;
    ofs_receipt_image_format: string | null;
    ofs_render_receipt_image: boolean;
    ofs_receipt_header_text_lines: string[] | null;
    ofs_device_mode: string | null;
    ofs_default_payment_type: string | null;

    // Mail - ako nije podešeno, koristi se default iz .env
    mail_from_address: string | null;
    mail_from_name: string | null;
    // SMTP - slanje iz vlastitog inboxa
    mail_host: string | null;
    mail_port: number | null;
    mail_username: string | null;
    mail_password: string | null;
    mail_encryption: string | null; // tls | ssl | null
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

export interface AppConfigData {
    user: import("./user").User;
    company_settings: CompanySettings;
    languages: SelectOption[];
    frequencies: SelectOption[];
    templates: SelectOption[];
    payment_types: SelectOption[];
    article_types: SelectOption[];
    units: SelectOption[];
    tax_rates: TaxRateOption[];
}

interface TaxRateOption {
    value: string;
    label: string;
    rate: number;
}

export interface AppConfigResponse {
    data: AppConfigData;
}

export interface CurrenciesResponse {
    data: Currency[];
    meta: import("./api").PaginationMeta;
}
