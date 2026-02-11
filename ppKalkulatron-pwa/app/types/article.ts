import type { PaginatedResponse } from "./api";

export type ArticleType = "goods" | "services" | "products";

interface ArticleTaxRate {
    label: string;
    rate: number;
}

export interface Article {
    id: number;
    company_id: number;
    name: string;
    description: string | null;
    unit: string;
    tax_rate: ArticleTaxRate | null;
    is_active: boolean;
    type: ArticleType;
    type_label: string;
    type_color: string;
    prices_meta: Record<string, number | null> | null;
    created_at: string;
    updated_at: string;
}

// Input type for create/update (tax_rate is label from config)
export interface ArticleInput {
    name?: string;
    description?: string | null;
    unit?: string;
    tax_rate?: string | null;
    is_active?: boolean;
    type?: ArticleType;
    prices_meta?: Record<string, number | null> | null;
}

export type ArticlesResponse = PaginatedResponse<Article>;
