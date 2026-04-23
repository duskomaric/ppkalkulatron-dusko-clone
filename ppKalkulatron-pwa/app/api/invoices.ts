import { API_URL } from "~/config/constants";
import { fetchApi } from "~/utils/api";
import type { Invoice, InvoicesResponse, InvoiceInput } from "~/types/invoice";

export interface InvoiceFilters {
    search?: string;
    status?: string;
    payment_type?: string;
    created_from?: string;
    created_to?: string;
    date_from?: string;
    date_to?: string;
    /** When no date_from/date_to, backend uses this year (01.01–31.12) on invoice date. */
    year?: number;
}

export async function getInvoices(
    companySlug: string,
    token: string,
    page: number = 1,
    filters?: InvoiceFilters
): Promise<InvoicesResponse> {
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (filters?.search) params.set("search", filters.search);
    if (filters?.status) params.set("status", filters.status);
    if (filters?.payment_type) params.set("payment_type", filters.payment_type);
    if (filters?.created_from) params.set("created_from", filters.created_from);
    if (filters?.created_to) params.set("created_to", filters.created_to);
    if (filters?.date_from) params.set("date_from", filters.date_from);
    if (filters?.date_to) params.set("date_to", filters.date_to);
    if (filters?.year != null && !filters?.date_from && !filters?.date_to) params.set("year", String(filters.year));
    return fetchApi<InvoicesResponse>(`/${companySlug}/invoices?${params.toString()}`, { token });
}

export async function getInvoice(
    companySlug: string,
    invoiceId: number,
    token: string
): Promise<{ data: Invoice }> {
    return fetchApi<{ data: Invoice }>(`/${companySlug}/invoices/${invoiceId}`, { token });
}

export async function createInvoice(
    companySlug: string,
    token: string,
    invoiceData: InvoiceInput
): Promise<{ data: Invoice }> {
    return fetchApi<{ data: Invoice }>(`/${companySlug}/invoices`, {
        method: "POST",
        token,
        body: JSON.stringify(invoiceData),
    });
}

export async function updateInvoice(
    companySlug: string,
    invoiceId: number,
    token: string,
    invoiceData: InvoiceInput
): Promise<{ data: Invoice }> {
    return fetchApi<{ data: Invoice }>(`/${companySlug}/invoices/${invoiceId}`, {
        method: "PUT",
        token,
        body: JSON.stringify(invoiceData),
    });
}

export async function deleteInvoice(
    companySlug: string,
    invoiceId: number,
    token: string
): Promise<{ message: string; success?: boolean }> {
    return fetchApi<{ message: string; success?: boolean }>(`/${companySlug}/invoices/${invoiceId}`, {
        method: "DELETE",
        token,
    });
}

export async function createRefundInvoice(
    companySlug: string,
    invoiceId: number,
    token: string
): Promise<{ data: Invoice }> {
    return fetchApi<{ data: Invoice }>(`/${companySlug}/invoices/${invoiceId}/create-refund`, {
        method: "POST",
        token,
    });
}

/** Get OFS payload for local device (BAM amounts from API). */
export async function getFiscalPayload(
    companySlug: string,
    invoiceId: number,
    token: string,
    params: { transaction_type: string; invoice_type: string }
): Promise<Record<string, unknown>> {
    const q = new URLSearchParams(params);
    return fetchApi<Record<string, unknown>>(
        `/${companySlug}/invoices/${invoiceId}/fiscal-payload?${q.toString()}`,
        { token }
    );
}

export async function fiscalizeInvoice(
    companySlug: string,
    invoiceId: number,
    token: string,
    params?: { localDeviceResponse?: any; request_id?: string }
): Promise<{ success: boolean; message: string; data?: any; request_id?: string }> {
    return fetchApi(`/${companySlug}/invoices/${invoiceId}/fiscalize`, {
        method: "POST",
        token,
        body: params?.localDeviceResponse ? JSON.stringify({ localDeviceResponse: params.localDeviceResponse, request_id: params.request_id }) : undefined,
    });
}

export async function fiscalizeCopy(
    companySlug: string,
    invoiceId: number,
    token: string,
    params?: { localDeviceResponse?: any; request_id?: string }
): Promise<{ success: boolean; message: string; data?: any; request_id?: string }> {
    return fetchApi(`/${companySlug}/invoices/${invoiceId}/fiscalize-copy`, {
        method: "POST",
        token,
        body: params?.localDeviceResponse ? JSON.stringify({ localDeviceResponse: params.localDeviceResponse, request_id: params.request_id }) : undefined,
    });
}

export async function fiscalizeRefund(
    companySlug: string,
    invoiceId: number,
    token: string,
    params?: { localDeviceResponse?: any; request_id?: string }
): Promise<{ success: boolean; message: string; data?: any; request_id?: string }> {
    return fetchApi(`/${companySlug}/invoices/${invoiceId}/fiscalize-refund`, {
        method: "POST",
        token,
        body: params?.localDeviceResponse ? JSON.stringify({ localDeviceResponse: params.localDeviceResponse, request_id: params.request_id }) : undefined,
    });
}

export async function downloadInvoicePdf(
    companySlug: string,
    invoiceId: number,
    invoiceNumber: string,
    token: string
): Promise<void> {
    const url = `${window.location.origin}${API_URL}/${companySlug}/invoices/${invoiceId}/pdf`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Greška pri preuzimanju PDF-a");
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `faktura-${invoiceNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(blobUrl);
}

export interface SendInvoiceEmailInput {
    to: string;
    subject: string;
    body: string;
    attach_pdf?: boolean;
    attach_fiscal_record_ids?: number[];
}

export async function sendInvoiceEmail(
    companySlug: string,
    invoiceId: number,
    token: string,
    data: SendInvoiceEmailInput
): Promise<{ success: boolean; message: string }> {
    return fetchApi(`/${companySlug}/invoices/${invoiceId}/send-email`, {
        method: "POST",
        token,
        body: JSON.stringify(data),
    });
}
