import React, { useEffect, useState } from "react";
import { AppLayout } from "~/components/layout/AppLayout";
import { useAuth } from "~/hooks/useAuth";
import {
    createCurrency,
    updateCurrency,
    deleteCurrency
} from "~/api/settings";
import { getCurrencies } from "~/api/config";
import type { Currency } from "~/types/config";
import { Toast, type ToastType } from "~/components/ui/Toast";
import { Toggle } from "~/components/ui/Toggle";
import { ConfirmModal } from "~/components/ui/ConfirmModal";
import { PencilIcon, TrashIcon, ArrowLeftIcon } from "~/components/ui/icons";
import { CreateButton } from "~/components/ui/CreateButton";
import { useNavigate } from "react-router";
import { FormInput } from "~/components/ui/Input";

export default function CurrenciesPage() {
    const { user, selectedCompany, updateSelectedCompany, token } = useAuth();
    const navigate = useNavigate();
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit/Create State
    const [editingItem, setEditingItem] = useState<Partial<Currency> | null>(null);
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

    // Init company handled by useAuth

    const loadData = async () => {
        if (!selectedCompany || !token) return;
        setLoading(true);
        try {
            const res = await getCurrencies(selectedCompany.slug, token);
            setCurrencies(res.data);
        } catch (error) {
            console.error(error);
            showToast("Greška pri učitavanju", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [selectedCompany, token]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem || !selectedCompany || !token) return;

        try {
            if (editingItem.id) {
                await updateCurrency(selectedCompany.slug, token, editingItem.id, editingItem);
                showToast("Valuta ažurirana", "success");
            } else {
                await createCurrency(selectedCompany.slug, token, editingItem);
                showToast("Valuta kreirana", "success");
            }
            setEditingItem(null);
            loadData();
        } catch (error) {
            console.error(error);
            showToast("Greška", "error");
        }
    };

    const handleDelete = async () => {
        if (!itemToDelete || !selectedCompany || !token) return;
        try {
            await deleteCurrency(selectedCompany.slug, token, itemToDelete);
            showToast("Valuta obrisana", "success");
            loadData();
        } catch (error) {
            showToast("Greška pri brisanju", "error");
        }
        setIsDeleteModalOpen(false);
    };

    if (!selectedCompany) return null;

    return (
        <AppLayout
            title="Valute"
            selectedCompany={selectedCompany}
            onCompanyChange={updateSelectedCompany}
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
                    <h1 className="text-2xl font-black text-[var(--color-text-main)]">Valute</h1>
                    <p className="text-[var(--color-text-dim)]">Upravljajte listom valuta koje vaša kompanija koristi.</p>
                </div>
                <CreateButton
                    label="Nova valuta"
                    onClick={() => setEditingItem({
                        code: "", name: "", symbol: "", is_default: false
                    })}
                />
            </div>

            {loading && (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            )}

            {!loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {currencies.map(curr => (
                        <div key={curr.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] p-5 rounded-2xl relative group shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 min-w-10 px-2 bg-[var(--color-surface-hover)] rounded-full flex items-center justify-center text-primary font-black text-sm">
                                        {curr.symbol}
                                    </div>
                                    <span className="font-bold text-[var(--color-text-main)] text-lg">{curr.code}</span>
                                </div>
                                {curr.is_default && (
                                    <span className="text-primary text-lg" title="Podrazumijevana valuta">★</span>
                                )}
                            </div>
                            <p className="text-sm text-[var(--color-text-dim)] font-medium pl-1">{curr.name}</p>

                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => setEditingItem(curr)}
                                    className="h-8 w-8 bg-[var(--color-surface-hover)] hover:text-primary rounded-lg flex items-center justify-center transition-colors"
                                >
                                    <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => { setItemToDelete(curr.id); setIsDeleteModalOpen(true); }}
                                    className="h-8 w-8 bg-[var(--color-surface-hover)] hover:text-red-500 rounded-lg flex items-center justify-center transition-colors"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {currencies.length === 0 && (
                        <div className="col-span-1 md:col-span-3 text-center py-12 text-[var(--color-text-muted)] italic">
                            Nema dodatih valuta.
                        </div>
                    )}
                </div>
            )}

            {editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <form onSubmit={handleSave} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-sm md:max-w-md shadow-2xl">
                        <h3 className="text-xl font-black mb-6 border-b border-[var(--color-border)] pb-4">
                            {editingItem.id ? "Izmjeni Valutu" : "Nova Valuta"}
                        </h3>
                        <div className="space-y-4">
                            <FormInput
                                label="Kod (npr. EUR)"
                                value={editingItem.code || ""}
                                onChange={(val: string) => setEditingItem({ ...editingItem, code: val.toUpperCase() })}
                                required
                                maxLength={3}
                            />
                            <FormInput
                                label="Simbol (npr. €)"
                                value={editingItem.symbol || ""}
                                onChange={(val: string) => setEditingItem({ ...editingItem, symbol: val })}
                                required
                            />
                            <FormInput
                                label="Naziv"
                                value={editingItem.name || ""}
                                onChange={(val: string) => setEditingItem({ ...editingItem, name: val })}
                                required
                            />
                            <div className="pt-2">
                                <Toggle
                                    id="is_default_curr"
                                    checked={editingItem.is_default || false}
                                    onChange={(v) => setEditingItem({ ...editingItem, is_default: v })}
                                    label="Postavi kao podrazumijevanu"
                                />
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
                title="Obriši valutu?"
                message="Da li ste sigurni da želite obrisati ovu valutu?"
                confirmLabel="Obriši"
                cancelLabel="Odustani"
                type="danger"
            />
        </AppLayout>
    );
}
