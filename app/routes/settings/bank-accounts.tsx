import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AppLayout } from "~/components/layout/AppLayout";
import { useAuth } from "~/hooks/useAuth";
import {
    getBankAccounts,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount
} from "~/api/settings";
import type { BankAccount } from "~/types/config";
import { Toast } from "~/components/ui/Toast";
import { Toggle } from "~/components/ui/Toggle";
import { ConfirmModal } from "~/components/ui/ConfirmModal";
import { PencilIcon, TrashIcon } from "~/components/ui/icons";
import { CreateButton } from "~/components/ui/CreateButton";
import { useNavigate } from "react-router";
import { FormInput } from "~/components/ui/Input";
import { PageHeader } from "~/components/ui/PageHeader";
import { ModalForm } from "~/components/ui/ModalForm";
import { CardGrid } from "~/components/ui/CardGrid";
import { LoadingState } from "~/components/ui/LoadingState";
import { useToast } from "~/hooks/useToast";

export default function BankAccountsPage() {
    const { selectedCompany, updateSelectedCompany, token } = useAuth();
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit/Create State
    const [editingItem, setEditingItem] = useState<Partial<BankAccount> | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    const { toast, showToast, hideToast } = useToast();

    // Init company handled by useAuth

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

    const handleSave = async (e: FormEvent) => {
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
            onCompanyChange={updateSelectedCompany}
        >
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={hideToast}
            />

            <PageHeader
                title="Bankovni Računi"
                description="Upravljajte listom kompanijskih bankovnih računa."
                onBack={() => navigate(-1)}
                actions={
                    <CreateButton
                        label="Novi račun"
                        onClick={() => setEditingItem({
                            bank_name: "", account_number: "", currency: "EUR", is_default: false
                        })}
                    />
                }
            />

            {loading && (
                <LoadingState />
            )}

            {!loading && (
                <CardGrid
                    gridClassName="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
                    isEmpty={accounts.length === 0}
                    empty={
                        <div className="col-span-1 md:col-span-2 text-center py-12 text-[var(--color-text-muted)] italic">
                            Nema dodatih računa.
                        </div>
                    }
                >
                    {accounts.map(acc => (
                        <div key={acc.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] p-5 rounded-2xl relative group shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold text-[var(--color-text-main)] text-lg">{acc.bank_name}</h4>
                                    <p className="text-sm text-[var(--color-text-dim)] font-mono mt-1 tracking-wide">{acc.account_number}</p>
                                </div>
                                {acc.is_default && (
                                    <span className="text-primary text-lg" title="Podrazumijevani račun">★</span>
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
                </CardGrid>
            )}

            {editingItem && (
                <ModalForm
                    title={editingItem.id ? "Izmjeni Račun" : "Novi Račun"}
                    onSubmit={handleSave}
                    onClose={() => setEditingItem(null)}
                    sizeClassName="max-w-md md:max-w-lg"
                >
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
                    <FormInput
                        label="SWIFT (opciono)"
                        value={editingItem.swift || ""}
                        onChange={(val: string) => setEditingItem({ ...editingItem, swift: val })}
                    />
                    <div className="pt-2">
                        <Toggle
                            id="is_default_acc"
                            checked={editingItem.is_default || false}
                            onChange={(v) => setEditingItem({ ...editingItem, is_default: v })}
                            label="Postavi kao podrazumijevani"
                        />
                    </div>
                </ModalForm>
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
