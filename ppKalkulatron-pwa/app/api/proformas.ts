import { API_URL } from "~/config/constants";
import { fetchApi } from "~/utils/api";
import type { Proforma, ProformasResponse, ProformaInput } from "~/types/proforma";
import type { Invoice } from "~/types/invoice";

export interface ProformaFilters {
    search?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    /** When no date_from/date_to, backend uses this year (01.01–31.12). */
    year?: number;
}

export async function getProformas(
    companySlug: string,
    token: string,
    page: number = 1,
    filters?: ProformaFilters
): Promise<ProformasResponse> {
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (filters?.search) params.set("search", filters.search);
    if (filters?.status) params.set("status", filters.status);
    if (filters?.date_from) params.set("date_from", filters.date_from);
    if (filters?.date_to) params.set("date_to", filters.date_to);
    if (filters?.year != null && !filters?.date_from && !filters?.date_to) params.set("year", String(filters.year));
    return fetchApi<ProformasResponse>(`/${companySlug}/proformas?${params.toString()}`, { token });
}

export async function getProforma(
    companySlug: string,
    proformaId: number,
    token: string
): Promise<{ data: Proforma }> {
    return fetchApi<{ data: Proforma }>(`/${companySlug}/proformas/${proformaId}`, { token });
}

export async function createProforma(
    companySlug: string,
    token: string,
    proformaData: ProformaInput
): Promise<{ data: Proforma }> {
    return fetchApi<{ data: Proforma }>(`/${companySlug}/proformas`, {
        method: "POST",
        token,
        body: JSON.stringify(proformaData),
    });
}

export async function updateProforma(
    companySlug: string,
    proformaId: number,
    token: string,
    proformaData: ProformaInput
): Promise<{ data: Proforma }> {
    return fetchApi<{ data: Proforma }>(`/${companySlug}/proformas/${proformaId}`, {
        method: "PUT",
        token,
        body: JSON.stringify(proformaData),
    });
}

export async function deleteProforma(
    companySlug: string,
    proformaId: number,
    token: string
): Promise<{ message: string }> {
    return fetchApi<{ message: string }>(`/${companySlug}/proformas/${proformaId}`, {
        method: "DELETE",
        token,
    });
}

/** Pretvori predračun u račun. Vraća kreirani račun. */
export async function convertProformaToInvoice(
    companySlug: string,
    proformaId: number,
    token: string
): Promise<{ data: Invoice }> {
    return fetchApi<{ data: Invoice }>(`/${companySlug}/proformas/${proformaId}/convert-to-invoice`, {
        method: "POST",
        token,
    });
}

export async function downloadProformaPdf(
    companySlug: string,
    proformaId: number,
    proformaNumber: string,
    token: string
): Promise<void> {
    const url = `${window.location.origin}${API_URL}/${companySlug}/proformas/${proformaId}/pdf`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Greška pri preuzimanju PDF-a");
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `predracun-${proformaNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(blobUrl);
}

export interface SendProformaEmailInput {
    to: string;
    subject: string;
    body: string;
    attach_pdf?: boolean;
}

export async function sendProformaEmail(
    companySlug: string,
    proformaId: number,
    token: string,
    data: SendProformaEmailInput
): Promise<{ success: boolean; message: string }> {
    return fetchApi(`/${companySlug}/proformas/${proformaId}/send-email`, {
        method: "POST",
        token,
        body: JSON.stringify(data),
    });
}
