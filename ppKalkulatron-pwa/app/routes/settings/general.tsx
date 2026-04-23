import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AppLayout } from "~/components/layout/AppLayout";
import { useAuth } from "~/hooks/useAuth";
import { getMe, getCurrencies } from "~/api/config";
import { updateCompanySettings } from "~/api/settings";
import type { CompanySettings, AppConfigData, Currency } from "~/types/config";
import { Toast } from "~/components/ui/Toast";
import { Toggle } from "~/components/ui/Toggle";
import { CheckCircleIcon, FileTextIcon, HashIcon, StickyNoteIcon, InfoIcon } from "~/components/ui/icons";
import { useNavigate, Link } from "react-router";
import { FormInput } from "~/components/ui/FormInput";
import { FormSelect } from "~/components/ui/FormSelect";
import { FormTextarea } from "~/components/ui/FormTextarea";
import { SectionBlock } from "~/components/ui/SectionBlock";
import { SectionHeader } from "~/components/ui/SectionHeader";
import { LoadingState } from "~/components/ui/LoadingState";
import { useToast } from "~/hooks/useToast";

export default function GeneralSettingsPage() {
    const { selectedCompany, updateSelectedCompany, token, refreshUser } = useAuth();
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
            } catch {
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
            await refreshUser();
            showToast("Podešavanja sačuvana", "success");
        } catch {
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
                        <SectionHeader
                            icon={FileTextIcon}
                            title="Štampa računa"
                            rightElement={
                                <Link
                                    to="/help#stampa-racuna"
                                    className="h-8 w-8 rounded-lg border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-dim)] hover:text-primary hover:border-primary/30 transition-all cursor-pointer"
                                    title="Pomoć: Štampa računa"
                                >
                                    <InfoIcon className="h-4 w-4" />
                                </Link>
                            }
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormSelect
                                label="Dizajn Dokumenata"
                                value={formData.default_document_template || ""}
                                onChange={(val: string) => setFormData({ ...formData, default_document_template: val })}
                                options={configData.templates}
                            />
                            <FormInput
                                label="Rok plaćanja računa (dana)"
                                type="number"
                                value={formData.default_invoice_due_days || ""}
                                onChange={(val: string) => setFormData({ ...formData, default_invoice_due_days: parseInt(val) || null })}
                            />
                            <FormInput
                                label="Rok plaćanja predračuna (dana)"
                                type="number"
                                value={formData.default_proforma_due_days || ""}
                                onChange={(val: string) => setFormData({ ...formData, default_proforma_due_days: parseInt(val) || null })}
                            />
                            <FormInput
                                label="Rok važenja ponude (dana)"
                                type="number"
                                value={formData.default_quote_due_days || ""}
                                onChange={(val: string) => setFormData({ ...formData, default_quote_due_days: parseInt(val) || null })}
                            />
                            <FormSelect
                                label="Jezik dokumenata"
                                value={formData.default_document_language || ""}
                                onChange={(val: string) => setFormData({ ...formData, default_document_language: val })}
                                options={configData.languages}
                            />
                        </div>
                    </SectionBlock>

                    {/* Numbering */}
                    <SectionBlock variant="card">
                        <SectionHeader
                            icon={HashIcon}
                            title="Numeracija"
                            rightElement={
                                <Link
                                    to="/help#numeration"
                                    className="h-8 w-8 rounded-lg border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-dim)] hover:text-primary hover:border-primary/30 transition-all cursor-pointer"
                                    title="Pomoć: Numeracija"
                                >
                                    <InfoIcon className="h-4 w-4" />
                                </Link>
                            }
                        />
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
                                value={formData.invoice_numbering_prefix ?? ""}
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
                                value={formData.invoice_numbering_starting_number ?? ""}
                                onChange={(val: string) => setFormData({ ...formData, invoice_numbering_starting_number: val === "" ? 1 : parseInt(val, 10) })}
                            />
                            <FormInput
                                label="Početni broj predračuna"
                                type="number"
                                value={formData.proforma_numbering_starting_number ?? ""}
                                onChange={(val: string) => setFormData({ ...formData, proforma_numbering_starting_number: val === "" ? 1 : parseInt(val, 10) })}
                            />
                            <FormInput
                                label="Početni broj ponude"
                                type="number"
                                value={formData.quote_numbering_starting_number ?? ""}
                                onChange={(val: string) => setFormData({ ...formData, quote_numbering_starting_number: val === "" ? 1 : parseInt(val, 10) })}
                            />
                        </div>
                    </SectionBlock>

                    {/* Notes */}
                    <SectionBlock variant="card">
                        <SectionHeader
                            icon={StickyNoteIcon}
                            title="Napomene"
                            rightElement={
                                <Link
                                    to="/help#notes"
                                    className="h-8 w-8 rounded-lg border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-dim)] hover:text-primary hover:border-primary/30 transition-all cursor-pointer"
                                    title="Pomoć: Napomene"
                                >
                                    <InfoIcon className="h-4 w-4" />
                                </Link>
                            }
                        />
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
