import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/hooks/useAuth";
import { getArticles, createArticle, updateArticle, deleteArticle } from "~/api/articles";
import type { Article } from "~/types/article";
import type { Company } from "~/types/company";
import {
    BoxesIcon,
    TrashIcon,
    PencilIcon,
    HashIcon,
    TagIcon,
    DollarIcon,
    CheckCircleIcon,
} from "~/components/ui/icons";
import { AppLayout } from "~/components/layout/AppLayout";
import { Drawer } from "~/components/layout/Drawer";
import { Toast, type ToastType } from "~/components/ui/Toast";
import { ConfirmModal } from "~/components/ui/ConfirmModal";
import { Pagination } from "~/components/ui/Pagination";
import { StatusBadge } from "~/components/ui/StatusBadge";
import { Input } from "~/components/ui/Input";
import { EntityCard } from "~/components/ui/EntityCard";
import { EmptyState } from "~/components/ui/EmptyState";
import { DetailsItem } from "~/components/ui/DetailsItem";
import { LoadingState } from "~/components/ui/LoadingState";
import type { PaginationMeta } from "~/types/api";

export default function ArticlesPage() {
    const { user, token, isAuthenticated } = useAuth();

    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [articles, setArticles] = useState<Article[]>([]);
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);

    // Toast state
    const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
        message: "",
        type: "success",
        isVisible: false,
    });

    // Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Drawer States
    const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
    const [formDrawerOpen, setFormDrawerOpen] = useState(false);
    const [activeArticle, setActiveArticle] = useState<Article | null>(null);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");

    // Form State
    const [formData, setFormData] = useState<Partial<Article> & { price?: number }>({
        name: "",
        description: "",
        type: "goods",
        unit: "kom",
        tax_category: "VAT20",
        is_active: true,
        prices_meta: {},
        price: 0
    });

    useEffect(() => {
        if (user && user.companies.length > 0 && !selectedCompany) {
            setSelectedCompany(user.companies[0]);
        }
    }, [user, selectedCompany]);

    const showToast = (message: string, type: ToastType) => {
        setToast({ message, type, isVisible: true });
    };

    const fetchArticles = useCallback(async (page: number = 1) => {
        if (!selectedCompany || !token) return;
        setLoading(true);
        try {
            const response = await getArticles(selectedCompany.slug, token, page);
            setArticles(response.data);
            setPagination(response.meta);
            setCurrentPage(page);
        } catch (error: any) {
            showToast(error.message || "Greška pri dohvatanju artikala", "error");
        } finally {
            setLoading(false);
        }
    }, [selectedCompany, token]);

    useEffect(() => {
        if (isAuthenticated && selectedCompany) {
            fetchArticles(currentPage);
        }
    }, [isAuthenticated, selectedCompany, currentPage, fetchArticles]);

    const handleRowClick = (article: Article) => {
        setActiveArticle(article);
        setViewDrawerOpen(true);
    };

    const openCreateForm = () => {
        setFormMode("create");
        setFormData({
            name: "",
            description: "",
            type: "goods",
            unit: "kom",
            tax_category: "VAT20",
            is_active: true,
            prices_meta: {},
            price: 0
        });
        setFormDrawerOpen(true);
    };

    const openEditForm = () => {
        if (!activeArticle) return;
        setFormMode("edit");
        const firstCurrency = activeArticle.prices_meta ? Object.keys(activeArticle.prices_meta)[0] : null;
        setFormData({
            ...activeArticle,
            price: firstCurrency ? (activeArticle.prices_meta?.[firstCurrency] || 0) : 0
        });
        setViewDrawerOpen(false);
        setFormDrawerOpen(true);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCompany || !token) return;

        setLoading(true);

        // Preparation of data for API
        const apiData = {
            ...formData,
            prices_meta: formData.prices_meta || { BAM: formData.price || 0 }
        };
        delete (apiData as any).price;

        try {
            if (formMode === "create") {
                await createArticle(selectedCompany.slug, token, apiData);
                showToast("Artikal uspješno kreiran", "success");
            } else if (activeArticle) {
                await updateArticle(selectedCompany.slug, activeArticle.id, token, apiData);
                showToast("Artikal uspješno ažuriran", "success");
            }
            setFormDrawerOpen(false);
            fetchArticles(currentPage);
        } catch (err: any) {
            showToast(err.message || "Greška pri čuvanju artikla", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!activeArticle || !selectedCompany || !token) return;

        setLoading(true);
        try {
            await deleteArticle(selectedCompany.slug, activeArticle.id, token);
            showToast("Artikal uspješno obrisan", "info");
            setViewDrawerOpen(false);
            fetchArticles(currentPage);
        } catch (err: any) {
            showToast(err.message || "Greška pri brisanju artikla", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        let finalValue: any = value;

        if (type === 'checkbox') {
            finalValue = (e.target as HTMLInputElement).checked;
        } else if (type === 'number') {
            finalValue = value === "" ? 0 : parseFloat(value);
        }

        setFormData(prev => ({
            ...prev,
            [name]: finalValue
        }));
    };


    return (
        <AppLayout
            title="articles"
            selectedCompany={selectedCompany}
            onCompanyChange={setSelectedCompany}
            actions={
                <button
                    onClick={openCreateForm}
                    className="cursor-pointer h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold text-sm border border-primary/20 hover:bg-primary hover:text-white transition-all shadow-glow-primary"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" /><path d="M12 5v14" />
                    </svg>
                </button>
            }
        >
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Obriši artikal"
                message={`Da li ste sigurni da želite trajno obrisati artikal ${activeArticle?.name}? Ova akcija se ne može poništiti.`}
            />

            <div className="space-y-4">
                {articles.map((article) => (
                    <EntityCard
                        key={article.id}
                        onClick={() => handleRowClick(article)}
                    >
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-primary/10">
                                    <BoxesIcon className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-base font-black text-white tracking-tighter italic leading-tight group-hover:text-primary transition-colors">
                                        {article.name}
                                    </span>
                                    <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">{article.type_label}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <StatusBadge
                                    label={article.type_label}
                                    color={article.type === 'products' ? 'blue' : 'amber'}
                                />
                            </div>
                        </div>

                        <div className="h-[1px] w-full bg-white/5" />

                        <div className="flex justify-between items-end">
                            <div className="flex gap-4">
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1 text-gray-600">
                                        <TagIcon className="w-2 h-2" />
                                        <span className="text-[7px] font-black uppercase tracking-tighter">Jedinica</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-gray-400">
                                        {article.unit}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1 text-gray-600">
                                        <HashIcon className="w-2 h-2" />
                                        <span className="text-[7px] font-black uppercase tracking-tighter">Porez</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-gray-400">
                                        {article.tax_category}
                                    </p>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="flex items-center gap-1 text-gray-600 justify-end mb-0.5">
                                    <DollarIcon className="w-2 h-2" />
                                    <span className="text-[7px] font-black uppercase tracking-tighter">Cijena</span>
                                </div>
                                <p className="text-lg font-black text-white tracking-tighter italic leading-none">
                                    {article.prices_meta && Object.values(article.prices_meta)[0]} <span className="text-[10px] opacity-60 not-italic uppercase">{article.prices_meta && Object.keys(article.prices_meta)[0]}</span>
                                </p>
                            </div>
                        </div>
                    </EntityCard>
                ))}

                {loading && !viewDrawerOpen && !formDrawerOpen && <LoadingState />}

                {!loading && articles.length === 0 && (
                    <EmptyState icon={BoxesIcon} message="Nema pronađenih artikala" />
                )}
            </div>

            {pagination && (
                <Pagination
                    pagination={pagination}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    loading={loading}
                />
            )}

            <Drawer
                title="Detalji artikla"
                isOpen={viewDrawerOpen}
                onClose={() => setViewDrawerOpen(false)}
            >
                {activeArticle && (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-[24px] border border-white/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <BoxesIcon className="h-16 w-16 text-white" />
                            </div>
                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20 bg-primary z-10 shrink-0`}>
                                {activeArticle.name.substring(0, 1).toUpperCase()}
                            </div>
                            <div className="z-10 min-w-0">
                                <p className="font-black text-lg text-white tracking-tighter italic leading-tight truncate">{activeArticle.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <StatusBadge
                                        label={activeArticle.is_active ? 'Aktivan' : 'Neaktivan'}
                                        color={activeArticle.is_active ? 'green' : 'gray'}
                                    />
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/10 text-primary`}>
                                        {activeArticle.type_label}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {activeArticle.description && (
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest mb-1">Opis</p>
                                <p className="text-[11px] font-bold text-gray-300 italic leading-relaxed">{activeArticle.description}</p>
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            {activeArticle.prices_meta && typeof activeArticle.prices_meta === 'object' && !Array.isArray(activeArticle.prices_meta) ? (
                                Object.entries(activeArticle.prices_meta)
                                    .sort(([a], [b]) => a.localeCompare(b))
                                    .map(([currency, amount]) => (
                                        <DetailsItem key={currency} icon={DollarIcon} label={`Cijena (${currency})`} value={`${amount || 0} ${currency}`} color="bg-green-500/10 text-green-400" />
                                    ))
                            ) : (
                                <DetailsItem icon={DollarIcon} label="Cijena" value="0 EUR" color="bg-green-500/10 text-green-400" />
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <DetailsItem icon={TagIcon} label="Jedinica mjere" value={activeArticle.unit} />
                            <DetailsItem icon={HashIcon} label="Porezna kategorija" value={activeArticle.tax_category} />
                            <DetailsItem icon={CheckCircleIcon} label="Status" value={activeArticle.is_active} />
                        </div>

                        <div className="flex flex-col gap-2 pt-2">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all group"
                                >
                                    <TrashIcon className="h-3.5 w-3.5 transition-transform group-hover:rotate-12" />
                                    Obriši
                                </button>
                                <button
                                    onClick={openEditForm}
                                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-glow-primary hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    <PencilIcon className="h-3.5 w-3.5" />
                                    Uredi
                                </button>
                            </div>
                            <button
                                onClick={() => setViewDrawerOpen(false)}
                                className="w-full py-3.5 bg-white/5 text-gray-400 border border-white/5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all"
                            >
                                Zatvori
                            </button>
                        </div>
                    </div>
                )}
            </Drawer>

            <Drawer
                title={formMode === 'create' ? "Novi artikal" : "Uredi artikal"}
                isOpen={formDrawerOpen}
                onClose={() => setFormDrawerOpen(false)}
            >
                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <Input
                        label="Naziv artikla"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="npr. Web Razvoj"
                    />

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 ml-1">Opis</label>
                        <textarea
                            name="description"
                            value={formData.description || ""}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-gray-700 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm outline-none resize-none"
                            placeholder="Kratki opis artikla..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 ml-1">Tip</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3.5 bg-[#16161E] border border-white/10 rounded-2xl text-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-black text-[11px] uppercase tracking-widest appearance-none outline-none"
                            >
                                <option value="goods">ROBA</option>
                                <option value="services">USLUGE</option>
                                <option value="products">PROIZVODI</option>
                            </select>
                        </div>
                        <Input
                            label="Cijena (EUR)"
                            name="price"
                            type="number"
                            step="0.01"
                            icon={DollarIcon}
                            value={formData.price}
                            onChange={handleInputChange}
                            placeholder="0.00"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Jedinica mjere"
                            name="unit"
                            value={formData.unit}
                            onChange={handleInputChange}
                            placeholder="kom, sat, kg..."
                        />
                        <Input
                            label="Porezna kategorija"
                            name="tax_category"
                            value={formData.tax_category}
                            onChange={handleInputChange}
                            placeholder="VAT20"
                        />
                    </div>

                    <label
                        htmlFor="is_active"
                        className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 cursor-pointer"
                    >
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                id="is_active"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleInputChange}
                                className="sr-only peer"
                            />

                            <div className="w-9 h-5 bg-white/10 rounded-full
                      peer-focus:outline-none
                      peer-checked:bg-primary
                      after:content-['']
                      after:absolute after:top-[2px] after:left-[2px]
                      after:h-4 after:w-4 after:rounded-full
                      after:bg-gray-400 after:border after:border-gray-300
                      after:transition-all
                      peer-checked:after:translate-x-full
                      peer-checked:after:bg-white">
                            </div>
                        </div>

                        <span className="text-[13px] font-bold text-gray-300">
                            Artikal je aktivan
                        </span>
                    </label>

                    <div className="flex flex-col gap-2 pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-primary text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] shadow-glow-primary hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <span>{formMode === 'create' ? "Kreiraj artikal" : "Sačuvaj izmjene"}</span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormDrawerOpen(false)}
                            className="w-full py-3 bg-white/5 text-gray-400 border border-white/5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all"
                        >
                            Odustani
                        </button>
                    </div>
                </form>
            </Drawer>
        </AppLayout>
    );
}
