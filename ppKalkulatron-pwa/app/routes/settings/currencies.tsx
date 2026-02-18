import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AppLayout } from "~/components/layout/AppLayout";
import { useAuth } from "~/hooks/useAuth";
import {
    createCurrency,
    updateCurrency
} from "~/api/settings";
import { getCurrencies } from "~/api/config";
import type { Currency } from "~/types/config";
import { Toast } from "~/components/ui/Toast";
import { Toggle } from "~/components/ui/Toggle";
import { ConfirmModal } from "~/components/ui/ConfirmModal";
import { PencilIcon } from "~/components/ui/icons";
import { CreateButton } from "~/components/ui/CreateButton";
import { useNavigate } from "react-router";
import { FormInput } from "~/components/ui/Input";
import { ModalForm } from "~/components/ui/ModalForm";
import { CardGrid } from "~/components/ui/CardGrid";
import { LoadingState } from "~/components/ui/LoadingState";
import { useToast } from "~/hooks/useToast";

export default function CurrenciesPage() {
    const { selectedCompany, updateSelectedCompany, token } = useAuth();
    const navigate = useNavigate();
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit/Create State
    const [editingItem, setEditingItem] = useState<Partial<Currency> | null>(null);

    const { toast, showToast, hideToast } = useToast();

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

    const handleSave = async (e: FormEvent) => {
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
                onClose={hideToast}
            />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-text-dim)] hover:text-primary transition-colors mb-2 cursor-pointer"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Nazad
                    </button>
                </div>
                <div>
                    <CreateButton
                        label="Nova valuta"
                        onClick={() => setEditingItem({
                            code: "", name: "", symbol: "", is_default: false
                        })}
                    />
                </div>
            </div>

            {loading && (
                <LoadingState />
            )}

            {!loading && (
                <CardGrid
                    gridClassName="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
                    isEmpty={currencies.length === 0}
                    empty={
                        <div className="col-span-1 md:col-span-3 text-center py-12 text-[var(--color-text-muted)] italic">
                            Nema dodatih valuta.
                        </div>
                    }
                >
                    {currencies.map(curr => (
                        <div key={curr.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] p-5 rounded-2xl relative group shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-center mb-3 pr-12">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 min-w-10 px-2 bg-[var(--color-surface-hover)] rounded-full flex items-center justify-center text-primary font-black text-sm">
                                        {curr.symbol}
                                    </div>
                                    <span className="font-bold text-[var(--color-text-main)] text-lg">{curr.code}</span>
                                </div>
                                {curr.is_default && (
                                    <span className="text-primary text-lg shrink-0" title="Podrazumijevana valuta">★</span>
                                )}
                            </div>
                            <p className="text-sm text-[var(--color-text-dim)] font-medium pl-1">{curr.name}</p>

                            <div className="absolute top-4 right-4 flex gap-2">
                                <button
                                    onClick={() => setEditingItem(curr)}
                                    className="h-8 w-8 bg-[var(--color-surface-hover)] hover:text-primary rounded-lg flex items-center justify-center transition-colors"
                                >
                                    <PencilIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </CardGrid>
            )}

            {editingItem && (
                <ModalForm
                    title={editingItem.id ? "Izmjeni Valutu" : "Nova Valuta"}
                    onSubmit={handleSave}
                    onClose={() => setEditingItem(null)}
                    sizeClassName="max-w-sm md:max-w-md"
                >
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
                </ModalForm>
            )}

        </AppLayout>
    );
}
