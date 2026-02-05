import React, { useEffect, useState } from "react";
import { AppLayout } from "~/components/layout/AppLayout";
import { useAuth } from "~/hooks/useAuth";
import { getMe } from "~/api/config";
import { updateCompanySettings } from "~/api/settings";
import type { CompanySettings, AppConfigData } from "~/types/config";
import type { Company } from "~/types/company";
import { Toast, type ToastType } from "~/components/ui/Toast";
import { CheckCircleIcon, ArrowLeftIcon } from "~/components/ui/icons";
import { Link, useNavigate } from "react-router";

export default function GeneralSettingsPage() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [configData, setConfigData] = useState<AppConfigData | null>(null);
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

    useEffect(() => {
        if (user && user.companies.length > 0 && !selectedCompany) {
            setSelectedCompany(user.companies[0]);
        }
    }, [user, selectedCompany]);

    useEffect(() => {
        if (!token || !selectedCompany) return;

        const loadData = async () => {
            setLoading(true);
            try {
                const meRes = await getMe(token, selectedCompany.slug);
                setConfigData(meRes.data);
                setFormData(meRes.data.company_settings);
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
            onCompanyChange={setSelectedCompany}
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

function FormInput({ label, value, onChange, type = "text", required = false, maxLength }: any) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-dim)] pl-1">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                maxLength={maxLength}
                className="w-full h-11 px-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium placeholder:text-[var(--color-text-muted)]"
            />
        </div>
    );
}

function FormSelect({ label, value, onChange, options }: any) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-dim)] pl-1">{label}</label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full h-11 px-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium appearance-none cursor-pointer"
                >
                    <option value="">Odaberi...</option>
                    {options.map((opt: any) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)] pointer-events-none">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
            </div>
        </div>
    );
}
