import { fetchApi } from "~/utils/api";
import type { InvoicesResponse } from "~/types/invoice";

export async function getInvoices(
    companySlug: string,
    token: string,
    page: number = 1
): Promise<InvoicesResponse> {
    return fetchApi<InvoicesResponse>(`/${companySlug}/invoices?page=${page}`, { token });
}
