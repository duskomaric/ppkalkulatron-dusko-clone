import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AppLayout } from "~/components/layout/AppLayout";
import { useAuth } from "~/hooks/useAuth";
import { getMe } from "~/api/config";
import {
    updateCompanySettings,
    testFiscalAttention,
    testFiscalSettings,
    testFiscalStatus,
} from "~/api/settings";
import type { CompanySettings } from "~/types/config";
import type { SelectOption } from "~/types/config";
import { Toast } from "~/components/ui/Toast";
import { Toggle } from "~/components/ui/Toggle";
import { CheckCircleIcon, FileTextIcon, GlobeIcon, SearchIcon } from "~/components/ui/icons";
import { useNavigate } from "react-router";
import { FormInput, FormSelect, FormTextarea } from "~/components/ui/Input";
import { SectionBlock } from "~/components/ui/SectionBlock";
import { SectionHeader } from "~/components/ui/SectionHeader";
import { LoadingState } from "~/components/ui/LoadingState";
import { useToast } from "~/hooks/useToast";
import { OFS } from "~/config/constants";
import {
    getLocalIPAddresses,
    generateIPRangesFromLocalIPs,
    parseManualIPRange,
    scanNetwork,
    type FoundDevice,
    type ScanProgress,
} from "~/utils/networkScan";

/** Vraća Service Worker za LOCAL_FETCH (controller ili registration.active). Izvor: PWA, da request ide s uređaja korisnika na lokalnu adresu. */
async function getServiceWorkerForLocalFetch(): Promise<ServiceWorker | null> {
    const sw = navigator.serviceWorker?.controller ?? null;
    if (sw) return sw;
    if (!navigator.serviceWorker) return null;
    const reg = await navigator.serviceWorker.ready;
    return reg?.active ?? null;
}

