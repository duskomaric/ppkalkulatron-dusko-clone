/** Normalizira base URL (dodaje http:// ako nedostaje). */
export function normalizeFiscalBaseUrl(url: string): string {
    const u = (url || "").trim();
    if (!u) return "";
    if (!/^https?:\/\//i.test(u)) return "http://" + u;
    return u;
}

/**
 * Loopback se računa kao sigurno porijeklo, pa HTTPS stranica smije zvati http://localhost.
 *
 * Secure Contexts spec: potentially trustworthy je host "localhost", te CIDR 127.0.0.0/8 i
 * ::1/128. Privatne adrese (192.168.x.x, 10.x.x.x) nisu — njih preglednik blokira.
 */
export function isLoopbackHost(host: string): boolean {
    const h = host.toLowerCase().replace(/\.$/, "").replace(/^\[|\]$/g, "");

    if (h === "localhost" || h.endsWith(".localhost")) return true;
    if (h === "::1") return true;

    const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);

    return ipv4 !== null && Number(ipv4[1]) === 127;
}

/**
 * HTTPS stranica (npr. Vercel) ne smije zvati HTTP lokalni uređaj (mixed content).
 * Service worker ne zaobilazi ovo ograničenje.
 *
 * Izuzetak je loopback: ako ESIR radi na istom računaru kao i preglednik,
 * http://localhost:3566 prolazi i sa HTTPS stranice.
 */
export function isLocalFiscalBlockedByMixedContent(baseUrl: string): boolean {
    if (typeof window === "undefined") return false;
    if (window.location.protocol !== "https:") return false;

    const normalized = normalizeFiscalBaseUrl(baseUrl);
    if (!normalized.toLowerCase().startsWith("http://")) return false;

    try {
        return !isLoopbackHost(new URL(normalized).hostname);
    } catch {
        return true;
    }
}

export const LOCAL_FISCAL_MIXED_CONTENT_MESSAGE =
    "Preglednik blokira HTTP adresu na lokalnoj mreži (npr. http://192.168.x.x:3566) sa HTTPS stranice, " +
    "i service worker to ne zaobilazi. Ako ESIR radi na istom računaru kao i preglednik, u Base URL " +
    "upišite http://localhost:3566 (ili http://127.0.0.1:3566) — loopback preglednik dozvoljava. " +
    "Ako ESIR radi na drugom računaru, prebacite način uređaja na Cloud.";

export function getLocalFiscalBlockedReason(baseUrl: string): string | null {
    if (!isLocalFiscalBlockedByMixedContent(baseUrl)) return null;
    return LOCAL_FISCAL_MIXED_CONTENT_MESSAGE;
}

/**
 * Sken mreže zove privatne adrese na LAN-u, što je sa HTTPS stranice blokirano.
 * Loopback nije, ali sken po definiciji traži uređaje na mreži.
 */
export function isLocalNetworkScanBlocked(): boolean {
    return typeof window !== "undefined" && window.location.protocol === "https:";
}

/** Predložene loopback adrese koje rade i sa HTTPS stranice. */
export const LOOPBACK_ESIR_SUGGESTIONS = [
    "http://localhost:3566",
    "http://127.0.0.1:3566",
] as const;
