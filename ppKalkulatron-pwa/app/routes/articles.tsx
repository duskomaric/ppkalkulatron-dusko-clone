import { useEffect, useState, useCallback } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useAuth } from "~/hooks/useAuth";
import { getArticles, createArticle, updateArticle, deleteArticle } from "~/api/articles";
import { getCurrencies, getMe } from "~/api/config";
import type { Article, ArticleInput, ArticleType } from "~/types/article";
import type { Currency, SelectOption } from "~/types/config";
import {
    BoxesIcon,
    HashIcon,
    TagIcon,
    DollarIcon,
    CheckCircleIcon,
    FileSlidersIcon,
} from "~/components/ui/icons";
import { AppLayout } from "~/components/layout/AppLayout";
import { CreateButton } from "~/components/ui/CreateButton";
import { Toast } from "~/components/ui/Toast";
import { ConfirmModal } from "~/components/ui/ConfirmModal";
import { Pagination } from "~/components/ui/Pagination";
import { StatusBadge } from "~/components/ui/StatusBadge";
import { Input } from "~/components/ui/Input";
import { ResponsiveEntityCard } from "~/components/ui/ResponsiveEntityCard";
import { EmptyState } from "~/components/ui/EmptyState";
import { DetailsItem } from "~/components/ui/DetailsItem";
import { LoadingState } from "~/components/ui/LoadingState";
import { DetailDrawer } from "~/components/ui/DetailDrawer";
import { FormDrawer } from "~/components/ui/FormDrawer";
import { MetaItem } from "~/components/ui/MetaItem";
import { Toggle } from "~/components/ui/Toggle";
import { SectionBlock } from "~/components/ui/SectionBlock";
import { SectionHeader } from "~/components/ui/SectionHeader";
import { DetailsGrid } from "~/components/ui/DetailsGrid";
import { ListHeader } from "~/components/ui/ListHeader";
import { FilterBar } from "~/components/ui/FilterBar";
import { FilterPillSelect } from "~/components/ui/FilterPillSelect";
import { FilterSearchInput } from "~/components/ui/FilterSearchInput";
import { ActiveFiltersBar } from "~/components/ui/ActiveFiltersBar";
import type { PaginationMeta } from "~/types/api";
import { useToast } from "~/hooks/useToast";

