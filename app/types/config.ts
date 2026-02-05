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

export interface AppConfigData {
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
