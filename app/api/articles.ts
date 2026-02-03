import { fetchApi } from "~/utils/api";
import type { Article, ArticlesResponse } from "~/types/article";

export async function getArticles(
    companySlug: string,
    token: string,
    page: number = 1
): Promise<ArticlesResponse> {
    return fetchApi<ArticlesResponse>(`/${companySlug}/articles?page=${page}`, { token });
}

export async function getArticle(
    companySlug: string,
    articleId: number,
    token: string
): Promise<{ data: Article }> {
    return fetchApi<{ data: Article }>(`/${companySlug}/articles/${articleId}`, { token });
}

export async function createArticle(
    companySlug: string,
    token: string,
    articleData: Partial<Article>
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
    articleData: Partial<Article>
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
