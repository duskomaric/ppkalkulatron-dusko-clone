import { fetchApi } from "~/utils/api";
import type {
    IncomeBookAllocationInput,
    IncomeBookAllocationResponse,
    IncomeBookEntriesResponse,
    IncomeBookEntry,
    IncomeBookEntryInput,
} from "~/types/incomeBookEntry";

export interface IncomeBookEntryFilters {
    year?: number;
    start_date?: string;
    end_date?: string;
    search?: string;
}

export async function getIncomeBookEntries(
    companySlug: string,
    token: string,
    page: number = 1,
    filters?: IncomeBookEntryFilters
): Promise<IncomeBookEntriesResponse> {
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (filters?.year) params.set("year", String(filters.year));
    if (filters?.start_date) params.set("start_date", filters.start_date);
    if (filters?.end_date) params.set("end_date", filters.end_date);
    if (filters?.search) params.set("search", filters.search);

    return fetchApi<IncomeBookEntriesResponse>(`/${companySlug}/income-book-entries?${params.toString()}`, { token });
}

export async function createIncomeBookEntry(
    companySlug: string,
    token: string,
    entryData: IncomeBookEntryInput
): Promise<{ data: IncomeBookEntry }> {
    return fetchApi<{ data: IncomeBookEntry }>(`/${companySlug}/income-book-entries`, {
        method: "POST",
        token,
        body: JSON.stringify(entryData),
    });
}

export async function updateIncomeBookEntry(
    companySlug: string,
    entryId: number,
    token: string,
    entryData: IncomeBookEntryInput
): Promise<{ data: IncomeBookEntry }> {
    return fetchApi<{ data: IncomeBookEntry }>(`/${companySlug}/income-book-entries/${entryId}`, {
        method: "PUT",
        token,
        body: JSON.stringify(entryData),
    });
}

export async function calculateIncomeBookEntryAllocation(
    companySlug: string,
    token: string,
    payload: IncomeBookAllocationInput
): Promise<IncomeBookAllocationResponse> {
    return fetchApi<IncomeBookAllocationResponse>(`/${companySlug}/income-book-entries/calculate-allocation`, {
        method: "POST",
        token,
        body: JSON.stringify(payload),
    });
}

export async function deleteIncomeBookEntry(
    companySlug: string,
    entryId: number,
    token: string
): Promise<{ message: string }> {
    return fetchApi<{ message: string }>(`/${companySlug}/income-book-entries/${entryId}`, {
        method: "DELETE",
        token,
    });
}

export async function downloadIncomeBookPdf(
    companySlug: string,
    token: string,
    filters?: IncomeBookEntryFilters
): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters?.start_date) params.set("start_date", filters.start_date);
    if (filters?.end_date) params.set("end_date", filters.end_date);

    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost/api/v1";

    const response = await fetch(`${baseUrl}/${companySlug}/income-book-entries/pdf?${params.toString()}`, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/pdf"
        }
    });

    if (!response.ok) {
        throw new Error("Failed to download PDF");
    }

    return await response.blob();
}