export default function ArticlesPage() {
    const { selectedCompany, updateSelectedCompany, token, isAuthenticated } = useAuth();

    const [articles, setArticles] = useState<Article[]>([]);
    const [taxRates, setTaxRates] = useState<{ value: string; label: string; rate: number }[]>([]);
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [articleTypes, setArticleTypes] = useState<SelectOption[]>([]);
    const [units, setUnits] = useState<SelectOption[]>([]);
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);

    const { toast, showToast, hideToast } = useToast();

    // Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [taxFilter, setTaxFilter] = useState("");
    const [filtersOpen, setFiltersOpen] = useState(false);

    // Drawer States
    const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
    const [formDrawerOpen, setFormDrawerOpen] = useState(false);
    const [activeArticle, setActiveArticle] = useState<Article | null>(null);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");

    // Form State
    type ArticleFormData = Omit<ArticleInput, "type" | "unit" | "is_active" | "prices_meta"> & {
        type: ArticleType;
        unit: string;
        is_active: boolean;
        pricesByCurrency?: Record<string, number>;
    };

    const [formData, setFormData] = useState<ArticleFormData>({
        name: "",
        description: "",
        type: "goods",
        unit: "kom",
        tax_rate: null,
        is_active: true,
        pricesByCurrency: {}
    });

    // Init company handled by useAuth

    const fetchArticles = useCallback(async (page: number = 1) => {
        if (!selectedCompany || !token) return;
        setLoading(true);
        try {
            const [articlesRes, currenciesRes, meRes] = await Promise.all([
                getArticles(selectedCompany.slug, token, page, {
                    search: searchQuery.trim() || undefined,
                    status: statusFilter || undefined,
                    type: typeFilter || undefined,
                    tax_rate: taxFilter || undefined,
                }),
                getCurrencies(selectedCompany.slug, token),
                getMe(token, selectedCompany.slug),
            ]);
            setArticles(articlesRes.data);
            setCurrencies(currenciesRes.data);
            setArticleTypes(meRes.data.article_types || []);
            setUnits(meRes.data.units || []);
            setTaxRates(meRes.data.tax_rates || []);
            setPagination(articlesRes.meta);
            setCurrentPage(page);
        } catch (error: any) {
            showToast(error.message || "Greška pri dohvatanju artikala", "error");
        } finally {
            setLoading(false);
        }
    }, [selectedCompany, token, searchQuery, statusFilter, typeFilter, taxFilter]);

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
        const initialPrices: Record<string, number> = {};
        currencies.forEach(c => { initialPrices[c.code] = 0; });
        setFormData({
            name: "",
            description: "",
            type: (articleTypes[0]?.value as ArticleType) ?? "goods",
            unit: units[0]?.value ?? "kom",
            tax_rate: taxRates[0]?.value ?? null,
            is_active: true,
            pricesByCurrency: initialPrices
        });
        setFormDrawerOpen(true);
    };

    const openEditForm = () => {
        if (!activeArticle) return;
        setFormMode("edit");
        const pricesByCurrency: Record<string, number> = {};
        currencies.forEach(c => {
            pricesByCurrency[c.code] = activeArticle.prices_meta?.[c.code] ?? 0;
        });
        setFormData({
            name: activeArticle.name,
            description: activeArticle.description ?? "",
            type: activeArticle.type,
            unit: activeArticle.unit,
            tax_rate: activeArticle.tax_rate?.label ?? null,
            is_active: activeArticle.is_active,
            pricesByCurrency
        });
        setViewDrawerOpen(false);
        setFormDrawerOpen(true);
    };

    const handleFormSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedCompany || !token) return;

        setLoading(true);

        // Build prices_meta from pricesByCurrency (filter out zeros if desired, or keep all)
        const prices_meta: Record<string, number> = {};
        Object.entries(formData.pricesByCurrency || {}).forEach(([code, val]) => {
            if (val != null && !Number.isNaN(val)) prices_meta[code] = val;
        });

        const apiData: ArticleInput = {
            name: formData.name,
            description: formData.description ?? null,
            type: formData.type ?? "goods",
            unit: formData.unit ?? "kom",
            tax_rate: formData.tax_rate ?? null,
            is_active: formData.is_active ?? true,
            prices_meta
        };

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
            const res = await deleteArticle(selectedCompany.slug, activeArticle.id, token);
            showToast(res.message || "Artikal uspješno obrisan", "info");
            setViewDrawerOpen(false);
            fetchArticles(currentPage);
        } catch (err: any) {
            showToast(err.message || "Greška pri brisanju artikla", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        let finalValue: any = value;

        if (type === 'checkbox') {
            finalValue = (e.target as HTMLInputElement).checked;
        } else if (type === 'number') {
            finalValue = value === "" ? 0 : parseFloat(value);
        } else if (name === 'tax_rate') {
            finalValue = value === "" ? null : value;
        }

        setFormData(prev => ({
            ...prev,
            [name]: finalValue
        }));
    };

    const statusOptions = [
        { value: "", label: "Status: Svi" },
        { value: "active", label: "Status: Aktivan" },
        { value: "inactive", label: "Status: Neaktivan" },
    ];

    const typeOptions = [
        { value: "", label: "Tip: Svi" },
        ...articleTypes.map((t) => ({
            value: t.value,
            label: `Tip: ${t.label}`,
        })),
    ];

    const taxOptions = [
        { value: "", label: "Porez: Svi" },
        { value: "none", label: "Porez: Bez poreza" },
        ...taxRates.map((t) => ({
            value: t.value,
            label: `Porez: ${t.label} (${t.rate}%)`,
        })),
    ];

    const activeFilters = [
        ...(searchQuery.trim()
            ? [{
                id: "search",
                label: "Pretraga",
                value: searchQuery.trim(),
                onClear: () => setSearchQuery(""),
            }]
            : []),
        ...(statusFilter
            ? [{
                id: "status",
                label: "Status",
                value: statusFilter === "active" ? "Aktivan" : "Neaktivan",
                onClear: () => setStatusFilter(""),
            }]
            : []),
        ...(typeFilter
            ? [{
                id: "type",
                label: "Tip",
                value: articleTypes.find((t) => t.value === typeFilter)?.label || typeFilter,
                onClear: () => setTypeFilter(""),
            }]
            : []),
        ...(taxFilter
            ? [{
                id: "tax",
                label: "Porez",
                value: taxFilter === "none"
                    ? "Bez poreza"
                    : (taxRates.find((t) => t.value === taxFilter)?.label || taxFilter),
                onClear: () => setTaxFilter(""),
            }]
            : []),
    ];

    const resetFilters = () => {
        setSearchQuery("");
        setStatusFilter("");
        setTypeFilter("");
        setTaxFilter("");
        setCurrentPage(1);
    };


    return (
        <AppLayout
            title="articles"
            selectedCompany={selectedCompany}
            onCompanyChange={updateSelectedCompany}
            actions={
                <CreateButton label="Novi artikal" onClick={openCreateForm} />
            }
        >
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={hideToast}
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Obriši artikal"
                message={`Da li ste sigurni da želite trajno obrisati artikal ${activeArticle?.name}? Ova akcija se ne može poništiti.`}
            />

            <div className="space-y-3 mb-4">
                <FilterBar
                    actions={
                        <button
                            type="button"
                            onClick={() => setFiltersOpen((prev) => !prev)}
                            className={`h-9 px-4 rounded-full border text-[10px] font-black uppercase tracking-[0.18em] flex items-center gap-2 transition-colors ${
                                filtersOpen
                                    ? "border-primary/40 bg-primary/10 text-primary"
                                    : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:border-[var(--color-border-strong)]"
                            }`}
                        >
                            <FileSlidersIcon className="h-3.5 w-3.5" />
                            Filteri
                        </button>
                    }
                    search={
                        <FilterSearchInput
                            value={searchQuery}
                            onChange={(val) => {
                                setSearchQuery(val);
                                setCurrentPage(1);
                            }}
                            placeholder="Pretraži artikle..."
                        />
                    }
                />
                {filtersOpen && (
                    <div className="p-3 rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-surface)]">
                        <div className="flex flex-wrap gap-2">
                            <FilterPillSelect
                                value={statusFilter}
                                options={statusOptions}
                                onChange={(val) => {
                                    setStatusFilter(val);
                                    setCurrentPage(1);
                                }}
                            />
                            <FilterPillSelect
                                value={typeFilter}
                                options={typeOptions}
                                onChange={(val) => {
                                    setTypeFilter(val);
                                    setCurrentPage(1);
                                }}
                            />
                            <FilterPillSelect
                                value={taxFilter}
                                options={taxOptions}
                                onChange={(val) => {
                                    setTaxFilter(val);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                    </div>
                )}
                <ActiveFiltersBar filters={activeFilters} onReset={resetFilters} />
            </div>

            {/* Desktop: header */}
            <ListHeader
                grid="grid-cols-[minmax(0,1.4fr)_0.6fr_0.6fr_0.7fr_1fr]"
                columns={[
                    { label: "Artikal / Tip" },
                    { label: "Status" },
                    { label: "Jedinica" },
                    { label: "Porez" },
                    { label: "Cijene", align: "right" },
                ]}
            />

            {/* Cards */}
            <div className="space-y-4 md:space-y-3">
                {articles.map((article) => {
                    const priceEntries = article.prices_meta && typeof article.prices_meta === 'object' && !Array.isArray(article.prices_meta)
                        ? Object.entries(article.prices_meta)
                            .sort(([a], [b]) => a.localeCompare(b))
                        : null;

                    return (
                        <ResponsiveEntityCard
                            key={article.id}
                            onClick={() => handleRowClick(article)}
                            mobile={
                                <div>
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
                                            label={article.is_active ? "Aktivan" : "Neaktivan"}
                                            color={article.is_active ? "green" : "gray"}
                                        />
                                    </div>
                                    <div className="h-[1px] w-full bg-[var(--color-border)]" />
                                    <div className="flex justify-between items-end">
                                        <div className="flex gap-4">
                                            <MetaItem
                                                icon={TagIcon}
                                                label="Jedinica"
                                                value={article.unit || "—"}
                                            />
                                            <MetaItem
                                                icon={HashIcon}
                                                label="Porez"
                                                value={article.tax_rate ? `${article.tax_rate.label} (${article.tax_rate.rate}%)` : "—"}
                                            />
                                        </div>
                                        <MetaItem
                                            icon={DollarIcon}
                                            label="Cijene"
                                            className="items-end text-right"
                                            valueClassName={priceEntries ? "text-[var(--color-text-main)]" : ""}
                                            value={
                                                priceEntries ? (
                                                    <span className="inline-flex flex-wrap justify-end gap-x-2 gap-y-0.5">
                                                        {priceEntries.map(([curr, amt]) => (
                                                            <span key={curr} className="text-sm font-black text-[var(--color-text-main)] tracking-tighter italic leading-none">
                                                                {amt != null ? new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amt) : "0.00"}{" "}
                                                                <span className="text-[10px] opacity-60 not-italic uppercase font-bold">{curr}</span>
                                                            </span>
                                                        ))}
                                                    </span>
                                                ) : "—"
                                            }
                                        />
                                    </div>
                                </div>
                            }
                            desktop={
                                <div className="grid grid-cols-[minmax(0,1.4fr)_0.6fr_0.6fr_0.7fr_1fr] gap-3 items-center">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                            <BoxesIcon className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-[var(--color-text-main)] tracking-tighter italic truncate">
                                                {article.name}
                                            </p>
                                            <p className="text-[10px] font-bold text-[var(--color-text-dim)] uppercase tracking-widest">
                                                {article.type_label}
                                            </p>
                                        </div>
                                    </div>
                                    <StatusBadge
                                        label={article.is_active ? "Aktivan" : "Neaktivan"}
                                        color={article.is_active ? "green" : "gray"}
                                    />
                                    <div className="text-xs font-bold text-[var(--color-text-muted)]">
                                        {article.unit || "—"}
                                    </div>
                                    <div className="text-xs font-bold text-[var(--color-text-muted)]">
                                        {article.tax_rate ? `${article.tax_rate.label} (${article.tax_rate.rate}%)` : "—"}
                                    </div>
                                    <div className="text-right">
                                        <div className="flex flex-wrap justify-end gap-x-2 gap-y-0.5">
                                            {priceEntries
                                                ? priceEntries.map(([curr, amt]) => (
                                                    <p key={curr} className="text-sm font-black text-[var(--color-text-main)] tracking-tighter italic leading-none">
                                                        {amt != null ? new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amt) : "0.00"}{" "}
                                                        <span className="text-[10px] opacity-60 not-italic uppercase font-bold">{curr}</span>
                                                    </p>
                                                ))
                                                : <p className="text-sm font-bold text-[var(--color-text-dim)]">—</p>
                                            }
                                        </div>
                                    </div>
                                </div>
                            }
                        />
                    );
                })}
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
                    <div className="space-y-3">
                        {activeArticle.description && (
                            <SectionBlock variant="plain">
                                <SectionHeader icon={TagIcon} title="Opis" />
                                <p className="text-sm font-bold text-[var(--color-text-muted)] italic leading-relaxed">
                                    {activeArticle.description}
                                </p>
                            </SectionBlock>
                        )}

                        <SectionBlock variant="plain">
                            <SectionHeader icon={DollarIcon} title="Cijene" />
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
                        </SectionBlock>

                        <SectionBlock variant="plain">
                            <SectionHeader icon={HashIcon} title="Detalji" />
                            <DetailsGrid columns={2}>
                                <DetailsItem icon={TagIcon} label="Jedinica mjere" value={activeArticle.unit} />
                                <DetailsItem icon={HashIcon} label="Porezna stopa" value={activeArticle.tax_rate ? `${activeArticle.tax_rate.label} (${activeArticle.tax_rate.rate}%)` : "—"} />
                                <DetailsItem icon={CheckCircleIcon} label="Status" value={activeArticle.is_active ? "Aktivan" : "Neaktivan"} />
                            </DetailsGrid>
                        </SectionBlock>
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
                <SectionBlock variant="card">
                    <SectionHeader icon={BoxesIcon} title="Osnovno" />
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

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-dim)] ml-1">Tip</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl text-[var(--color-text-main)] focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-black text-[11px] uppercase tracking-widest appearance-none outline-none"
                        >
                            {articleTypes.map((at) => (
                                <option key={at.value} value={at.value}>{at.label}</option>
                            ))}
                        </select>
                    </div>
                </SectionBlock>

                <SectionBlock variant="card">
                    <SectionHeader icon={DollarIcon} title="Cijene" />
                    {currencies.length > 0 ? (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)] ml-1 block">Cijene po valuti (sa porezom)</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {currencies.map((curr) => (
                                    <Input
                                        key={curr.code}
                                        label={curr.code}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.pricesByCurrency?.[curr.code] ?? ""}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            setFormData(prev => ({
                                                ...prev,
                                                pricesByCurrency: {
                                                    ...(prev.pricesByCurrency || {}),
                                                    [curr.code]: Number.isNaN(val) ? 0 : val
                                                }
                                            }));
                                        }}
                                        placeholder="0.00"
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-[var(--color-text-dim)]">Dodajte valute u podešavanjima kompanije</p>
                    )}
                </SectionBlock>

                <SectionBlock variant="card">
                    <SectionHeader icon={TagIcon} title="Parametri" />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)] ml-1">Jedinica mjere</label>
                            <select
                                name="unit"
                                value={formData.unit}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl text-[var(--color-text-main)] focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-black text-[11px] uppercase tracking-widest appearance-none outline-none"
                            >
                                {units.map((u) => (
                                    <option key={u.value} value={u.value}>{u.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-dim)] ml-1">Porezna stopa (OFS)</label>
                            <select
                                name="tax_rate"
                                value={formData.tax_rate ?? ""}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl text-[var(--color-text-main)] focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-black text-[11px] uppercase tracking-widest appearance-none outline-none"
                            >
                                <option value="">—</option>
                                {taxRates.map((tr) => (
                                    <option key={tr.value} value={tr.value}>
                                        {tr.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </SectionBlock>

                <SectionBlock variant="card">
                    <SectionHeader icon={CheckCircleIcon} title="Status" />
                    <Toggle
                        id="is_active"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={(v) => handleInputChange({ target: { name: "is_active", type: "checkbox", checked: v } } as ChangeEvent<HTMLInputElement>)}
                        label="Artikal je aktivan"
                    />
                </SectionBlock>
            </FormDrawer>
        </AppLayout>
    );
}
