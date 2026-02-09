import { API_URL } from "~/config/constants";
import { fetchApi } from "~/utils/api";
import type { Invoice, InvoicesResponse, InvoiceInput } from "~/types/invoice";

export async function getInvoices(
    companySlug: string,
    token: string,
    page: number = 1
): Promise<InvoicesResponse> {
    return fetchApi<InvoicesResponse>(`/${companySlug}/invoices?page=${page}`, { token });
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

export async function fiscalizeInvoice(
    companySlug: string,
    invoiceId: number,
    token: string
): Promise<{ success: boolean; message: string; data?: { fiscal_invoice_number?: string; fiscal_counter?: number; verification_url?: string } }> {
    return fetchApi(`/${companySlug}/invoices/${invoiceId}/fiscalize`, {
        method: "POST",
        token,
    });
}

export async function fiscalizeCopy(
    companySlug: string,
    invoiceId: number,
    token: string
): Promise<{ success: boolean; message: string }> {
    return fetchApi(`/${companySlug}/invoices/${invoiceId}/fiscalize-copy`, {
        method: "POST",
        token,
    });
}

export async function fiscalizeRefund(
    companySlug: string,
    invoiceId: number,
    token: string
): Promise<{ success: boolean; message: string }> {
    return fetchApi(`/${companySlug}/invoices/${invoiceId}/fiscalize-refund`, {
        method: "POST",
        token,
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
