import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AppLayout } from "~/components/layout/AppLayout";
import { useAuth } from "~/hooks/useAuth";
import { getMe } from "~/api/config";
import {
    updateCompanySettings,
    testFiscalAttention,
    testFiscalSettings,
} from "~/api/settings";
import type { CompanySettings } from "~/types/config";
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

export default function FiscalSettingsPage() {
    const { selectedCompany, updateSelectedCompany, token } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<CompanySettings | null>(null);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState<"attention" | "settings" | null>(null);

    const { toast, showToast, hideToast } = useToast();

    useEffect(() => {
        if (!token || !selectedCompany) return;

        const loadData = async () => {
            setLoading(true);
            try {
                const meRes = await getMe(token, selectedCompany.slug);
                setFormData(meRes.data.company_settings);
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

    const handleTestAttention = async () => {
        if (!selectedCompany || !token) return;
        setTesting("attention");
        try {
            const res = await testFiscalAttention(selectedCompany.slug, token);
            showToast(res.success ? "API dostupan!" : ` ${res.message}`, res.success ? "success" : "error");
        } catch (error) {
            showToast("Greška pri testiranju API-ja", "error");
        } finally {
            setTesting(null);
        }
    };

    const handleTestSettings = async () => {
        if (!selectedCompany || !token) return;
        setTesting("settings");
        try {
            const res = await testFiscalSettings(selectedCompany.slug, token);
            const msg = res.success
                ? `${res.message}${res.data?.printer_name ? ` (Printer: ${res.data.printer_name})` : ""}`
                : `${res.message}`;
            showToast(msg, res.success ? "success" : "error");
        } catch (error) {
            showToast("Greška pri testiranju podešavanja", "error");
        } finally {
            setTesting(null);
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
                                label="Base URL"
                                value={formData.ofs_base_url || "https://pos.ofs.ba"}
                                onChange={(val: string) =>
                                    setFormData({ ...formData, ofs_base_url: val || null })
                                }
                                placeholder="https://pos.ofs.ba"
                            />
                            <FormInput
                                label="API ključ (Bearer)"
                                type="password"
                                value={formData.ofs_api_key || ""}
                                onChange={(val: string) =>
                                    setFormData({ ...formData, ofs_api_key: val || null })
                                }
                                placeholder="API key uređaja"
                            />
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
                        </div>
                        <div className="flex gap-3 mt-4">
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
                                value={formData.ofs_default_payment_type || "Cash"}
                                onChange={(val: string) =>
                                    setFormData({ ...formData, ofs_default_payment_type: val || null })
                                }
                                options={[
                                    { value: "Cash", label: "Gotovina" },
                                    { value: "Card", label: "Kartica" },
                                    { value: "WireTransfer", label: "Bankovni transfer" },
                                    { value: "Check", label: "Ček" },
                                    { value: "Voucher", label: "Vaučer" },
                                    { value: "MobileMoney", label: "Mobilni novac" },
                                    { value: "Other", label: "Ostalo" },
                                ]}
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
