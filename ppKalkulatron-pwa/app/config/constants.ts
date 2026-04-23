export const API_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

/** OFS ESIR – konstante za lokalni uređaj (PWA → Service Worker → lokalna adresa). */
export const OFS = {
    /** Timeout za test pozive (attention, settings, status) – stranica čeka odgovor SW-a. */
    LOCAL_FETCH_TIMEOUT_MS: 22_000,
    /** Timeout za fiskalizaciju računa iz PWA (SW šalje request na lokalni uređaj). */
    LOCAL_INVOICE_FETCH_TIMEOUT_MS: 30_000,
    /** Putanje OFS API-ja (dodaju se na base URL). Cloud pozive radi Laravel, lokalne PWA preko SW. */
    PATHS: {
        ATTENTION: "/api/attention",
        SETTINGS: "/api/settings",
        STATUS: "/api/status",
        INVOICES: "/api/invoices",
    },
} as const;
