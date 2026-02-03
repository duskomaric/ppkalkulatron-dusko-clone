import type { ClientsResponse } from "~/types/client";

const API_URL = "http://localhost/api/v1";

export async function getClients(
    companySlug: string,
    token: string,
    page: number = 1
): Promise<ClientsResponse> {
    const url = `${API_URL}/${companySlug}/clients?page=${page}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Neuspješno dohvatanje klijenata");
    }

    return response.json();
}
