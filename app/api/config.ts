import { fetchApi } from "~/utils/api";
import type { AppConfigResponse, CurrenciesResponse } from "~/types/config";

/**
 * Get current user context with form options (languages, frequencies, templates)
 */
export async function getMe(token: string): Promise<AppConfigResponse> {
    return fetchApi<AppConfigResponse>("/me", { token });
}

/**
 * Get company currencies
 */
export async function getCurrencies(
    companySlug: string,
    token: string
): Promise<CurrenciesResponse> {
    return fetchApi<CurrenciesResponse>(`/${companySlug}/currencies?per_page=100`, { token });
}
