import { fetchApi } from "~/utils/api";
import type { ClientsResponse } from "~/types/client";

export async function getClients(
    companySlug: string,
    token: string,
    page: number = 1
): Promise<ClientsResponse> {
    return fetchApi<ClientsResponse>(`/${companySlug}/clients?page=${page}`, { token });
}
