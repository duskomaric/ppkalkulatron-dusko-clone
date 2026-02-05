import React, { useEffect, useState } from "react";
import { AppLayout } from "~/components/layout/AppLayout";
import { useAuth } from "~/hooks/useAuth";
import {
    getBankAccounts,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount
} from "~/api/settings";
import type { BankAccount } from "~/types/config";
import type { Company } from "~/types/company";
import { Toast, type ToastType } from "~/components/ui/Toast";
import { ConfirmModal } from "~/components/ui/ConfirmModal";
import { PlusIcon, PencilIcon, TrashIcon, ArrowLeftIcon } from "~/components/ui/icons";
import { Link, useNavigate } from "react-router";

export default function BankAccountsPage() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit/Create State
    const [editingItem, setEditingItem] = useState<Partial<BankAccount> | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

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

    const loadAccounts = async () => {
        if (!selectedCompany || !token) return;
        setLoading(true);
        try {
            const res = await getBankAccounts(selectedCompany.slug, token);
            setAccounts(res.data);
        } catch (error) {
            console.error(error);
            showToast("Greška pri učitavanju", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadAccounts(); }, [selectedCompany, token]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem || !selectedCompany || !token) return;

        try {
            if (editingItem.id) {
                await updateBankAccount(selectedCompany.slug, token, editingItem.id, editingItem);
                showToast("Račun ažuriran", "success");
            } else {
                await createBankAccount(selectedCompany.slug, token, editingItem);
                showToast("Račun kreiran", "success");
            }
            setEditingItem(null);
            loadAccounts();
        } catch (error) {
            console.error(error);
            showToast("Greška", "error");
        }
    };

    const handleDelete = async () => {
        if (!itemToDelete || !selectedCompany || !token) return;
        try {
            await deleteBankAccount(selectedCompany.slug, token, itemToDelete);
            showToast("Račun obrisan", "success");
            loadAccounts();
        } catch (error) {
            showToast("Greška pri brisanju", "error");
        }
        setIsDeleteModalOpen(false);
    };

    if (!selectedCompany) return null;

    return (
        <AppLayout
            title="Bankovni Računi"
            selectedCompany={selectedCompany}
            onCompanyChange={setSelectedCompany}
        >
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <button 
                        onClick={() => navigate(-1)} 
                        className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-text-dim)] hover:text-primary transition-colors mb-2 cursor-pointer"
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Nazad
                    </button>
                    <h1 className="text-2xl font-black text-[var(--color-text-main)]">Bankovni Računi</h1>
                    <p className="text-[var(--color-text-dim)]">Upravljajte listom kompanijskih bankovnih računa.</p>
                </div>
                <button
                    onClick={() => setEditingItem({
                        bank_name: "", account_number: "", currency: "EUR", is_default: false
                    })}
                    className="bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-6 rounded-xl shadow-glow-primary transition-all flex items-center gap-2"
                >
                    <PlusIcon className="h-5 w-5" />
                    Novi Račun
                </button>
            </div>

            {loading && (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            )}

            {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {accounts.map(acc => (
                        <div key={acc.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] p-5 rounded-2xl relative group shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold text-[var(--color-text-main)] text-lg">{acc.bank_name}</h4>
                                    <p className="text-sm text-[var(--color-text-dim)] font-mono mt-1 tracking-wide">{acc.account_number}</p>
                                </div>
                                {acc.is_default && (
                                    <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">
                                        Default
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-4 text-xs font-bold text-[var(--color-text-muted)] mt-4 pt-4 border-t border-[var(--color-border)]">
                                <span>{acc.currency}</span>
                                {acc.swift && <span>SWIFT: {acc.swift}</span>}
                            </div>

                            <div className="absolute top-5 right-5 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => setEditingItem(acc)}
                                    className="h-8 w-8 bg-[var(--color-surface-hover)] hover:text-primary rounded-lg flex items-center justify-center transition-colors"
                                >
                                    <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => { setItemToDelete(acc.id); setIsDeleteModalOpen(true); }}
                                    className="h-8 w-8 bg-[var(--color-surface-hover)] hover:text-red-500 rounded-lg flex items-center justify-center transition-colors"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {accounts.length === 0 && (
                        <div className="col-span-1 md:col-span-2 text-center py-12 text-[var(--color-text-muted)] italic">
                            Nema dodatih računa.
                        </div>
                    )}
                </div>
            )}

            {editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <form onSubmit={handleSave} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-black mb-6 border-b border-[var(--color-border)] pb-4">
                            {editingItem.id ? "Izmjeni Račun" : "Novi Račun"}
                        </h3>
                        <div className="space-y-4">
                            <FormInput
                                label="Naziv Banke"
                                value={editingItem.bank_name || ""}
                                onChange={(val: string) => setEditingItem({ ...editingItem, bank_name: val })}
                                required
                            />
                            <FormInput
                                label="Broj Računa"
                                value={editingItem.account_number || ""}
                                onChange={(val: string) => setEditingItem({ ...editingItem, account_number: val })}
                                required
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormInput
                                    label="Valuta"
                                    value={editingItem.currency || ""}
                                    onChange={(val: string) => setEditingItem({ ...editingItem, currency: val })}
                                    required
                                />
                                <FormInput
                                    label="SWIFT (opciono)"
                                    value={editingItem.swift || ""}
                                    onChange={(val: string) => setEditingItem({ ...editingItem, swift: val })}
                                />
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <input
                                    type="checkbox"
                                    id="is_default_acc"
                                    checked={editingItem.is_default || false}
                                    onChange={(e) => setEditingItem({ ...editingItem, is_default: e.target.checked })}
                                    className="w-5 h-5 accent-primary rounded cursor-pointer"
                                />
                                <label htmlFor="is_default_acc" className="text-sm font-bold text-[var(--color-text-main)] cursor-pointer">Postavi kao podrazumijevani</label>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-[var(--color-border)]">
                            <button
                                type="button"
                                onClick={() => setEditingItem(null)}
                                className="px-5 py-2.5 text-sm font-bold text-[var(--color-text-dim)] hover:text-[var(--color-text-main)] transition-colors"
                            >
                                Odustani
                            </button>
                            <button
                                type="submit"
                                className="bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-6 rounded-xl shadow-glow-primary transition-all text-sm"
                            >
                                Sačuvaj
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Obriši račun?"
                message="Da li ste sigurni da želite obrisati ovaj bankovni račun? Ova radnja je nepovratna."
                confirmLabel="Obriši"
                cancelLabel="Odustani"
                type="danger"
            />
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