/** Normalizira base URL (dodaje http:// ako nedostaje). */
function normalizeFiscalBaseUrl(url: string): string {
    const u = (url || "").trim();
    if (!u) return "";
    if (!/^https?:\/\//i.test(u)) return "http://" + u;
    return u;
}


export default function FiscalSettingsPage() {
    const { selectedCompany, updateSelectedCompany, token } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<CompanySettings | null>(null);
    const [paymentTypes, setPaymentTypes] = useState<SelectOption[]>([]);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState<"attention" | "settings" | "status" | null>(null);
    const [scanning, setScanning] = useState(false);
    const [foundDevices, setFoundDevices] = useState<Array<{ ip: string; port: number; url: string; name?: string }>>([]);
    const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, currentIp: "" });
    const [detectedIPs, setDetectedIPs] = useState<string[]>([]);
    const [manualIPRange, setManualIPRange] = useState("");

    const { toast, showToast, hideToast } = useToast();

    useEffect(() => {
        if (!token || !selectedCompany) return;

        const loadData = async () => {
            setLoading(true);
            try {
                const meRes = await getMe(token, selectedCompany.slug);
                setFormData(meRes.data.company_settings);
                setPaymentTypes(meRes.data.payment_types ?? []);
            } catch (error) {
                console.error("Failed to load settings", error);
                showToast("Greška pri učitavanju podešavanja", "error");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [token, selectedCompany]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedCompany || !token || !formData) return;

        setSaving(true);
        try {
            await updateCompanySettings(selectedCompany.slug, token, formData);
            showToast("Podešavanja fiskalizacije sačuvana", "success");
        } catch (error) {
            console.error("Failed to save settings", error);
            showToast("Greška pri čuvanju", "error");
        } finally {
            setSaving(false);
        }
    };

    /**
     * Test API (attention).
     * – Cloud: poziv ide preko Laravel backenda → api.ofs.ba (OFSService). Izvor: Laravel.
     * – Local: poziv iz PWA preko Service Workera → base URL (npr. 192.168.x.x). Izvor: preglednik korisnika (SW omogućuje request prema lokalnoj mreži).
     */
    const handleTestAttention = async () => {
        if (!formData || !selectedCompany || !token) return;

        const isLocal = formData.ofs_device_mode === "local";
        setTesting("attention");
        let handledBySw = false;
        try {
            if (isLocal) {
                const base = normalizeFiscalBaseUrl(formData.ofs_base_url || "");
                if (!base) {
                    showToast("Unesite Base URL za lokalni uređaj", "error");
                    setTesting(null);
                    return;
                }
                const url = base.replace(/\/$/, "") + OFS.PATHS.ATTENTION;
                const headers: Record<string, string> = {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                };
                if (formData.ofs_api_key) headers["Authorization"] = "Bearer " + formData.ofs_api_key;

                const sw = await getServiceWorkerForLocalFetch();
                if (!sw) {
                    showToast("Service worker nije spreman. Osvježite stranicu i pokušajte ponovo.", "error");
                    setTesting(null);
                    return;
                }
                handledBySw = true;
                const channel = new MessageChannel();
                const timeout = setTimeout(() => {
                    showToast("Timeout: uređaj nije odgovorio. Provjerite Base URL i mrežu.", "error");
                    setTesting(null);
                }, OFS.LOCAL_FETCH_TIMEOUT_MS);
                channel.port1.onmessage = (event: MessageEvent) => {
                    clearTimeout(timeout);
                    const payload = event.data ?? {};
                    console.log("[Fiscal] Local mode – attention response:", payload);
                    const { success, ok, status, data, error } = payload;
                    if (success && ok) {
                        showToast("API dostupan – lokalni ESIR je pravilno konfigurisan.", "success");
                    } else if (success && !ok) {
                        const body = typeof data === "string" ? data : (data?.message ?? JSON.stringify(data));
                        showToast(`API nije dostupan (${status ?? ""})${body ? ": " + String(body).slice(0, 80) : ""}`, "error");
                    } else {
                        showToast("Greška: " + (error ?? "nepoznato"), "error");
                    }
                    setTesting(null);
                };
                sw.postMessage(
                    { type: "LOCAL_FETCH", url, options: { method: "GET", headers } },
                    [channel.port2]
                );
                return;
            }

            // Cloud: Laravel zove OFS (api.ofs.ba), odgovor vraća ovdje
            const res = await testFiscalAttention(selectedCompany.slug, token);
            console.log("[Fiscal] Cloud mode – attention response:", res);
            const message = res.message || (res.success ? "API dostupan." : "API nije dostupan.");
            showToast(message, res.success ? "success" : "error");
        } catch (error: unknown) {
            if (!isLocal) {
                const msg = error instanceof Error ? error.message : String(error);
                showToast(msg || "Greška pri testiranju API-ja", "error");
            } else {
                const msg = error instanceof Error ? error.message : String(error);
                if (msg.includes("abort") || msg.includes("Timeout")) {
                    showToast("Timeout: uređaj nije odgovorio. Provjerite Base URL i mrežu.", "error");
                } else if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
                    showToast("Nema konekcije do uređaja. Provjerite adresu i da li je uređaj u mreži.", "error");
                } else {
                    showToast("Greška pri testiranju API-ja: " + msg, "error");
                }
            }
        } finally {
            if (!handledBySw) setTesting(null);
        }
    };

    /**
     * Test status (GET /api/status).
     * – Cloud: Laravel → OFS. – Local: PWA → SW → lokalni uređaj.
     */
    const handleTestStatus = async () => {
        if (!formData || !selectedCompany || !token) return;

        const isLocal = formData.ofs_device_mode === "local";
        setTesting("status");
        let handledBySw = false;
        try {
            if (isLocal) {
                const base = normalizeFiscalBaseUrl(formData.ofs_base_url || "");
                if (!base) {
                    showToast("Unesite Base URL za lokalni uređaj", "error");
                    setTesting(null);
                    return;
                }
                const url = base.replace(/\/$/, "") + OFS.PATHS.STATUS;
                const headers: Record<string, string> = {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                };
                if (formData.ofs_api_key) headers["Authorization"] = "Bearer " + formData.ofs_api_key;

                const sw = await getServiceWorkerForLocalFetch();
                if (!sw) {
                    showToast("Service worker nije spreman. Osvježite stranicu i pokušajte ponovo.", "error");
                    setTesting(null);
                    return;
                }
                handledBySw = true;
                const channel = new MessageChannel();
                const timeout = setTimeout(() => {
                    showToast("Timeout: uređaj nije odgovorio. Provjerite Base URL i mrežu.", "error");
                    setTesting(null);
                }, OFS.LOCAL_FETCH_TIMEOUT_MS);
                channel.port1.onmessage = (event: MessageEvent) => {
                    clearTimeout(timeout);
                    const payload = event.data ?? {};
                    console.log("[Fiscal] Local mode – status response:", payload);
                    const { success, ok, status, data, error } = payload;
                    if (success && ok) {
                        showToast("Status uspješno učitan (Lokalno).", "success");
                    } else if (success && !ok) {
                        const body = typeof data === "string" ? data : (data?.message ?? JSON.stringify(data));
                        showToast(`Greška pri dohvatu statusa (${status ?? ""})${body ? ": " + String(body).slice(0, 80) : ""}`, "error");
                    } else {
                        showToast("Greška: " + (error ?? "nepoznato"), "error");
                    }
                    setTesting(null);
                };
                sw.postMessage(
                    { type: "LOCAL_FETCH", url, options: { method: "GET", headers } },
                    [channel.port2]
                );
                return;
            }
            const res = await testFiscalStatus(selectedCompany.slug, token);
            console.log("[Fiscal] Cloud mode – status response:", res);
            const message = res.message || (res.success ? "Status uspješno učitan." : "Greška pri dohvatu statusa.");
            showToast(message, res.success ? "success" : "error");
        } catch (error: unknown) {
            if (!isLocal) {
                const msg = error instanceof Error ? error.message : String(error);
                showToast(msg || "Greška pri dohvatu statusa", "error");
            } else {
                const msg = error instanceof Error ? error.message : String(error);
                showToast("Greška pri dohvatu statusa: " + msg, "error");
            }
        } finally {
            if (!handledBySw) setTesting(null);
        }
    };

    /**
     * Skenira lokalnu mrežu za fiskalne uređaje.
     * Pokušava da se poveže na različite IP adrese sa poznatim portovima.
     * Automatski detektuje lokalnu IP adresu i generiše opseg za skeniranje.
     */
    const handleScanNetwork = async () => {
        if (!formData) return;

        // Proveri da li je API key popunjen
        if (!formData.ofs_api_key || formData.ofs_api_key.trim() === "") {
            showToast("Morate uneti API ključ pre skeniranja mreže!", "error");
            return;
        }

        setScanning(true);
        setFoundDevices([]);
        setScanProgress({ current: 0, total: 0, currentIp: "Detektovanje lokalne IP adrese..." });

        const sw = await getServiceWorkerForLocalFetch();
        if (!sw) {
            showToast("Service worker nije spreman. Osvježite stranicu i pokušajte ponovo.", "error");
            setScanning(false);
            return;
        }

        // Proveri da li korisnik ima ručno unesen opseg
        let commonRanges: Array<{ base: string; start: number; end: number }> = [];

        if (manualIPRange.trim()) {
            const parsedRange = parseManualIPRange(manualIPRange);
            if (parsedRange) {
                commonRanges = [parsedRange];
                console.log(`[Network Scan] Using manual IP range: ${parsedRange.base}.${parsedRange.start}-${parsedRange.end}`);
                showToast(`Korišćenje ručno unesenog opsega: ${parsedRange.base}.${parsedRange.start}-${parsedRange.end}`, "info");
            } else {
                showToast("Neispravan format opsega. Koristite format: 192.168.31.100-105", "error");
                setScanning(false);
                return;
            }
        } else {
            // Pokušaj da dobiješ lokalne IP adrese
            showToast("Detektovanje lokalne IP adrese...", "info");
            const localIPs = await getLocalIPAddresses();
            setDetectedIPs(localIPs);

            // Generiši opseg IP adresa za skeniranje na osnovu lokalnih IP adresa
            commonRanges = generateIPRangesFromLocalIPs(localIPs);

            if (localIPs.length > 0) {
                console.log(`[Network Scan] Detected local IPs: ${localIPs.join(", ")}`);
                showToast(`Pronađeno ${localIPs.length} lokalna IP adresa. Generisanje opsega...`, "info");
            } else {
                console.log("[Network Scan] No local IPs detected, using common ranges");
                showToast("Nije moguće detektovati IP adresu. Koristite ručno unošenje opsega ili standardne opsege.", "error");
            }
        }

        // Portovi za testiranje (najčešći portovi za ESIR)
        const ports = [3566];

        try {
            const devices = await scanNetwork(
                sw,
                commonRanges,
                ports,
                formData.ofs_api_key || undefined,
                (progress: ScanProgress) => {
                    setScanProgress(progress);
                },
                (device: FoundDevice) => {
                    setFoundDevices((prev) => [...prev, device]);
                }
            );

            setScanning(false);
            if (devices.length > 0) {
                showToast(`Pronađeno ${devices.length} uređaja na mreži`, "success");
            } else {
                showToast("Nijedan uređaj nije pronađen. Provjerite da li su uređaji uključeni i na istoj mreži.", "error");
            }
        } catch (error) {
            console.error("[Network Scan] Error during scan:", error);
            setScanning(false);
            showToast("Greška pri skeniranju mreže", "error");
        }
    };

    /**
     * Test settings (GET /api/settings).
     * – Cloud: Laravel → OFS. – Local: PWA → SW → lokalni uređaj.
     */
    const handleTestSettings = async () => {
        if (!formData || !selectedCompany || !token) return;

        const isLocal = formData.ofs_device_mode === "local";
        setTesting("settings");
        let handledBySw = false;
        try {
            if (isLocal) {
                const base = normalizeFiscalBaseUrl(formData.ofs_base_url || "");
                if (!base) {
                    showToast("Unesite Base URL za lokalni uređaj", "error");
                    setTesting(null);
                    return;
                }
                const url = base.replace(/\/$/, "") + OFS.PATHS.SETTINGS;
                const headers: Record<string, string> = {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                };
                if (formData.ofs_api_key) headers["Authorization"] = "Bearer " + formData.ofs_api_key;

                const sw = await getServiceWorkerForLocalFetch();
                if (!sw) {
                    showToast("Service worker nije spreman. Osvježite stranicu i pokušajte ponovo.", "error");
                    setTesting(null);
                    return;
                }
                handledBySw = true;
                const channel = new MessageChannel();
                const timeout = setTimeout(() => {
                    showToast("Timeout: uređaj nije odgovorio. Provjerite Base URL i mrežu.", "error");
                    setTesting(null);
                }, OFS.LOCAL_FETCH_TIMEOUT_MS);
                channel.port1.onmessage = (event: MessageEvent) => {
                    clearTimeout(timeout);
                    const payload = event.data ?? {};
                    console.log("[Fiscal] Local mode – settings response:", payload);
                    const { success, ok, status, data, error } = payload;
                    if (success && ok) {
                        const printer = data?.printerName || data?.printer_name || "Nepoznato";
                        showToast(`Settings učitani – lokalni ESIR je dostupan. Printer: ${printer}`, "success");
                    } else if (success && !ok) {
                        const body = typeof data === "string" ? data : (data?.message ?? JSON.stringify(data));
                        showToast(`Greška pri učitavanju settings-a (${status ?? ""})${body ? ": " + String(body).slice(0, 80) : ""}`, "error");
                    } else {
                        showToast("Greška: " + (error ?? "nepoznato"), "error");
                    }
                    setTesting(null);
                };
                sw.postMessage(
                    { type: "LOCAL_FETCH", url, options: { method: "GET", headers } },
                    [channel.port2]
                );
                return;
            }
            const res = await testFiscalSettings(selectedCompany.slug, token);
            console.log("[Fiscal] Cloud mode – settings response:", res);
            const msg = res.success
                ? `${res.message}${res.data?.printer_name ? ` (Printer: ${res.data.printer_name})` : ""}`
                : `${res.message}`;
            showToast(msg, res.success ? "success" : "error");
        } catch (error: unknown) {
            if (!isLocal) {
                const msg = error instanceof Error ? error.message : String(error);
                showToast(msg || "Greška pri testiranju podešavanja", "error");
            } else {
                const msg = error instanceof Error ? error.message : String(error);
                showToast("Greška pri testiranju podešavanja: " + msg, "error");
            }
        } finally {
            if (!handledBySw) setTesting(null);
        }
    };

    if (!selectedCompany) return null;

    return (
        <AppLayout
            title="Fiskalizacija"
            selectedCompany={selectedCompany}
            onCompanyChange={updateSelectedCompany}
        >
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={hideToast}
            />

            <div className="mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-text-dim)] hover:text-primary transition-colors mb-4 cursor-pointer"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Nazad
                </button>
            </div>

            {loading && (
                <LoadingState />
            )}

            {!loading && formData && (
                <form
                    onSubmit={handleSubmit}
                    className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
                >
                    {/* Connection - Cloud vs Local */}
                    <SectionBlock variant="card">
                        <SectionHeader icon={GlobeIcon} title="Konekcija" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormSelect
                                label="Način uređaja"
                                value={formData.ofs_device_mode || "cloud"}
                                onChange={(val: string) =>
                                    setFormData({ ...formData, ofs_device_mode: val || null })
                                }
                                options={[
                                    { value: "cloud", label: "Cloud (pos.ofs.ba)" },
                                    { value: "local", label: "Lokalni ESIR" },
                                ]}
                            />
                            <FormInput
                                label="Base URL"
                                value={formData.ofs_base_url || ""}
                                onChange={(val: string) =>
                                    setFormData({ ...formData, ofs_base_url: val || null })
                                }
                                placeholder={
                                    formData.ofs_device_mode === "local"
                                        ? "npr. http://192.168.31.102:3566"
                                        : "npr. https://pos.ofs.ba"
                                }
                            />
                            <FormInput
                                label={formData.ofs_device_mode === "local" ? "API ključ (Bearer) * (obavezno za skeniranje)" : "API ključ (Bearer)"}
                                type="password"
                                value={formData.ofs_api_key || ""}
                                onChange={(val: string) =>
                                    setFormData({ ...formData, ofs_api_key: val || null })
                                }
                                placeholder="API key uređaja"
                            />
                            {formData.ofs_device_mode === "cloud" && (
                                <>
                                    <FormInput
                                        label="Serijski broj (X-Teron-SerialNumber)"
                                        value={formData.ofs_serial_number || ""}
                                        onChange={(val: string) =>
                                            setFormData({ ...formData, ofs_serial_number: val || null })
                                        }
                                        placeholder="npr. F41AEFFF110A4B5ABB266299A41EE479"
                                    />
                                    <FormInput
                                        label="PAK (X-PAC)"
                                        value={formData.ofs_pac || ""}
                                        onChange={(val: string) =>
                                            setFormData({ ...formData, ofs_pac: val || null })
                                        }
                                        placeholder="npr. 123456"
                                    />
                                </>
                            )}
                        </div>
                        {formData.ofs_device_mode === "local" && (
                            <div className="mt-4 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-bold">Skeniranje mreže</h3>
                                    <button
                                        type="button"
                                        onClick={handleScanNetwork}
                                        disabled={scanning || !!testing || !formData.ofs_api_key || formData.ofs_api_key.trim() === ""}
                                        className="px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] hover:bg-[var(--color-surface-hover)] text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                                    >
                                        <SearchIcon className="h-4 w-4" />
                                        {scanning ? "Skeniranje..." : "Skeniraj mrežu"}
                                    </button>
                                </div>
                                {(!formData.ofs_api_key || formData.ofs_api_key.trim() === "") && (
                                    <div className="mb-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                        <p className="text-xs font-bold text-yellow-500">
                                            ⚠️ Morate uneti API ključ pre skeniranja mreže!
                                        </p>
                                    </div>
                                )}
                                <div className="mb-3">
                                    <FormInput
                                        label="Ručno unesi IP opseg (opciono)"
                                        value={manualIPRange}
                                        onChange={(val: string) => setManualIPRange(val)}
                                        placeholder="npr. 192.168.31.100-105 ili 192.168.31.102"
                                    />
                                    <p className="text-[10px] text-[var(--color-text-dim)] mt-1">
                                        Ako automatska detekcija ne radi, unesite opseg ručno. Format: 192.168.31.100-105 (ili samo jedan IP: 192.168.31.102)
                                    </p>
                                </div>
                                {detectedIPs.length > 0 && (
                                    <div className="mb-3 p-2 rounded-lg bg-[var(--color-surface-hover)]">
                                        <p className="text-xs text-[var(--color-text-dim)] mb-1">
                                            Detektovane lokalne IP adrese:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {detectedIPs.map((ip, idx) => (
                                                <span
                                                    key={idx}
                                                    className="text-xs px-2 py-1 rounded bg-primary/20 text-primary font-mono"
                                                >
                                                    {ip}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {scanning && (
                                    <div className="mb-3">
                                        <div className="flex items-center justify-between text-xs text-[var(--color-text-dim)] mb-1">
                                            <span>
                                                {scanProgress.currentIp ? `Testiranje: ${scanProgress.currentIp}` : "Skeniranje..."}
                                            </span>
                                            <span>
                                                {scanProgress.current} / {scanProgress.total}
                                            </span>
                                        </div>
                                        <div className="w-full bg-[var(--color-border)] rounded-full h-2">
                                            <div
                                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                                style={{
                                                    width: `${scanProgress.total > 0 ? (scanProgress.current / scanProgress.total) * 100 : 0}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                                {foundDevices.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs text-[var(--color-text-dim)] mb-2">
                                            Pronađeni uređaji:
                                        </p>
                                        {foundDevices.map((device, idx) => (
                                            <div
                                                key={`${device.ip}-${device.port}-${idx}`}
                                                className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] hover:bg-[var(--color-surface-hover)] cursor-pointer transition-colors"
                                                onClick={() => {
                                                    setFormData({
                                                        ...formData,
                                                        ofs_base_url: device.url,
                                                    });
                                                }}
                                            >
                                                <div>
                                                    <div className="text-sm font-bold">{device.url}</div>
                                                    {device.name && (
                                                        <div className="text-xs text-[var(--color-text-dim)]">
                                                            {device.name}
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    className="text-xs px-3 py-1 rounded-lg bg-primary text-white font-bold hover:bg-primary-hover"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFormData({
                                                            ...formData,
                                                            ofs_base_url: device.url,
                                                        });
                                                        showToast(`Base URL postavljen na ${device.url}`, "success");
                                                    }}
                                                >
                                                    Koristi
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="flex flex-col gap-2 mt-4">
                            <p className="text-[10px] text-[var(--color-text-dim)]">
                                Cloud: poziv preko backenda. Lokalni ESIR: poziv iz service workera (vaš uređaj → lokalna adresa 192.168.x.x). Ako SW nije spreman, osvježite stranicu.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleTestAttention}
                                    disabled={!!testing}
                                    className="px-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-sm font-bold disabled:opacity-50 cursor-pointer"
                                >
                                    {testing === "attention" ? "Testiranje..." : "Test Attention"}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleTestSettings}
                                    disabled={!!testing}
                                    className="px-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-sm font-bold disabled:opacity-50 cursor-pointer"
                                >
                                    {testing === "settings" ? "Testiranje..." : "Test Settings"}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleTestStatus}
                                    disabled={!!testing}
                                    className="px-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-sm font-bold disabled:opacity-50 cursor-pointer"
                                >
                                    {testing === "status" ? "Testiranje..." : "Test Status"}
                                </button>
                            </div>
                        </div>
                    </SectionBlock>

                    {/* Receipt / Print settings */}
                    <SectionBlock variant="card">
                        <SectionHeader icon={FileTextIcon} title="Štampa računa" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormSelect
                                label="Layout štampe"
                                value={formData.ofs_receipt_layout || "Slip"}
                                onChange={(val: string) =>
                                    setFormData({ ...formData, ofs_receipt_layout: val || null })
                                }
                                options={[
                                    { value: "Slip", label: "Slip (termalni 58/80mm)" },
                                    { value: "Invoice", label: "Invoice (A4 Laser/InkJet)" },
                                ]}
                            />
                            <FormSelect
                                label="Podrazumijevani način plaćanja"
                                value={formData.ofs_default_payment_type ?? (paymentTypes[0]?.value ?? "")}
                                onChange={(val: string) =>
                                    setFormData({ ...formData, ofs_default_payment_type: val || null })
                                }
                                options={paymentTypes}
                            />
                            <FormSelect
                                label="Format slike"
                                value={formData.ofs_receipt_image_format || "Png"}
                                onChange={(val: string) =>
                                    setFormData({ ...formData, ofs_receipt_image_format: val || null })
                                }
                                options={[{ value: "Png", label: "PNG" }]}
                            />
                            <div className="md:col-span-2">
                                <Toggle
                                    checked={formData.ofs_render_receipt_image ?? true}
                                    onChange={(v) => setFormData({ ...formData, ofs_render_receipt_image: v })}
                                    label="Generiši sliku računa (renderReceiptImage)"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <FormTextarea
                                    label="Linije u zaglavlju računa"
                                    value={formData.ofs_receipt_header_text_lines?.join("\n") || ""}
                                    onChange={(val: string) =>
                                        setFormData({
                                            ...formData,
                                            ofs_receipt_header_text_lines: val
                                                ? val.split("\n").filter(Boolean)
                                                : null,
                                        })
                                    }
                                    rows={3}
                                    placeholder="Jedna linija po redu..."
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-[var(--color-text-dim)] font-medium mt-2 pl-1">
                            Slip = termalni štampači, Invoice = A4 format.
                        </p>
                    </SectionBlock>

                    <div className="flex justify-end pt-4">
                        <button
                            disabled={saving}
                            type="submit"
                            className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-xl shadow-glow-primary transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                        >
                            {saving ? "Čuvanje..." : "Sačuvaj Promjene"}
                            {!saving && <CheckCircleIcon className="h-5 w-5" />}
                        </button>
                    </div>
                </form>
            )}
        </AppLayout>
    );
}
