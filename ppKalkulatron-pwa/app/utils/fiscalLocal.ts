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

/** Privatni opsezi po RFC 1918 — preglednik ih ne smatra sigurnim porijeklom. */
export function isPrivateNetworkHost(host: string): boolean {
    const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (!ipv4) return false;

    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];

    return a === 10
        || (a === 172 && b >= 16 && b <= 31)
        || (a === 192 && b === 168);
}

export const LOCAL_FISCAL_MIXED_CONTENT_MESSAGE =
    "Preglednik blokira HTTP adresu sa HTTPS stranice (mixed content), i service worker to ne zaobilazi. " +
    "Sam ESIR ne podržava HTTPS — sluša samo HTTP na portu 3566.";

/** Uređaj je zasebna kutija na LAN-u: HTTPS mu ne možemo dodati, pa ide proxy ili Chrome postavka. */
const PRIVATE_NETWORK_ADVICE =
    "Najbrže: u Chromeu klikni na ikonu pored adrese → Postavke stranice → \"Nesiguran sadržaj\" → Dozvoli. " +
    "Trajno rješenje za više uređaja: HTTPS reverse proxy na bilo kojem računaru na istoj mreži, koji " +
    "prosljeđuje na uređaj. Ili prebaci način uređaja na Cloud.";

/** ESIR kao program na istom računaru — loopback preglednik dozvoljava. */
const LOOPBACK_ADVICE =
    "Ako ESIR radi na istom računaru kao i preglednik, u Base URL upiši http://localhost:3566 — " +
    "loopback je izuzet od ovog ograničenja.";

export function getLocalFiscalBlockedReason(baseUrl: string): string | null {
    if (!isLocalFiscalBlockedByMixedContent(baseUrl)) return null;

    let host = "";
    try {
        host = new URL(normalizeFiscalBaseUrl(baseUrl)).hostname;
    } catch {
        // Neispravan URL — ostaje generična poruka.
    }

    return LOCAL_FISCAL_MIXED_CONTENT_MESSAGE + " "
        + (isPrivateNetworkHost(host) ? PRIVATE_NETWORK_ADVICE : LOOPBACK_ADVICE);
}

/**
 * Sken mreže zove privatne adrese na LAN-u, što je sa HTTPS stranice blokirano.
 * Loopback nije, ali sken po definiciji traži uređaje na mreži.
 */
export function isLocalNetworkScanBlocked(): boolean {
    return typeof window !== "undefined" && window.location.protocol === "https:";
}

/** Hostname iz base URL-a, ili prazno ako URL nije ispravan. */
export function hostOf(baseUrl: string | null | undefined): string {
    try {
        return new URL(normalizeFiscalBaseUrl(baseUrl ?? "")).hostname;
    } catch {
        return "";
    }
}

/** Predložene loopback adrese koje rade i sa HTTPS stranice. */
export const LOOPBACK_ESIR_SUGGESTIONS = [
    "http://localhost:3566",
    "http://127.0.0.1:3566",
] as const;
