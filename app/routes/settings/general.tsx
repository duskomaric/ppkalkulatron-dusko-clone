import React, { useEffect, useState } from "react";
import { AppLayout } from "~/components/layout/AppLayout";
import { useAuth } from "~/hooks/useAuth";
import { getMe } from "~/api/config";
import { updateCompanySettings, getCurrencies } from "~/api/settings";
import type { CompanySettings, AppConfigData, Currency } from "~/types/config";
import { Toast, type ToastType } from "~/components/ui/Toast";
import { Toggle } from "~/components/ui/Toggle";
import { CheckCircleIcon, ArrowLeftIcon, MailIcon } from "~/components/ui/icons";
import { useNavigate } from "react-router";
import { FormInput, FormSelect, FormTextarea } from "~/components/ui/Input";

export default function GeneralSettingsPage() {
    const { user, selectedCompany, updateSelectedCompany, token } = useAuth();
    const navigate = useNavigate();
    const [configData, setConfigData] = useState<AppConfigData | null>(null);
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<CompanySettings | null>(null);
    const [saving, setSaving] = useState(false);

    // Toast state
    const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
        message: "",
        type: "success",
        isVisible: false,
    });

    const showToast = (message: string, type: ToastType) => {
        setToast({ message, type, isVisible: true });
    };

    // Init company handled by useAuth

    useEffect(() => {
        if (!token || !selectedCompany) return;

        const loadData = async () => {
            setLoading(true);
            try {
                const [meRes, currenciesRes] = await Promise.all([
                    getMe(token, selectedCompany.slug),
                    getCurrencies(selectedCompany.slug, token)
                ]);
                
                setConfigData(meRes.data);
                setFormData(meRes.data.company_settings);
                setCurrencies(currenciesRes.data);
            } catch (error) {
                console.error("Failed to load settings", error);
                showToast("Failed to load settings", "error");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [token, selectedCompany]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCompany || !token || !formData) return;

        setSaving(true);
        try {
            await updateCompanySettings(selectedCompany.slug, token, formData);
            showToast("Podešavanja sačuvana", "success");
        } catch (error) {
            console.error("Failed to save settings", error);
            showToast("Greška pri čuvanju", "error");
        } finally {
            setSaving(false);
        }
    };

    if (!selectedCompany) return null;

    return (
        <AppLayout
            title="Generalno"
            selectedCompany={selectedCompany}
            onCompanyChange={updateSelectedCompany}
        >
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />

            <div className="mb-6">
                <button 
                    onClick={() => navigate(-1)} 
                    className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-text-dim)] hover:text-primary transition-colors mb-4 cursor-pointer"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Nazad
                </button>
                <h1 className="text-2xl font-black text-[var(--color-text-main)]">Generalna Podešavanja</h1>
                <p className="text-[var(--color-text-dim)]">Konfigurišite osnovna podešavanja za vašu kompaniju.</p>
            </div>

            {loading && (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            )}

            {!loading && configData && formData && (
                <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Invoice Configuration */}
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
                        <h3 className="text-lg font-black text-[var(--color-text-main)] border-b border-[var(--color-border)] pb-2 mb-6">
                            Faktura Defaults
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormSelect
                                label="Dizajn Fakture"
                                value={formData.default_invoice_template || ""}
                                onChange={(val: string) => setFormData({ ...formData, default_invoice_template: val })}
                                options={configData.templates}
                            />
                            <FormInput
                                label="Rok plaćanja (dana)"
                                type="number"
                                value={formData.default_invoice_due_days || ""}
                                onChange={(val: string) => setFormData({ ...formData, default_invoice_due_days: parseInt(val) || null })}
                            />
                            <FormSelect
                                label="Jezik"
                                value={formData.default_invoice_language || ""}
                                onChange={(val: string) => setFormData({ ...formData, default_invoice_language: val })}
                                options={configData.languages}
                            />
                            <FormSelect
                                label="Podrazumijevana Valuta"
                                value={formData.default_invoice_currency || ""}
                                onChange={(val: string) => setFormData({ ...formData, default_invoice_currency: val })}
                                options={currencies.map(c => ({ value: c.code, label: `${c.code} - ${c.name}` }))}
                            />
                        </div>
                    </div>

                    {/* Numbering */}
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
                        <h3 className="text-lg font-black text-[var(--color-text-main)] border-b border-[var(--color-border)] pb-2 mb-6">
                            Numeracija
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <Toggle
                                    checked={formData.invoice_numbering_reset_yearly}
                                    onChange={(v) => setFormData({ ...formData, invoice_numbering_reset_yearly: v })}
                                    label="Resetuj brojač godišnje"
                                />
                            </div>
                            <FormInput
                                label="Početni broj"
                                type="number"
                                value={formData.invoice_numbering_starting_number}
                                onChange={(val: string) => setFormData({ ...formData, invoice_numbering_starting_number: parseInt(val) || 1 })}
                            />
                            <FormInput
                                label="Prefiks"
                                value={formData.invoice_numbering_prefix || ""}
                                onChange={(val: string) => setFormData({ ...formData, invoice_numbering_prefix: val })}
                            />
                            <FormInput
                                label="Broj nula (padding)"
                                type="number"
                                value={formData.invoice_numbering_pad_zeros}
                                onChange={(val: string) => setFormData({ ...formData, invoice_numbering_pad_zeros: parseInt(val) || 0 })}
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
                        <h3 className="text-lg font-black text-[var(--color-text-main)] border-b border-[var(--color-border)] pb-2 mb-6">
                            Napomene
                        </h3>
                        <FormTextarea
                            label="Podrazumijevane napomene"
                            value={formData.default_invoice_notes || ""}
                            onChange={(val: string) => setFormData({ ...formData, default_invoice_notes: val })}
                            rows={2}
                            placeholder="Tekst koji će se prikazati kao podrazumijevane napomene na novim fakturama..."
                        />
                        <p className="text-[10px] text-[var(--color-text-dim)] font-medium mt-2 pl-1">
                            Prenose se na nove fakture kada korisnik ne unese napomenu.
                        </p>
                    </div>

                    {/* Mail */}
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
                        <h3 className="text-lg font-black text-[var(--color-text-main)] border-b border-[var(--color-border)] pb-2 mb-6 flex items-center gap-2">
                            <MailIcon className="h-5 w-5 text-primary" />
                            Slanje maila
                        </h3>
                        <p className="text-sm text-[var(--color-text-dim)] mb-4">
                            Podešavanja za slanje faktura i fiskalnih računa. Možete koristiti vlastiti SMTP server (Gmail, Outlook, itd.) da šaljete kao iz svog inboxa. Ako SMTP nije podešen, koristi se sistemska konfiguracija.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <FormInput
                                label="Email adresa (from)"
                                type="email"
                                value={formData.mail_from_address || ""}
                                onChange={(val: string) => setFormData({ ...formData, mail_from_address: val || null })}
                                placeholder="npr. fakture@firma.ba"
                            />
                            <FormInput
                                label="Ime pošiljaoca"
                                type="text"
                                value={formData.mail_from_name || ""}
                                onChange={(val: string) => setFormData({ ...formData, mail_from_name: val || null })}
                                placeholder="npr. Firma d.o.o."
                            />
                        </div>
                        <h4 className="text-sm font-black text-[var(--color-text-muted)] uppercase tracking-wider mb-3">SMTP server (opciono)</h4>
                        <p className="text-xs text-[var(--color-text-dim)] mb-4">
                            Za Gmail: host smtp.gmail.com, port 587, encryption TLS. Za Outlook: smtp.office365.com. Uključite „manje sigurne aplikacije“ ili koristite App Password.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormInput
                                label="SMTP host"
                                type="text"
                                value={formData.mail_host || ""}
                                onChange={(val: string) => setFormData({ ...formData, mail_host: val || null })}
                                placeholder="npr. smtp.gmail.com"
                            />
                            <FormInput
                                label="SMTP port"
                                type="number"
                                value={formData.mail_port ?? ""}
                                onChange={(val: string) => setFormData({ ...formData, mail_port: val ? parseInt(val, 10) : null })}
                                placeholder="587"
                            />
                            <FormSelect
                                label="Enkripcija"
                                value={formData.mail_encryption || ""}
                                onChange={(val: string) => setFormData({ ...formData, mail_encryption: val || null })}
                                options={[
                                    { value: "", label: "—" },
                                    { value: "tls", label: "TLS" },
                                    { value: "ssl", label: "SSL" },
                                ]}
                            />
                            <FormInput
                                label="SMTP korisničko ime"
                                type="text"
                                value={formData.mail_username || ""}
                                onChange={(val: string) => setFormData({ ...formData, mail_username: val || null })}
                                placeholder="npr. vas@email.com"
                            />
                            <div className="md:col-span-2">
                                <FormInput
                                    label="SMTP lozinka"
                                    type="password"
                                    value={formData.mail_password || ""}
                                    onChange={(val: string) => setFormData({ ...formData, mail_password: val || null })}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            disabled={saving}
                            type="submit"
                            className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-xl shadow-glow-primary transition-all disabled:opacity-50 flex items-center gap-2"
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
