import { fetchApi } from "~/utils/api";
import type { Client, ClientsResponse } from "~/types/client";

export interface ClientFilters {
    search?: string;
    status?: string;
}

export async function getClients(
    companySlug: string,
    token: string,
    page: number = 1,
    filters?: ClientFilters
): Promise<ClientsResponse> {
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (filters?.search) params.set("search", filters.search);
    if (filters?.status) params.set("status", filters.status);
    return fetchApi<ClientsResponse>(`/${companySlug}/clients?${params.toString()}`, { token });
}

export async function createClient(
    companySlug: string,
    token: string,
    clientData: Partial<Client>
): Promise<{ data: Client }> {
    return fetchApi<{ data: Client }>(`/${companySlug}/clients`, {
        method: "POST",
        token,
        body: JSON.stringify(clientData),
    });
}

export async function updateClient(
    companySlug: string,
    clientId: number,
    token: string,
    clientData: Partial<Client>
): Promise<{ data: Client }> {
    return fetchApi<{ data: Client }>(`/${companySlug}/clients/${clientId}`, {
        method: "PUT",
        token,
        body: JSON.stringify(clientData),
    });
}

export async function deleteClient(
    companySlug: string,
    clientId: number,
    token: string
): Promise<{ message: string }> {
    return fetchApi<{ message: string }>(`/${companySlug}/clients/${clientId}`, {
        method: "DELETE",
        token,
    });
}
