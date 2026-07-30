/** Normalizira base URL (dodaje http:// ako nedostaje). */
export function normalizeFiscalBaseUrl(url: string): string {
    const u = (url || "").trim();
    if (!u) return "";
    if (!/^https?:\/\//i.test(u)) return "http://" + u;
    return u;
}

/**
 * HTTPS stranica (npr. Vercel) ne smije zvati HTTP lokalni uređaj (mixed content).
 * Service worker ne zaobilazi ovo ograničenje.
 */
export function isLocalFiscalBlockedByMixedContent(baseUrl: string): boolean {
    if (typeof window === "undefined") return false;
    if (window.location.protocol !== "https:") return false;
    const normalized = normalizeFiscalBaseUrl(baseUrl);
    return normalized.toLowerCase().startsWith("http://");
}

export const LOCAL_FISCAL_MIXED_CONTENT_MESSAGE =
    "Lokalni ESIR koristi HTTP (npr. http://192.168.x.x:3566). Preglednik to blokira s HTTPS stranice (npr. ppkalkulatron.vercel.app). " +
    "Za lokalni uređaj koristite aplikaciju na http://localhost:5173 (npm run dev na istom Wi‑Fi-u) ili u postavkama prebacite način uređaja na Cloud.";

export function getLocalFiscalBlockedReason(baseUrl: string): string | null {
    if (!isLocalFiscalBlockedByMixedContent(baseUrl)) return null;
    return LOCAL_FISCAL_MIXED_CONTENT_MESSAGE;
}

/** Sken mreže također zove HTTP adrese na LAN-u — blokirano s HTTPS stranice. */
export function isLocalNetworkScanBlocked(): boolean {
    return typeof window !== "undefined" && window.location.protocol === "https:";
}
