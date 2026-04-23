import { useEffect, useState, useCallback } from "react";
import type { FormEvent } from "react";
import { useAuth } from "~/hooks/useAuth";
import { useSelectedYear } from "~/contexts/YearContext";
import {
    getIncomeBookEntries,
    createIncomeBookEntry,
    calculateIncomeBookEntryAllocation,
    updateIncomeBookEntry,
    deleteIncomeBookEntry,
    downloadIncomeBookPdf,
} from "~/api/incomeBookEntries";
import { getInvoices } from "~/api/invoices";
import { getBankAccounts } from "~/api/settings";
import type { IncomeBookEntry, IncomeBookEntryInput } from "~/types/incomeBookEntry";
import type { BankAccount } from "~/types/config";
import type { Invoice } from "~/types/invoice";
import {
    FileInputIcon,
    DollarIcon,
    TagIcon,
    FileTextIcon,
    HashIcon,
    Calendar1Icon,
    ContactRoundIcon,
    CreditCardIcon,
} from "~/components/ui/icons";
import { AppLayout } from "~/components/layout/AppLayout";
import { CreateButton } from "~/components/ui/CreateButton";
import { Toast } from "~/components/ui/Toast";
import { ConfirmModal } from "~/components/ui/ConfirmModal";
import { Input } from "~/components/ui/Input";
import { CurrencyInput } from "~/components/document/CurrencyInput";
import { EntityCard } from "~/components/ui/EntityCard";
import { EmptyState } from "~/components/ui/EmptyState";
import { DetailsItem } from "~/components/ui/DetailsItem";
import { LoadingState } from "~/components/ui/LoadingState";
import { DetailDrawer } from "~/components/ui/DetailDrawer";
import { FormDrawer } from "~/components/ui/FormDrawer";
import { MetaItem } from "~/components/ui/MetaItem";
import { SectionBlock } from "~/components/ui/SectionBlock";
import { SectionHeader } from "~/components/ui/SectionHeader";
import { DetailsGrid } from "~/components/ui/DetailsGrid";
import { ListHeader } from "~/components/ui/ListHeader";
import { SearchSelect } from "~/components/ui/SearchSelect";
import { Pagination } from "~/components/ui/Pagination";
import { Toggle } from "~/components/ui/Toggle";
import { IncomeBookFilterSection } from "~/components/document/IncomeBookFilterSection";
import { formatPrice, formatDisplayDate } from "~/utils/format";
import type { PaginationMeta } from "~/types/api";
import { useToast } from "~/hooks/useToast";

const kmToPfening = (km: number) => Math.round(km * 100);
const pfeningToKm = (pf: number) => pf / 100;
const formatInvoiceDate = (date: string) => {
    const parsedDate = new Date(date);
    return Number.isNaN(parsedDate.getTime()) ? date : parsedDate.toLocaleDateString();
};

