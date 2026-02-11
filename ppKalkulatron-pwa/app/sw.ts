/// <reference lib="webworker" />

import { precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision?: string }> };
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("install", () => {
    void self.skipWaiting();
});

self.addEventListener("activate", (event: ExtendableEvent) => {
    event.waitUntil(self.clients.claim());
});

const LOCAL_FETCH_TIMEOUT_MS = 20000;

/** Lokalni ESIR: fetch iz service workera da zahtjev ide s uređaja korisnika (npr. 192.168.x.x). */
self.addEventListener("message", (event: ExtendableMessageEvent) => {
    if (event.data?.type !== "LOCAL_FETCH") return;
    const { url, options } = event.data as { url: string; options?: RequestInit };
    if (!url || !event.ports[0]) return;

    const port = event.ports[0];
    const abort = new AbortController();
    const timeoutId = setTimeout(() => abort.abort(), LOCAL_FETCH_TIMEOUT_MS);

    const opts: RequestInit = { ...options, signal: abort.signal };

    fetch(url, opts)
        .then(async (res) => {
            clearTimeout(timeoutId);
            const text = await res.text();
            let data: unknown = text;
            try {
                data = JSON.parse(text);
            } catch {
                // ostavi kao text
            }
            port.postMessage({
                success: true,
                ok: res.ok,
                status: res.status,
                data,
            });
        })
        .catch((err: Error) => {
            clearTimeout(timeoutId);
            const isAbort = err?.name === "AbortError";
            port.postMessage({
                success: false,
                error: isAbort ? "Timeout: uređaj nije odgovorio." : (err?.message ?? String(err)),
            });
        });
});
