import type { InvoicesResponse } from "~/types/invoice";

const API_URL = "http://localhost/api/v1";

export async function getInvoices(
    companySlug: string,
    token: string,
    page: number = 1
): Promise<InvoicesResponse> {
    const url = `${API_URL}/${companySlug}/invoices?page=${page}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Neuspješno dohvatanje računa");
    }

    return response.json();
}
