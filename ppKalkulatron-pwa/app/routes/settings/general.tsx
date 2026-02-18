import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AppLayout } from "~/components/layout/AppLayout";
import { useAuth } from "~/hooks/useAuth";
import { getMe } from "~/api/config";
import { updateCompanySettings, getCurrencies } from "~/api/settings";
import type { CompanySettings, AppConfigData, Currency } from "~/types/config";
import { Toast } from "~/components/ui/Toast";
import { Toggle } from "~/components/ui/Toggle";
import { CheckCircleIcon, MailIcon, FileTextIcon, HashIcon, StickyNoteIcon } from "~/components/ui/icons";
import { useNavigate } from "react-router";
import { FormInput, FormSelect, FormTextarea } from "~/components/ui/Input";
import { SectionBlock } from "~/components/ui/SectionBlock";
import { SectionHeader } from "~/components/ui/SectionHeader";
import { LoadingState } from "~/components/ui/LoadingState";
import { useToast } from "~/hooks/useToast";

export default function GeneralSettingsPage() {
    const { selectedCompany, updateSelectedCompany, token } = useAuth();
    const navigate = useNavigate();
    const [configData, setConfigData] = useState<AppConfigData | null>(null);
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<CompanySettings | null>(null);
    const [saving, setSaving] = useState(false);

    const { toast, showToast, hideToast } = useToast();

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

    const handleSubmit = async (e: FormEvent) => {
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

            {!loading && configData && formData && (
                <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Invoice Configuration */}
                    <SectionBlock variant="card">
                        <SectionHeader icon={FileTextIcon} title="Faktura Defaults" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormSelect
                                label="Dizajn Fakture"
                                value={formData.default_document_template || ""}
                                onChange={(val: string) => setFormData({ ...formData, default_document_template: val })}
                                options={configData.templates}
                            />
                            <FormInput
                                label="Rok plaćanja (dana)"
                                type="number"
                                value={formData.default_document_due_days || ""}
                                onChange={(val: string) => setFormData({ ...formData, default_document_due_days: parseInt(val) || null })}
                            />
                            <FormSelect
                                label="Jezik"
                                value={formData.default_document_language || ""}
                                onChange={(val: string) => setFormData({ ...formData, default_document_language: val })}
                                options={configData.languages}
                            />
                        </div>
                    </SectionBlock>

                    {/* Numbering */}
                    <SectionBlock variant="card">
                        <SectionHeader icon={HashIcon} title="Numeracija" />
                        <p className="text-[11px] text-[var(--color-text-dim)] mb-3 pl-1">
                            Format: PREFIX-broj/godina (npr. INV-1/2025). Ako prefiks nije unesen: broj/godina (npr. 1/2025).
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <Toggle
                                    checked={formData.document_numbering_reset_yearly}
                                    onChange={(v) => setFormData({ ...formData, document_numbering_reset_yearly: v })}
                                    label="Resetuj brojač godišnje"
                                />
                            </div>
                            <FormInput
                                label="Broj nula (padding)"
                                type="number"
                                value={formData.document_numbering_pad_zeros}
                                onChange={(val: string) => setFormData({ ...formData, document_numbering_pad_zeros: parseInt(val) || 0 })}
                            />
                            <FormInput
                                label="Prefiks računa"
                                value={formData.invoice_numbering_prefix ?? formData.document_numbering_prefix ?? ""}
                                onChange={(val: string) => setFormData({ ...formData, invoice_numbering_prefix: val })}
                                placeholder="npr. INV"
                            />
                            <FormInput
                                label="Prefiks predračuna"
                                value={formData.proforma_numbering_prefix ?? ""}
                                onChange={(val: string) => setFormData({ ...formData, proforma_numbering_prefix: val })}
                                placeholder="npr. PRO"
                            />
                            <FormInput
                                label="Prefiks ponude"
                                value={formData.quote_numbering_prefix ?? ""}
                                onChange={(val: string) => setFormData({ ...formData, quote_numbering_prefix: val })}
                                placeholder="npr. PON"
                            />
                            <FormInput
                                label="Početni broj računa"
                                type="number"
                                value={formData.invoice_numbering_starting_number ?? formData.document_numbering_starting_number ?? 1}
                                onChange={(val: string) => setFormData({ ...formData, invoice_numbering_starting_number: parseInt(val) || 1 })}
                            />
                            <FormInput
                                label="Početni broj predračuna"
                                type="number"
                                value={formData.proforma_numbering_starting_number ?? 1}
                                onChange={(val: string) => setFormData({ ...formData, proforma_numbering_starting_number: parseInt(val) || 1 })}
                            />
                            <FormInput
                                label="Početni broj ponude"
                                type="number"
                                value={formData.quote_numbering_starting_number ?? 1}
                                onChange={(val: string) => setFormData({ ...formData, quote_numbering_starting_number: parseInt(val) || 1 })}
                            />
                        </div>
                    </SectionBlock>

                    {/* Notes */}
                    <SectionBlock variant="card">
                        <SectionHeader icon={StickyNoteIcon} title="Napomene" />
                        <p className="text-[10px] text-[var(--color-text-dim)] font-medium mb-3 pl-1">
                            Prikazuju se na novim dokumentima kada korisnik ne unese napomenu.
                        </p>
                        <div className="space-y-4">
                            <FormTextarea
                                label="Podrazumijevane napomene (račun)"
                                value={formData.default_invoice_notes ?? formData.default_document_notes ?? ""}
                                onChange={(val: string) => setFormData({ ...formData, default_invoice_notes: val })}
                                rows={2}
                                placeholder="Napomene na novim računima..."
                            />
                            <FormTextarea
                                label="Podrazumijevane napomene (predračun)"
                                value={formData.default_proforma_notes ?? ""}
                                onChange={(val: string) => setFormData({ ...formData, default_proforma_notes: val })}
                                rows={2}
                                placeholder="Napomene na novim predračunima..."
                            />
                            <FormTextarea
                                label="Podrazumijevane napomene (ponuda)"
                                value={formData.default_quote_notes ?? ""}
                                onChange={(val: string) => setFormData({ ...formData, default_quote_notes: val })}
                                rows={2}
                                placeholder="Napomene na novim ponudama..."
                            />
                        </div>
                    </SectionBlock>

                    {/* Mail */}
                    <SectionBlock variant="card">
                        <SectionHeader icon={MailIcon} title="Slanje maila" />
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
                    </SectionBlock>

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
