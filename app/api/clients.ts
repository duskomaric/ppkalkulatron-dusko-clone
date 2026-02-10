import { fetchApi } from "~/utils/api";
import type { Client, ClientsResponse } from "~/types/client";

export async function getClients(
    companySlug: string,
    token: string,
    page: number = 1
): Promise<ClientsResponse> {
    return fetchApi<ClientsResponse>(`/${companySlug}/clients?page=${page}`, { token });
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
