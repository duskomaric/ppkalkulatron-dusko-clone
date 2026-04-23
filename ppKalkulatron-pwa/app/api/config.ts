import { fetchApi } from "~/utils/api";
import type { AppConfigResponse, CurrenciesResponse } from "~/types/config";

const ME_CACHE_TTL_MS = 30_000;
const meResponseCache = new Map<string, { expiresAt: number; data: AppConfigResponse }>();
const meInFlight = new Map<string, Promise<AppConfigResponse>>();

/** Invalidate getMe cache for a company (e.g. after saving company settings) so next getMe fetches fresh data. */
export function invalidateMeCache(companySlug: string): void {
    for (const key of meResponseCache.keys()) {
        if (key.startsWith(`${companySlug}:`)) {
            meResponseCache.delete(key);
            break;
        }
    }
}

/**
 * Get current user context with form options (languages, frequencies, templates)
 */
export async function getMe(token: string, companySlug: string): Promise<AppConfigResponse> {
    const cacheKey = `${companySlug}:${token}`;
    const now = Date.now();
    const cached = meResponseCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
        return cached.data;
    }

    const inFlight = meInFlight.get(cacheKey);
    if (inFlight) {
        return inFlight;
    }

    const promise = fetchApi<AppConfigResponse>(`/${companySlug}/me`, { token })
        .then((res) => {
            meResponseCache.set(cacheKey, { expiresAt: now + ME_CACHE_TTL_MS, data: res });
            return res;
        })
        .finally(() => {
            meInFlight.delete(cacheKey);
        });

    meInFlight.set(cacheKey, promise);
    return promise;
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