export default function IncomeBookPage() {
    const { selectedCompany, updateSelectedCompany, token, isAuthenticated } = useAuth();
    const [selectedYear] = useSelectedYear();

    const [entries, setEntries] = useState<IncomeBookEntry[]>([]);
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [allocationLoading, setAllocationLoading] = useState(false);
    const { toast, showToast, hideToast } = useToast();

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [filtersOpen, setFiltersOpen] = useState(false);

    // Modals & Drawers
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
    const [formDrawerOpen, setFormDrawerOpen] = useState(false);
    const [activeEntry, setActiveEntry] = useState<IncomeBookEntry | null>(null);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");

    // Invoice selection
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [linkInvoice, setLinkInvoice] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        entry_number: 1,
        booking_date: "",
        payment_date: "",
        description: "",
        amount_services_km: 0,
        amount_goods_km: 0,
        amount_products_km: 0,
        amount_other_income_km: 0,
        amount_financial_income_km: 0,
        vat_amount_km: 0,
        bank_account_id: null as number | null,
    });

    const [paymentAmountKm, setPaymentAmountKm] = useState<number>(0);

    // Debounce search query to prevent excessive API calls
    const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchEntries = useCallback(async (page: number = 1) => {
        if (!selectedCompany || !token) return;
        setLoading(true);
        try {
            const res = await getIncomeBookEntries(selectedCompany.slug, token, page, {
                year: selectedYear,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                search: debouncedSearch.trim() || undefined,
            });
            setEntries(res.data);
            if ('meta' in res) {
                setPagination((res as any).meta || null);
            }
            setCurrentPage(page);
        } catch (error: any) {
            showToast(error.message || "Greška pri dohvatanju stavki", "error");
        } finally {
            setLoading(false);
        }
    }, [selectedCompany, token, selectedYear, startDate, endDate, debouncedSearch, showToast]);

    useEffect(() => {
        if (isAuthenticated && selectedCompany) {
            fetchEntries(currentPage);
        }
    }, [isAuthenticated, selectedCompany, fetchEntries, currentPage]);

    // Fetch invoices for SearchSelect
    const fetchInvoices = useCallback(async () => {
        if (!selectedCompany || !token) return;
        try {
            const res = await getInvoices(selectedCompany.slug, token, 1, { year: selectedYear });
            setInvoices(res.data || []);
        } catch { /* silently skip */ }
    }, [selectedCompany, token, selectedYear]);

    useEffect(() => {
        if (isAuthenticated && selectedCompany) fetchInvoices();
    }, [isAuthenticated, selectedCompany, fetchInvoices]);

    const fetchBankAccounts = useCallback(async () => {
        if (!selectedCompany || !token) return;
        try {
            const res = await getBankAccounts(selectedCompany.slug, token, 1);
            setBankAccounts(res.data || []);
        } catch {
            setBankAccounts([]);
        }
    }, [selectedCompany, token]);

    useEffect(() => {
        if (isAuthenticated && selectedCompany) fetchBankAccounts();
    }, [isAuthenticated, selectedCompany, fetchBankAccounts]);

    const handleRowClick = (entry: IncomeBookEntry) => {
        setActiveEntry(entry);
        setViewDrawerOpen(true);
    };

    const openCreateForm = () => {
        setFormMode("create");
        setLinkInvoice(false);
        setSelectedInvoice(null);
        setPaymentAmountKm(0);
        setFormData({
            entry_number: 0,
            booking_date: new Date().toISOString().split("T")[0],
            payment_date: new Date().toISOString().split("T")[0],
            description: "",
            amount_services_km: 0,
            amount_goods_km: 0,
            amount_products_km: 0,
            amount_other_income_km: 0,
            amount_financial_income_km: 0,
            vat_amount_km: 0,
            bank_account_id: null,
        });
        setFormDrawerOpen(true);
    };

    const openEditForm = () => {
        if (!activeEntry) return;
        setFormMode("edit");
        const hasInvoice = !!activeEntry.invoice_id;
        setLinkInvoice(hasInvoice);
        if (hasInvoice && activeEntry.invoice) {
            setSelectedInvoice(activeEntry.invoice as any);
        } else {
            setSelectedInvoice(null);
        }
        setFormData({
            entry_number: activeEntry.entry_number,
            booking_date: activeEntry.booking_date?.split("T")[0] || "",
            payment_date: activeEntry.payment_date?.split("T")[0] || "",
            description: activeEntry.description || "",
            amount_services_km: pfeningToKm(activeEntry.amount_services),
            amount_goods_km: pfeningToKm(activeEntry.amount_goods),
            amount_products_km: pfeningToKm(activeEntry.amount_products),
            amount_other_income_km: pfeningToKm(activeEntry.amount_other_income),
            amount_financial_income_km: pfeningToKm(activeEntry.amount_financial_income),
            vat_amount_km: pfeningToKm(activeEntry.vat_amount),
            bank_account_id: activeEntry.bank_account_id,
        });
        setPaymentAmountKm(pfeningToKm(activeEntry.total_amount));
        setViewDrawerOpen(false);
        setFormDrawerOpen(true);
    };

    const handleCalculateAllocation = async () => {
        if (!selectedCompany || !token) return;
        if (!selectedInvoice) {
            showToast("Odaberite račun.", "error");
            return;
        }
        if (paymentAmountKm <= 0) {
            showToast("Unesite iznos uplate veći od 0.", "error");
            return;
        }

        setAllocationLoading(true);
        try {
            const res = await calculateIncomeBookEntryAllocation(selectedCompany.slug, token, {
                invoice_id: selectedInvoice.id,
                payment_amount: kmToPfening(paymentAmountKm),
            });

            setFormData((prev) => ({
                ...prev,
                amount_services_km: pfeningToKm(res.data.amount_services),
                amount_goods_km: pfeningToKm(res.data.amount_goods),
                amount_products_km: pfeningToKm(res.data.amount_products),
                amount_other_income_km: pfeningToKm(res.data.amount_other_income),
                amount_financial_income_km: pfeningToKm(res.data.amount_financial_income),
                vat_amount_km: pfeningToKm(res.data.vat_amount),
            }));

            showToast("Iznosi su izračunati. Po potrebi ih možete ručno korigovati.", "success");
        } catch (err: any) {
            showToast(err.message || "Greška pri obračunu iznosa.", "error");
        } finally {
            setAllocationLoading(false);
        }
    };

    const handleFormSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedCompany || !token) return;

        if (linkInvoice && !selectedInvoice) {
            showToast("Odaberite račun prije čuvanja.", "error");
            return;
        }

        const description = formData.description.trim();
        if (!description) {
            showToast("Opis je obavezan.", "error");
            return;
        }

        setLoading(true);

        const amountServices = kmToPfening(formData.amount_services_km);
        const amountGoods = kmToPfening(formData.amount_goods_km);
        const amountProducts = kmToPfening(formData.amount_products_km);
        const amountOtherIncome = kmToPfening(formData.amount_other_income_km);
        const amountFinancialIncome = kmToPfening(formData.amount_financial_income_km);
        const vatAmount = kmToPfening(formData.vat_amount_km);
        const totalAmount =
            amountServices +
            amountGoods +
            amountProducts +
            amountOtherIncome +
            amountFinancialIncome;

        const payload: IncomeBookEntryInput = {
            ...(formMode === "edit" && { entry_number: formData.entry_number }),
            booking_date: formData.booking_date,
            payment_date: formData.payment_date || null,
            description,
            bank_account_id: formData.bank_account_id,
            invoice_id: (linkInvoice && selectedInvoice) ? selectedInvoice.id : null,
            amount_services: amountServices,
            amount_goods: amountGoods,
            amount_products: amountProducts,
            amount_other_income: amountOtherIncome,
            amount_financial_income: amountFinancialIncome,
            total_amount: totalAmount,
            vat_amount: vatAmount,
        };

        try {
            if (formMode === "create") {
                await createIncomeBookEntry(selectedCompany.slug, token, payload);
                showToast("Stavka uspješno kreirana", "success");
            } else if (activeEntry) {
                await updateIncomeBookEntry(selectedCompany.slug, activeEntry.id, token, payload);
                showToast("Stavka uspješno ažurirana", "success");
            }
            setFormDrawerOpen(false);
            fetchEntries(currentPage);
        } catch (err: any) {
            showToast(err.message || "Greška pri čuvanju stavke", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!activeEntry || !selectedCompany || !token) return;
        setLoading(true);
        try {
            await deleteIncomeBookEntry(selectedCompany.slug, activeEntry.id, token);
            showToast("Stavka uspješno obrisana", "info");
            setViewDrawerOpen(false);
            fetchEntries(currentPage);
        } catch (err: any) {
            showToast(err.message || "Greška pri brisanju stavke", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!selectedCompany || !token) return;
        setPdfLoading(true);
        try {
            const blob = await downloadIncomeBookPdf(selectedCompany.slug, token, {
                start_date: startDate || undefined,
                end_date: endDate || undefined,
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `knjiga-prihoda-${selectedCompany.slug}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
            showToast("PDF uspješno preuzet", "success");
        } catch (err: any) {
            showToast(err.message || "Greška pri preuzimanju PDF-a", "error");
        } finally {
            setPdfLoading(false);
        }
    };

    // Compute grand totals for current view
    const grandTotal = entries.reduce((sum, e) => sum + e.total_amount, 0);
    const grandVat = entries.reduce((sum, e) => sum + e.vat_amount, 0);

    return (
        <AppLayout
            title="incomes"
            selectedCompany={selectedCompany}
            onCompanyChange={updateSelectedCompany}
            actions={
                <div className="flex gap-2 items-center">
                    <button
                        onClick={handleDownloadPdf}
                        disabled={pdfLoading || entries.length === 0}
                        className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] text-xs font-black uppercase tracking-widest hover:border-primary/50 transition-all disabled:opacity-40"
                    >
                        <FileTextIcon className="w-4 h-4" />
                        {pdfLoading ? "..." : "PDF"}
                    </button>
                    <CreateButton label="Nova stavka" onClick={openCreateForm} />
                </div>
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
                title="Obriši stavku"
                message={`Da li ste sigurni da želite obrisati stavku #${activeEntry?.entry_number}?`}
            />

            <IncomeBookFilterSection
                filtersOpen={filtersOpen}
                onToggleFilters={() => setFiltersOpen(!filtersOpen)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                startDate={startDate}
                onStartDateChange={setStartDate}
                endDate={endDate}
                onEndDateChange={setEndDate}
                selectedYear={selectedYear}
                onPageReset={() => setCurrentPage(1)}
            />

            {/* Totals Summary */}
            {entries.length > 0 && (
                <div className="flex flex-wrap gap-4 mb-4 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)]">Ukupno prihodi:</span>
                        <span className="text-sm font-black text-primary italic tracking-tight">{formatPrice(grandTotal)} KM</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)]">Ukupno PDV:</span>
                        <span className="text-sm font-black text-[var(--color-text-main)] italic tracking-tight">{formatPrice(grandVat)} KM</span>
                    </div>
                </div>
            )}

            {/* Mobile View: EntityCard List */}
            <div className="md:hidden space-y-3">
                {entries.map((entry) => (
                    <EntityCard key={entry.id} onClick={() => handleRowClick(entry)}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <HashIcon className="w-3 h-3 text-primary" />
                                <span className="text-base font-black text-[var(--color-text-main)] tracking-tighter italic leading-none group-hover:text-primary transition-colors">
                                    {entry.entry_number}
                                </span>
                            </div>
                            <span className="text-xs font-bold text-[var(--color-text-muted)]">
                                {formatDisplayDate(entry.booking_date)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FileInputIcon className="w-3.5 h-3.5 text-[var(--color-text-dim)]" />
                            <span className="text-xs font-bold text-[var(--color-text-muted)] tracking-tight truncate">
                                {entry.description || "—"}
                            </span>
                        </div>
                        {entry.invoice && (
                            <div className="flex items-center gap-2">
                                <FileTextIcon className="w-3 h-3 text-[var(--color-text-dim)]" />
                                <span className="text-[10px] font-bold text-[var(--color-text-dim)] tracking-tight truncate">
                                    Račun: {entry.invoice.invoice_number} ({entry.invoice.client?.name || "—"})
                                </span>
                            </div>
                        )}
                                    {entry.bank_account && (
                            <div className="flex items-center gap-2">
                                <CreditCardIcon className="w-3 h-3 text-[var(--color-text-dim)]" />
                                <span className="text-[10px] font-bold text-[var(--color-text-dim)] tracking-tight truncate">
                                    Banka: {entry.bank_account.bank_name}{entry.bank_account.account_number ? ` – ${entry.bank_account.account_number}` : ""}
                                </span>
                            </div>
                        )}
                        <div className="h-[1px] w-full bg-[var(--color-border)]" />
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                            <MetaItem icon={TagIcon} label="Usluge" value={formatPrice(entry.amount_services)} />
                            <MetaItem icon={TagIcon} label="Roba" value={formatPrice(entry.amount_goods)} />
                            <MetaItem icon={TagIcon} label="Proizvodi" value={formatPrice(entry.amount_products)} />
                            <MetaItem icon={TagIcon} label="Ostalo" value={formatPrice(entry.amount_other_income)} />
                            <MetaItem icon={TagIcon} label="Fin. prihodi" value={formatPrice(entry.amount_financial_income)} />
                            <MetaItem icon={TagIcon} label="PDV" value={formatPrice(entry.vat_amount)} />
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black uppercase text-[var(--color-text-dim)]">Ukupno</span>
                            <p className="text-lg font-black text-[var(--color-text-main)] tracking-tighter italic">
                                {formatPrice(entry.total_amount)} KM
                            </p>
                        </div>
                    </EntityCard>
                ))}
            </div>

            {/* Desktop View: ListHeader + EntityCard Grid */}
            <ListHeader
                grid="grid-cols-[minmax(0,1.5fr)_0.5fr_0.5fr_0.5fr_0.5fr_0.5fr_0.5fr_0.6fr]"
                columns={[
                    { label: "Stavka / Opis" },
                    { label: "Datum" },
                    { label: "Usluge", align: "right" },
                    { label: "Roba", align: "right" },
                    { label: "Proizvodi", align: "right" },
                    { label: "Ostalo", align: "right" },
                    { label: "Fin. prihodi", align: "right" },
                    { label: "Ukupno", align: "right" },
                ]}
            />

            <div className="hidden md:block space-y-3">
                {entries.map((entry) => (
                    <EntityCard key={entry.id} onClick={() => handleRowClick(entry)}>
                        <div className="grid grid-cols-[minmax(0,1.5fr)_0.5fr_0.5fr_0.5fr_0.5fr_0.5fr_0.5fr_0.6fr] gap-3 items-center">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                    <FileInputIcon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <HashIcon className="w-3 h-3 text-primary" />
                                        <span className="text-sm font-black text-[var(--color-text-main)] tracking-tighter italic leading-none truncate">
                                            {entry.entry_number}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-xs font-bold text-[var(--color-text-muted)] min-w-0">
                                        <FileInputIcon className="w-3.5 h-3.5 text-[var(--color-text-dim)] shrink-0" />
                                        <span className="truncate">{entry.description || "—"}</span>
                                    </div>
                                    {entry.invoice && (
                                        <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-[var(--color-text-dim)] min-w-0">
                                            <FileTextIcon className="w-3 h-3 text-[var(--color-text-dim)] shrink-0" />
                                            <span className="truncate">Račun: {entry.invoice.invoice_number} ({entry.invoice.client?.name || "—"})</span>
                                        </div>
                                    )}
                                    {entry.bank_account && (
                                        <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-[var(--color-text-dim)] min-w-0">
                                            <CreditCardIcon className="w-3 h-3 text-[var(--color-text-dim)] shrink-0" />
                                            <span className="truncate">Banka: {entry.bank_account.bank_name}{entry.bank_account.account_number ? ` – ${entry.bank_account.account_number}` : ""}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-1 text-xs font-bold text-[var(--color-text-muted)]">
                                <Calendar1Icon className="w-3 h-3 text-[var(--color-text-dim)]" />
                                <span>{formatDisplayDate(entry.booking_date)}</span>
                            </div>

                            <div className="text-right text-xs font-bold text-[var(--color-text-muted)]">
                                {formatPrice(entry.amount_services)}
                            </div>
                            <div className="text-right text-xs font-bold text-[var(--color-text-muted)]">
                                {formatPrice(entry.amount_goods)}
                            </div>
                            <div className="text-right text-xs font-bold text-[var(--color-text-muted)]">
                                {formatPrice(entry.amount_products)}
                            </div>
                            <div className="text-right text-xs font-bold text-[var(--color-text-muted)]">
                                {formatPrice(entry.amount_other_income)}
                            </div>
                            <div className="text-right text-xs font-bold text-[var(--color-text-muted)]">
                                {formatPrice(entry.amount_financial_income)}
                            </div>

                            <p className="text-right text-lg font-black text-[var(--color-text-main)] tracking-tighter italic whitespace-nowrap">
                                {formatPrice(entry.total_amount)} KM
                            </p>
                        </div>
                    </EntityCard>
                ))}
            </div>

            {loading && !viewDrawerOpen && !formDrawerOpen && <LoadingState />}
            {!loading && entries.length === 0 && <EmptyState icon={FileInputIcon} message="Nema stavki u knjizi prihoda" />}

            {pagination && pagination.total > pagination.per_page && (
                <div className="mt-6">
                    <Pagination
                        pagination={pagination}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                        loading={loading}
                    />
                </div>
            )}

            {/* Detail Drawer */}
            <DetailDrawer
                title="Detalji stavke"
                isOpen={viewDrawerOpen}
                onClose={() => setViewDrawerOpen(false)}
                entityName={activeEntry ? `# ${activeEntry.entry_number}` : ""}
                entityIcon={FileInputIcon}
                onEdit={openEditForm}
                onDelete={() => setIsDeleteModalOpen(true)}
            >
                {activeEntry && (
                    <div className="space-y-4">
                        <SectionBlock variant="plain">
                            <SectionHeader icon={FileTextIcon} title="Osnovni podaci" />
                            <DetailsGrid columns={2}>
                                <DetailsItem
                                    icon={Calendar1Icon}
                                    label="Datum knjiženja"
                                    value={formatDisplayDate(activeEntry.booking_date)}
                                    color="bg-blue-500/10 text-blue-500"
                                />
                                <DetailsItem
                                    icon={Calendar1Icon}
                                    label="Datum uplate"
                                    value={formatDisplayDate(activeEntry.payment_date)}
                                    color="bg-purple-500/10 text-purple-500"
                                />
                                <DetailsItem
                                    icon={HashIcon}
                                    label="Broj stavke"
                                    value={`#${activeEntry.entry_number}`}
                                    color="bg-green-500/10 text-green-500"
                                />
                                <DetailsItem
                                    icon={CreditCardIcon}
                                    label="Banka"
                                    value={activeEntry.bank_account ? `${activeEntry.bank_account.bank_name}${activeEntry.bank_account.account_number ? ` – ${activeEntry.bank_account.account_number}` : ""}` : "—"}
                                    color="bg-slate-500/10 text-slate-600 dark:text-slate-400"
                                />
                            </DetailsGrid>
                            <div className="mt-3">
                                <span className="text-[10px] font-black uppercase text-[var(--color-text-dim)]">Opis</span>
                                <p className="text-sm font-bold mt-1 leading-relaxed">{activeEntry.description || "—"}</p>
                            </div>
                        </SectionBlock>

                        {activeEntry.invoice && (
                            <SectionBlock variant="plain">
                                <SectionHeader icon={FileTextIcon} title="Povezani račun" />
                                <DetailsGrid columns={2}>
                                    <DetailsItem
                                        icon={HashIcon}
                                        label="Broj računa"
                                        value={activeEntry.invoice.invoice_number || "—"}
                                        color="bg-amber-500/10 text-amber-500"
                                    />
                                    <DetailsItem
                                        icon={ContactRoundIcon}
                                        label="Klijent"
                                        value={activeEntry.invoice.client?.name || "—"}
                                        color="bg-indigo-500/10 text-indigo-500"
                                    />
                                </DetailsGrid>
                            </SectionBlock>
                        )}

                        <SectionBlock variant="plain">
                            <SectionHeader icon={FileInputIcon} title="Iznosi" />
                            <DetailsGrid columns={2}>
                                <DetailsItem icon={DollarIcon} label="Usluge" value={`${formatPrice(activeEntry.amount_services)} KM`} color="bg-teal-500/10 text-teal-500" />
                                <DetailsItem icon={DollarIcon} label="Roba" value={`${formatPrice(activeEntry.amount_goods)} KM`} color="bg-teal-500/10 text-teal-500" />
                                <DetailsItem icon={DollarIcon} label="Proizvodi" value={`${formatPrice(activeEntry.amount_products)} KM`} color="bg-teal-500/10 text-teal-500" />
                                <DetailsItem icon={DollarIcon} label="Ostalo" value={`${formatPrice(activeEntry.amount_other_income)} KM`} color="bg-teal-500/10 text-teal-500" />
                                <DetailsItem icon={TagIcon} label="PDV" value={`${formatPrice(activeEntry.vat_amount)} KM`} color="bg-red-500/10 text-red-500" />
                                <DetailsItem icon={DollarIcon} label="UKUPNO" value={`${formatPrice(activeEntry.total_amount)} KM`} color="bg-primary/20 text-primary font-black" />
                            </DetailsGrid>
                        </SectionBlock>
                    </div>
                )}
            </DetailDrawer>

            {/* Form Drawer */}
            <FormDrawer
                isOpen={formDrawerOpen}
                onClose={() => setFormDrawerOpen(false)}
                title={formMode === "create" ? "Nova stavka" : "Uredi stavku"}
                onSubmit={handleFormSubmit}
                loading={loading}
                submitLabel={formMode === "create" ? "Kreiraj stavku" : "Sačuvaj izmjene"}
            >
                <div className="space-y-4">
                    <SectionBlock variant="card">
                        <SectionHeader icon={Calendar1Icon} title="Osnovno" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Input label="Datum knjiženja" type="date" value={formData.booking_date} onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })} required icon={Calendar1Icon} />
                            <Input label="Datum uplate" type="date" value={formData.payment_date} onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })} icon={Calendar1Icon} />
                        </div>
                        <SearchSelect
                            items={bankAccounts}
                            value={bankAccounts.find((account) => account.id === formData.bank_account_id) || null}
                            onChange={(account) => setFormData({ ...formData, bank_account_id: account?.id ?? null })}
                            getKey={(account) => account.id}
                            getLabel={(account) => `${account.bank_name} - ${account.account_number}`}
                            getSearchText={(account) => `${account.bank_name} ${account.account_number} ${account.swift || ""}`}
                            renderValue={(account) => (
                                <div className="flex flex-col gap-0.5 min-w-0">
                                    <span className="text-sm font-bold truncate">{account.bank_name}</span>
                                    <span className="text-[10px] text-[var(--color-text-dim)] truncate">{account.account_number}</span>
                                </div>
                            )}
                            renderItem={(account, isSelected) => (
                                <div className="flex flex-col gap-0.5">
                                    <span className={`text-sm font-bold ${isSelected ? "text-primary" : ""}`}>{account.bank_name}</span>
                                    <span className="text-[10px] text-[var(--color-text-dim)]">{account.account_number}</span>
                                    {account.swift && <span className="text-[10px] text-[var(--color-text-dim)]">SWIFT: {account.swift}</span>}
                                </div>
                            )}
                            label="Bankovni račun"
                            placeholder="Odaberi bankovni račun..."
                            icon={CreditCardIcon}
                        />
                        <Input label="Opis" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="npr. Uplata po računu..." icon={FileInputIcon} required />
                    </SectionBlock>

                    <SectionBlock variant="card">
                        <SectionHeader icon={FileTextIcon} title="Račun i Iznosi" />

                        <Toggle
                            id="link-inv"
                            checked={linkInvoice}
                            onChange={setLinkInvoice}
                            label="Poveži s računom"
                            className="!p-2 mb-4"
                        />

                        {linkInvoice && (
                            <div className="space-y-4 mb-4">
                                <SearchSelect
                                    items={invoices}
                                    value={selectedInvoice}
                                    onChange={setSelectedInvoice}
                                    getLabel={(inv) => inv.invoice_number}
                                    getSearchText={(inv) =>
                                        `${inv.invoice_number} ${inv.client?.name || ""} ${inv.date || ""} ${formatPrice(inv.total_bam ?? inv.total)}`
                                    }
                                    renderValue={(inv) => {
                                        const amountBam = inv.total_bam ?? inv.total;
                                        return (
                                        <div className="flex flex-col gap-0.5 min-w-0">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="font-bold truncate">{inv.invoice_number}</span>
                                                <span className="inline-flex px-2 py-0.5 rounded-md bg-primary/15 text-primary text-[9px] font-black uppercase tracking-wider shrink-0">
                                                    {formatPrice(amountBam)} KM
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-[var(--color-text-dim)] truncate">
                                                {inv.client?.name || "Klijent nije definisan"} • {formatInvoiceDate(inv.date)}
                                            </span>
                                        </div>
                                        );
                                    }}
                                    renderItem={(inv, isSelected) => {
                                        const amountBam = inv.total_bam ?? inv.total;
                                        return (
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-sm font-bold ${isSelected ? "text-primary" : ""}`}>
                                                    {inv.invoice_number}
                                                </span>
                                                <span className="inline-flex px-2 py-0.5 rounded-md bg-primary/15 text-primary text-[10px] font-black uppercase tracking-wider shrink-0">
                                                    {formatPrice(amountBam)} KM
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-[var(--color-text-dim)] truncate">
                                                {inv.client?.name || "Klijent nije definisan"}
                                            </span>
                                            <span className="text-[10px] text-[var(--color-text-dim)] truncate">
                                                Datum: {formatInvoiceDate(inv.date)}
                                            </span>
                                        </div>
                                        );
                                    }}
                                    getKey={(inv) => inv.id}
                                    placeholder="Odaberi račun..."
                                    required
                                    icon={FileTextIcon}
                                />
                                <CurrencyInput
                                    label="Iznos uplate (KM)"
                                    value={kmToPfening(paymentAmountKm)}
                                    onChange={(cents) => setPaymentAmountKm(cents / 100)}
                                    currency="KM"
                                    icon={DollarIcon}
                                />
                                <button
                                    type="button"
                                    onClick={handleCalculateAllocation}
                                    disabled={allocationLoading}
                                    className="w-full rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {allocationLoading ? "Obračun u toku..." : "Izračunaj iznose"}
                                </button>
                                <p className="text-[10px] font-bold text-[var(--color-text-dim)] italic">
                                    Dugme obračunava iznose iz API-ja na osnovu računa i uplate. Zatim možete ručno doraditi prije čuvanja.
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <CurrencyInput label="Usluge" value={kmToPfening(formData.amount_services_km)} onChange={(cents) => setFormData(prev => ({ ...prev, amount_services_km: cents / 100 }))} currency="KM" icon={DollarIcon} />
                            <CurrencyInput label="Roba" value={kmToPfening(formData.amount_goods_km)} onChange={(cents) => setFormData(prev => ({ ...prev, amount_goods_km: cents / 100 }))} currency="KM" icon={DollarIcon} />
                            <CurrencyInput label="Proizvodi" value={kmToPfening(formData.amount_products_km)} onChange={(cents) => setFormData(prev => ({ ...prev, amount_products_km: cents / 100 }))} currency="KM" icon={DollarIcon} />
                            <CurrencyInput label="Ostalo" value={kmToPfening(formData.amount_other_income_km)} onChange={(cents) => setFormData(prev => ({ ...prev, amount_other_income_km: cents / 100 }))} currency="KM" icon={DollarIcon} />
                            <CurrencyInput label="Fin. prihodi" value={kmToPfening(formData.amount_financial_income_km)} onChange={(cents) => setFormData(prev => ({ ...prev, amount_financial_income_km: cents / 100 }))} currency="KM" icon={DollarIcon} />
                            <CurrencyInput label="PDV" value={kmToPfening(formData.vat_amount_km)} onChange={(cents) => setFormData(prev => ({ ...prev, vat_amount_km: cents / 100 }))} currency="KM" icon={TagIcon} />
                        </div>
                    </SectionBlock>
                </div>
            </FormDrawer>
        </AppLayout>
    );
}
