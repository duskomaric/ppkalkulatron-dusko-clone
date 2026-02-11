import { fetchApi } from "~/utils/api";
import type { Article, ArticlesResponse, ArticleInput } from "~/types/article";

export interface ArticleFilters {
    search?: string;
    status?: string;
    type?: string;
    tax_rate?: string;
}

export async function getArticles(
    companySlug: string,
    token: string,
    page: number = 1,
    filters?: ArticleFilters
): Promise<ArticlesResponse> {
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (filters?.search) params.set("search", filters.search);
    if (filters?.status) params.set("status", filters.status);
    if (filters?.type) params.set("type", filters.type);
    if (filters?.tax_rate) params.set("tax_rate", filters.tax_rate);
    return fetchApi<ArticlesResponse>(`/${companySlug}/articles?${params.toString()}`, { token });
}

export async function createArticle(
    companySlug: string,
    token: string,
    articleData: ArticleInput
): Promise<{ data: Article }> {
    return fetchApi<{ data: Article }>(`/${companySlug}/articles`, {
        method: "POST",
        token,
        body: JSON.stringify(articleData),
    });
}

export async function updateArticle(
    companySlug: string,
    articleId: number,
    token: string,
    articleData: ArticleInput
): Promise<{ data: Article }> {
    return fetchApi<{ data: Article }>(`/${companySlug}/articles/${articleId}`, {
        method: "PUT",
        token,
        body: JSON.stringify(articleData),
    });
}

export async function deleteArticle(
    companySlug: string,
    articleId: number,
    token: string
): Promise<{ message: string }> {
    return fetchApi<{ message: string }>(`/${companySlug}/articles/${articleId}`, {
        method: "DELETE",
        token,
    });
}
