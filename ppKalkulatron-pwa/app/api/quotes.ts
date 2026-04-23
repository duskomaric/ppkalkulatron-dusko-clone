import { API_URL } from "~/config/constants";
import { fetchApi } from "~/utils/api";
import type { Quote, QuotesResponse, QuoteInput } from "~/types/quote";
import type { Proforma } from "~/types/proforma";

export interface QuoteFilters {
    search?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    /** When no date_from/date_to, backend uses this year (01.01–31.12). */
    year?: number;
}

export async function getQuotes(
    companySlug: string,
    token: string,
    page: number = 1,
    filters?: QuoteFilters
): Promise<QuotesResponse> {
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (filters?.search) params.set("search", filters.search);
    if (filters?.status) params.set("status", filters.status);
    if (filters?.date_from) params.set("date_from", filters.date_from);
    if (filters?.date_to) params.set("date_to", filters.date_to);
    if (filters?.year != null && !filters?.date_from && !filters?.date_to) params.set("year", String(filters.year));
    return fetchApi<QuotesResponse>(`/${companySlug}/quotes?${params.toString()}`, { token });
}

export async function getQuote(
    companySlug: string,
    quoteId: number,
    token: string
): Promise<{ data: Quote }> {
    return fetchApi<{ data: Quote }>(`/${companySlug}/quotes/${quoteId}`, { token });
}

export async function createQuote(
    companySlug: string,
    token: string,
    quoteData: QuoteInput
): Promise<{ data: Quote }> {
    return fetchApi<{ data: Quote }>(`/${companySlug}/quotes`, {
        method: "POST",
        token,
        body: JSON.stringify(quoteData),
    });
}

export async function updateQuote(
    companySlug: string,
    quoteId: number,
    token: string,
    quoteData: QuoteInput
): Promise<{ data: Quote }> {
    return fetchApi<{ data: Quote }>(`/${companySlug}/quotes/${quoteId}`, {
        method: "PUT",
        token,
        body: JSON.stringify(quoteData),
    });
}

export async function deleteQuote(
    companySlug: string,
    quoteId: number,
    token: string
): Promise<{ message: string }> {
    return fetchApi<{ message: string }>(`/${companySlug}/quotes/${quoteId}`, {
        method: "DELETE",
        token,
    });
}

/** Pretvori ponudu u predračun. Vraća kreirani predračun. */
export async function convertQuoteToProforma(
    companySlug: string,
    quoteId: number,
    token: string
): Promise<{ data: Proforma }> {
    return fetchApi<{ data: Proforma }>(`/${companySlug}/quotes/${quoteId}/convert-to-proforma`, {
        method: "POST",
        token,
    });
}

export async function downloadQuotePdf(
    companySlug: string,
    quoteId: number,
    quoteNumber: string,
    token: string
): Promise<void> {
    const url = `${API_URL}/${companySlug}/quotes/${quoteId}/pdf`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Greška pri preuzimanju PDF-a");
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `ponuda-${quoteNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(blobUrl);
}

export interface SendQuoteEmailInput {
    to: string;
    subject: string;
    body: string;
    attach_pdf?: boolean;
}

export async function sendQuoteEmail(
    companySlug: string,
    quoteId: number,
    token: string,
    data: SendQuoteEmailInput
): Promise<{ success: boolean; message: string }> {
    return fetchApi(`/${companySlug}/quotes/${quoteId}/send-email`, {
        method: "POST",
        token,
        body: JSON.stringify(data),
    });
}
