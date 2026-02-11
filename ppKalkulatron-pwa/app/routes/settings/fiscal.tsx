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
import { CheckCircleIcon, FileTextIcon, GlobeIcon } from "~/components/ui/icons";
import { useNavigate } from "react-router";
import { FormInput, FormSelect, FormTextarea } from "~/components/ui/Input";
import { PageHeader } from "~/components/ui/PageHeader";
import { SectionBlock } from "~/components/ui/SectionBlock";
import { SectionHeader } from "~/components/ui/SectionHeader";
import { LoadingState } from "~/components/ui/LoadingState";
import { useToast } from "~/hooks/useToast";
import { OFS } from "~/config/constants";

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
            showToast(res.success ? "API dostupan – cloud ESIR je pravilno konfigurisan." : res.message, res.success ? "success" : "error");
        } catch (error: unknown) {
            if (!isLocal) {
                showToast("Greška pri testiranju API-ja", "error");
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
            showToast(res.success ? "Status uspješno učitan (Cloud)." : res.message, res.success ? "success" : "error");
        } catch (error: unknown) {
            if (!isLocal) {
                showToast("Greška pri dohvatu statusa", "error");
            } else {
                const msg = error instanceof Error ? error.message : String(error);
                showToast("Greška pri dohvatu statusa: " + msg, "error");
            }
        } finally {
            if (!handledBySw) setTesting(null);
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
                showToast("Greška pri testiranju podešavanja", "error");
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

            <PageHeader
                title="Fiskalizacija (OFS ESIR)"
                description="Podešavanja za fiskalni uređaj. Cloud (pos.ofs.ba) ili lokalni ESIR – API je identičan."
                onBack={() => navigate(-1)}
            />

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
                                label="Base URL (lokalni: http://192.168.x.x:port, cloud: URL OFS servisa)"
                                value={formData.ofs_base_url || ""}
                                onChange={(val: string) =>
                                    setFormData({ ...formData, ofs_base_url: val || null })
                                }
                                placeholder="npr. https://pos.ofs.ba ili http://192.168.1.1:3566"
                            />
                            <FormInput
                                label="API ključ (Bearer) (za lokalni SN uredjaja)"
                                type="password"
                                value={formData.ofs_api_key || ""}
                                onChange={(val: string) =>
                                    setFormData({ ...formData, ofs_api_key: val || null })
                                }
                                placeholder="API key uređaja"
                            />
                            <FormInput
                                label="Serijski broj (X-Teron-SerialNumber) (samo za cloude)"
                                value={formData.ofs_serial_number || ""}
                                onChange={(val: string) =>
                                    setFormData({ ...formData, ofs_serial_number: val || null })
                                }
                                placeholder="npr. F41AEFFF110A4B5ABB266299A41EE479"
                            />
                            <FormInput
                                label="PAK (X-PAC) (samo za cloude)"
                                value={formData.ofs_pac || ""}
                                onChange={(val: string) =>
                                    setFormData({ ...formData, ofs_pac: val || null })
                                }
                                placeholder="npr. 123456"
                            />
                        </div>
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
                                    {testing === "attention" ? "Testiranje..." : "Test API (/attention)"}
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
                                    {testing === "status" ? "Testiranje..." : "Test Status /api/status"}
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
