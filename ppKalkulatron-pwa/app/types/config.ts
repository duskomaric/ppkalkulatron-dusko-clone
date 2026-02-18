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
    default_document_template: string | null;
    default_document_due_days: number | null;
    default_document_language: string | null;
    default_document_notes: string | null;
    default_invoice_notes: string | null;
    default_proforma_notes: string | null;
    default_quote_notes: string | null;
    document_numbering_reset_yearly: boolean;
    document_numbering_pad_zeros: number;
    document_numbering_starting_number: number;
    invoice_numbering_starting_number: number;
    quote_numbering_starting_number: number;
    proforma_numbering_starting_number: number;
    document_numbering_prefix: string | null;
    invoice_numbering_prefix: string | null;
    quote_numbering_prefix: string | null;
    proforma_numbering_prefix: string | null;

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
