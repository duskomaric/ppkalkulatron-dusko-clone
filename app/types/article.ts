import type { PaginatedResponse } from "./api";

export type ArticleType = "goods" | "services" | "products";

export interface Article {
    id: number;
    company_id: number;
    name: string;
    description: string | null;
    unit: string;
    tax_category: string;
    is_active: boolean;
    type: ArticleType;
    type_label: string;
    type_color: string;
    prices_meta: Record<string, number | null> | null;
    created_at: string;
    updated_at: string;
}

export type ArticlesResponse = PaginatedResponse<Article>;
