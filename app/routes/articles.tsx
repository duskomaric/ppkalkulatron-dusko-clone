import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/hooks/useAuth";
import { getArticles, createArticle, updateArticle, deleteArticle } from "~/api/articles";
import type { Article } from "~/types/article";
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
import { Toast, type ToastType } from "~/components/ui/Toast";
import { ConfirmModal } from "~/components/ui/ConfirmModal";
import { Pagination } from "~/components/ui/Pagination";
import { StatusBadge } from "~/components/ui/StatusBadge";
import { Input } from "~/components/ui/Input";
import { EntityCard } from "~/components/ui/EntityCard";
import { EmptyState } from "~/components/ui/EmptyState";
import { DetailsItem } from "~/components/ui/DetailsItem";
import { LoadingState } from "~/components/ui/LoadingState";
import { DetailDrawer } from "~/components/ui/DetailDrawer";
import { FormDrawer } from "~/components/ui/FormDrawer";
import type { PaginationMeta } from "~/types/api";

export default function ArticlesPage() {
    const { user, selectedCompany, updateSelectedCompany, token, isAuthenticated } = useAuth();

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

    // Init company handled by useAuth

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
            onCompanyChange={updateSelectedCompany}
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

            {/* Mobile: cards */}
            <div className="md:hidden space-y-4">
                {articles.map((article) => (
                    <EntityCard key={article.id} onClick={() => handleRowClick(article)}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-primary/10">
                                    <BoxesIcon className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-base font-black text-[var(--color-text-main)] tracking-tighter italic leading-tight group-hover:text-primary transition-colors">
                                        {article.name}
                                    </span>
                                    <p className="text-[10px] font-bold text-[var(--color-text-dim)] uppercase tracking-widest">{article.type_label}</p>
                                </div>
                            </div>
                            <StatusBadge
                                label={article.type_label}
                                color={article.type === 'products' ? 'blue' : 'amber'}
                            />
                        </div>
                        <div className="h-[1px] w-full bg-[var(--color-border)]" />
                        <div className="flex justify-between items-end">
                            <div className="flex gap-4">
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1 text-[var(--color-text-dim)]">
                                        <TagIcon className="w-2.5 h-2.5" />
                                        <span className="text-[9px] font-black uppercase tracking-tight">Jedinica</span>
                                    </div>
                                    <p className="text-xs font-bold text-[var(--color-text-muted)]">{article.unit}</p>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1 text-[var(--color-text-dim)]">
                                        <HashIcon className="w-2.5 h-2.5" />
                                        <span className="text-[9px] font-black uppercase tracking-tight">Porez</span>
                                    </div>
                                    <p className="text-xs font-bold text-[var(--color-text-muted)]">{article.tax_category}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-1 text-[var(--color-text-dim)] justify-end mb-0.5">
                                    <DollarIcon className="w-2.5 h-2.5" />
                                    <span className="text-[9px] font-black uppercase tracking-tight">Cijena</span>
                                </div>
                                <p className="text-lg font-black text-[var(--color-text-main)] tracking-tighter italic leading-none">
                                    {article.prices_meta && Object.values(article.prices_meta)[0]}{' '}
                                    <span className="text-[11px] opacity-60 not-italic uppercase">
                                        {article.prices_meta && Object.keys(article.prices_meta)[0]}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </EntityCard>
                ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-[var(--color-border)]">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/50">
                            <th className="text-left py-3 px-4 text-[10px] font-black uppercase tracking-wider text-[var(--color-text-dim)]">Naziv</th>
                            <th className="text-left py-3 px-4 text-[10px] font-black uppercase tracking-wider text-[var(--color-text-dim)]">Tip</th>
                            <th className="text-left py-3 px-4 text-[10px] font-black uppercase tracking-wider text-[var(--color-text-dim)]">Jedinica</th>
                            <th className="text-left py-3 px-4 text-[10px] font-black uppercase tracking-wider text-[var(--color-text-dim)]">Porez</th>
                            <th className="text-right py-3 px-4 text-[10px] font-black uppercase tracking-wider text-[var(--color-text-dim)]">Cijena</th>
                        </tr>
                    </thead>
                    <tbody>
                        {articles.map((article) => {
                            const firstPrice = article.prices_meta && Object.entries(article.prices_meta)[0];
                            return (
                                <tr
                                    key={article.id}
                                    onClick={() => handleRowClick(article)}
                                    className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] cursor-pointer transition-colors last:border-b-0"
                                >
                                    <td className="py-3 px-4">
                                        <span className="font-black text-[var(--color-text-main)] tracking-tight">{article.name}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <StatusBadge
                                            label={article.type_label}
                                            color={article.type === 'products' ? 'blue' : 'amber'}
                                        />
                                    </td>
                                    <td className="py-3 px-4 text-sm text-[var(--color-text-muted)]">{article.unit}</td>
                                    <td className="py-3 px-4 text-sm text-[var(--color-text-muted)]">{article.tax_category}</td>
                                    <td className="py-3 px-4 text-right font-black text-[var(--color-text-main)]">
                                        {firstPrice ? `${firstPrice[1]} ${firstPrice[0]}` : '—'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {loading && !viewDrawerOpen && !formDrawerOpen && <LoadingState />}

            {!loading && articles.length === 0 && (
                <EmptyState icon={BoxesIcon} message="Nema pronađenih artikala" />
            )}

            {pagination && (
                <Pagination
                    pagination={pagination}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    loading={loading}
                />
            )}

            <DetailDrawer
                title="Detalji artikla"
                isOpen={viewDrawerOpen}
                onClose={() => setViewDrawerOpen(false)}
                entityName={activeArticle?.name || ""}
                entityIcon={BoxesIcon}
                badges={
                    activeArticle && (
                        <>
                            <StatusBadge
                                label={activeArticle.is_active ? 'Aktivan' : 'Neaktivan'}
                                color={activeArticle.is_active ? 'green' : 'gray'}
                            />
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/10 text-primary`}>
                                {activeArticle.type_label}
                            </span>
                        </>
                    )
                }
                onEdit={openEditForm}
                onDelete={() => setIsDeleteModalOpen(true)}
            >
                {activeArticle && (
                    <div className="flex flex-col gap-4">
                        {activeArticle.description && (
                            <div className="p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                                <p className="text-[10px] font-black text-[var(--color-text-dim)] uppercase tracking-widest mb-1">Opis</p>
                                <p className="text-sm font-bold text-[var(--color-text-muted)] italic leading-relaxed">{activeArticle.description}</p>
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
                    </div>
                )}
            </DetailDrawer>

            <FormDrawer
                title={formMode === 'create' ? "Novi artikal" : "Uredi artikal"}
                isOpen={formDrawerOpen}
                onClose={() => setFormDrawerOpen(false)}
                onSubmit={handleFormSubmit}
                loading={loading}
                submitLabel={formMode === 'create' ? "Kreiraj artikal" : "Sačuvaj izmjene"}
            >
                <Input
                    label="Naziv artikla"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="npr. Web Razvoj"
                />

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-dim)] ml-1">Opis</label>
                    <textarea
                        name="description"
                        value={formData.description || ""}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-5 py-3.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl text-[var(--color-text-main)] placeholder:text-[var(--color-text-dim)] focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm outline-none resize-none"
                        placeholder="Kratki opis artikla..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-dim)] ml-1">Tip</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl text-[var(--color-text-main)] focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-black text-[11px] uppercase tracking-widest appearance-none outline-none"
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
                    className="flex items-center gap-3 p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] cursor-pointer"
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

                        <div className="w-9 h-5 bg-[var(--color-border-strong)] rounded-full
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

                    <span className="text-[13px] font-bold text-[var(--color-text-muted)]">
                        Artikal je aktivan
                    </span>
                </label>
            </FormDrawer>
        </AppLayout>
    );
}
