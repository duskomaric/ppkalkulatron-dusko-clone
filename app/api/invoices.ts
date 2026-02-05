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
