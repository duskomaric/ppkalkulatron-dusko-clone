import React, { useEffect, useState } from "react";
import { AppLayout } from "~/components/layout/AppLayout";
import { useAuth } from "~/hooks/useAuth";
import { getMe } from "~/api/config";
import { updateCompanySettings, getBankAccounts, getCurrencies } from "~/api/settings";
import type { CompanySettings, AppConfigData, BankAccount, Currency } from "~/types/config";
import { Toast, type ToastType } from "~/components/ui/Toast";
import { CheckCircleIcon, ArrowLeftIcon } from "~/components/ui/icons";
import { useNavigate } from "react-router";
import { FormInput, FormSelect, FormTextarea } from "~/components/ui/Input";

export default function GeneralSettingsPage() {
    const { user, selectedCompany, updateSelectedCompany, token } = useAuth();
    const navigate = useNavigate();
    const [configData, setConfigData] = useState<AppConfigData | null>(null);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
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
                const [meRes, bankAccountsRes, currenciesRes] = await Promise.all([
                    getMe(token, selectedCompany.slug),
                    getBankAccounts(selectedCompany.slug, token),
                    getCurrencies(selectedCompany.slug, token)
                ]);
                
                setConfigData(meRes.data);
                setFormData(meRes.data.company_settings);
                setBankAccounts(bankAccountsRes.data);
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
                <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                            <FormSelect
                                label="Podrazumijevani Bankovni Račun"
                                value={formData.default_bank_account_id || ""}
                                onChange={(val: string) => setFormData({ ...formData, default_bank_account_id: val ? parseInt(val) : null })}
                                options={[
                                    { value: "", label: "Nije odabrano" },
                                    ...bankAccounts.map(b => ({ value: b.id.toString(), label: `${b.bank_name} (${b.account_number})` }))
                                ]}
                            />
                        </div>
                    </div>

                    {/* Numbering */}
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
                        <h3 className="text-lg font-black text-[var(--color-text-main)] border-b border-[var(--color-border)] pb-2 mb-6">
                            Numeracija
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center gap-3 md:col-span-2 py-2">
                                <label className="text-sm font-bold text-[var(--color-text-main)] cursor-pointer flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={formData.invoice_numbering_reset_yearly}
                                        onChange={(e) => setFormData({ ...formData, invoice_numbering_reset_yearly: e.target.checked })}
                                        className="w-5 h-5 accent-primary rounded cursor-pointer"
                                    />
                                    Resetuj brojač godišnje
                                </label>
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

                    {/* Footer / Notes */}
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
                        <h3 className="text-lg font-black text-[var(--color-text-main)] border-b border-[var(--color-border)] pb-2 mb-6">
                            Podnožje i Napomene
                        </h3>
                        <div className="space-y-6">
                            <FormTextarea
                                label="Linije u podnožju fakture"
                                value={formData.invoice_footer_lines?.join('\n') || ""}
                                onChange={(val: string) => setFormData({ ...formData, invoice_footer_lines: val.split('\n') })}
                                rows={4}
                                placeholder="Unesite svaku liniju u novi red..."
                            />
                            <p className="text-[10px] text-[var(--color-text-dim)] font-medium -mt-4 pl-1">
                                Ove linije će biti prikazane na dnu svake fakture (npr. podaci o registraciji, napomene o porezu itd.)
                            </p>
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
