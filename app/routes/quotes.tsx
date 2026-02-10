import { useAuth } from "~/hooks/useAuth";
import { useEffect, useState, useCallback } from "react";
import type { FormEvent } from "react";
import { getQuotes, getQuote, createQuote, updateQuote, deleteQuote, downloadQuotePdf, sendQuoteEmail } from "~/api/quotes";
import { getClients } from "~/api/clients";
import { getArticles } from "~/api/articles";
import { getMe, getCurrencies } from "~/api/config";
import { getBankAccounts } from "~/api/settings";
import type { Quote, QuoteInput } from "~/types/quote";
import type { InvoiceItemInput } from "~/types/invoice";
import type { Client } from "~/types/client";
import type { Article } from "~/types/article";
import type { SelectOption, Currency } from "~/types/config";
import {
  HashIcon,
  ContactRoundIcon,
  Calendar1Icon,
  Clock1Icon,
  XIcon,
  FileSlidersIcon,
  CreditCardIcon,
  StickyNoteIcon,
  BoxesIcon,
  PlusIcon,
  GlobeIcon,
  FileTextIcon,
  MailIcon,
} from "~/components/ui/icons";
import { AppLayout } from "~/components/layout/AppLayout";
import { CreateButton } from "~/components/ui/CreateButton";
import { Toast } from "~/components/ui/Toast";
import { Pagination } from "~/components/ui/Pagination";
import { StatusBadge, type BadgeColor } from "~/components/ui/StatusBadge";
import { EntityCard } from "~/components/ui/EntityCard";
import { EmptyState } from "~/components/ui/EmptyState";
import { LoadingState } from "~/components/ui/LoadingState";
import { DetailsItem } from "~/components/ui/DetailsItem";
import { DetailDrawer } from "~/components/ui/DetailDrawer";
import { ConfirmModal } from "~/components/ui/ConfirmModal";
import { FormDrawer } from "~/components/ui/FormDrawer";
import { SearchSelect } from "~/components/ui/SearchSelect";
import { Input } from "~/components/ui/Input";
import { Toggle } from "~/components/ui/Toggle";
import { InvoiceItemRow } from "~/components/invoice/InvoiceItemRow";
import { SectionBlock } from "~/components/ui/SectionBlock";
import { SectionHeader } from "~/components/ui/SectionHeader";
import { SectionToggle } from "~/components/ui/SectionToggle";
import { DetailsGrid } from "~/components/ui/DetailsGrid";
import { ListHeader } from "~/components/ui/ListHeader";
import { MetaItem } from "~/components/ui/MetaItem";
import { FilterBar } from "~/components/ui/FilterBar";
import { FilterPillSelect } from "~/components/ui/FilterPillSelect";
import { FilterSearchInput } from "~/components/ui/FilterSearchInput";
import { FilterDateInput } from "~/components/ui/FilterDateInput";
import { ActiveFiltersBar } from "~/components/ui/ActiveFiltersBar";
import type { PaginationMeta } from "~/types/api";
import { useToast } from "~/hooks/useToast";

// Empty quote item template (tax_rate in basis points: 1700 = 17%)
const emptyQuoteItem: InvoiceItemInput = {
  article_id: null,
  name: "",
  description: null,
  quantity: 1,
  unit_price: 0,
  subtotal: 0,
  tax_rate: 1700,
  tax_label: "A",
  tax_amount: 0,
  total: 0
};

export default function QuotesPage() {
  const { selectedCompany, updateSelectedCompany, token, isAuthenticated } = useAuth();

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailForm, setEmailForm] = useState({
    to: "",
    subject: "",
    body: "",
    attach_pdf: true,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Reference data
  const [clients, setClients] = useState<Client[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [bankAccounts, setBankAccounts] = useState<import("~/types/config").BankAccount[]>([]);
  const [languages, setLanguages] = useState<SelectOption[]>([]);
  const [templates, setTemplates] = useState<SelectOption[]>([]);
  const [companySettings, setCompanySettings] = useState<import("~/types/config").CompanySettings | null>(null);

  const { toast, showToast, hideToast } = useToast();

  // Drawer states
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [activeQuote, setActiveQuote] = useState<Quote | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Form: collapsible sections (uključuje napomenu)
  const [showMoreFormFields, setShowMoreFormFields] = useState(false);

  // Form state
  const [formData, setFormData] = useState<QuoteInput>({
    client_id: 0,
    date: new Date().toISOString().split("T")[0],
    valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    currency: "BAM",
    language: "",
    quote_template: "classic",
    notes: "",
    subtotal: 0,
    tax_total: 0,
    discount_total: 0,
    total: 0,
    items: [{ ...emptyQuoteItem }]
  });

  // Selected client for form
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Format price
  const formatPrice = (amount: number): string => {
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount / 100);
  };

  // Pretraga se šalje na API tek nakon 3+ znaka (ili kad je prazno)
  const searchForApi = searchQuery.trim().length >= 3 ? searchQuery.trim() : "";

  // Fetch quotes
  const fetchQuotes = useCallback(async (page: number = 1) => {
    if (!selectedCompany || !token) return;
    setLoading(true);
    try {
      const response = await getQuotes(selectedCompany.slug, token, page, {
        search: searchForApi || undefined,
        status: statusFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      setQuotes(response.data);
      setPagination(response.meta);
      setCurrentPage(page);
    } catch (error: any) {
      showToast(error.message || "Greška pri dohvatanju ponuda", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, token, searchForApi, statusFilter, dateFrom, dateTo]);

  // Fetch reference data
  const fetchReferenceData = useCallback(async () => {
    if (!selectedCompany || !token) return;
    try {
      const [clientsRes, articlesRes, currenciesRes, bankAccountsRes, meRes] = await Promise.all([
        getClients(selectedCompany.slug, token, 1),
        getArticles(selectedCompany.slug, token, 1),
        getCurrencies(selectedCompany.slug, token),
        getBankAccounts(selectedCompany.slug, token, 1),
        getMe(token, selectedCompany.slug)
      ]);
      setClients(clientsRes.data);
      setArticles(articlesRes.data);
      setCurrencies(currenciesRes.data);
      setBankAccounts(bankAccountsRes.data);
      setLanguages(meRes.data.languages);
      setTemplates(meRes.data.templates);
      setCompanySettings(meRes.data.company_settings || null);

      const settings = meRes.data.company_settings;
      const defaultCurrency = settings?.default_document_currency
        ? currenciesRes.data.find(c => c.code === settings.default_document_currency) || currenciesRes.data.find(c => c.is_default) || currenciesRes.data[0]
        : currenciesRes.data.find(c => c.is_default) || currenciesRes.data[0];
      if (defaultCurrency) {
        setFormData(prev => ({ ...prev, currency: defaultCurrency.code }));
      }
    } catch (error: any) {
      showToast(error.message || "Greška pri učitavanju podataka", "error");
    }
  }, [selectedCompany, token]);

  useEffect(() => {
    if (isAuthenticated && selectedCompany) {
      fetchQuotes(currentPage);
      fetchReferenceData();
    }
  }, [isAuthenticated, selectedCompany, currentPage, fetchQuotes, fetchReferenceData]);

  // Row click - open view
  const handleRowClick = async (quote: Quote) => {
    if (!selectedCompany || !token) return;
    try {
      const response = await getQuote(selectedCompany.slug, quote.id, token);
      setActiveQuote(response.data);
      setViewDrawerOpen(true);
    } catch (error: any) {
      showToast(error.message || "Greška pri učitavanju ponude", "error");
    }
  };

  // Open create form - use company_settings defaults
  const openCreateForm = () => {
    const settings = companySettings;
    const dueDays = settings?.default_document_due_days ?? 14;
    const defaultCurrency = settings?.default_document_currency
      ? currencies.find(c => c.code === settings.default_document_currency) || currencies.find(c => c.is_default) || currencies[0]
      : currencies.find(c => c.is_default) || currencies[0];
    const defaultBank = bankAccounts.find(b => b.is_default) || bankAccounts[0];
    setFormMode("create");
    setSelectedClient(null);
    setFormData({
      client_id: 0,
      date: new Date().toISOString().split("T")[0],
      valid_until: new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      currency: defaultCurrency?.code || "BAM",
      bank_account_id: defaultBank?.id ?? null,
      language: (settings?.default_document_language || languages[0]?.value) ?? "",
      quote_template: settings?.default_document_template || "classic",
      notes: settings?.default_quote_notes ?? settings?.default_document_notes ?? "",
      subtotal: 0,
      tax_total: 0,
      discount_total: 0,
      total: 0,
      items: [{ ...emptyQuoteItem }]
    });
    setFormDrawerOpen(true);
    setShowMoreFormFields(false);
  };

  // Open edit form
  const openEditForm = () => {
    if (!activeQuote) return;
    setFormMode("edit");
    const client = clients.find(c => c.id === activeQuote.client_id) || null;
    setSelectedClient(client);
    // Helper to parse date for input (d.m.Y -> Y-m-d)
    const parseDateForInput = (dateStr: string | null) => {
      if (!dateStr) return "";
      if (dateStr.includes(".")) {
        const [day, month, year] = dateStr.split(".");
        return `${year}-${month}-${day}`;
      }
      return dateStr.split("T")[0];
    };

    setFormData({
      quote_number: activeQuote.quote_number,
      client_id: activeQuote.client_id ?? 0,
      date: parseDateForInput(activeQuote.date),
      valid_until: parseDateForInput(activeQuote.valid_until),
      currency: activeQuote.currency,
      bank_account_id: activeQuote.bank_account_id ?? null,
      language: activeQuote.language,
      quote_template: activeQuote.quote_template,
      notes: activeQuote.notes || "",
      subtotal: activeQuote.subtotal,
      tax_total: activeQuote.tax_total,
      discount_total: activeQuote.discount_total,
      total: activeQuote.total,
      items: activeQuote.items.map(item => ({
        article_id: item.article_id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        tax_rate: item.tax_rate,
        tax_amount: item.tax_amount,
        total: item.total
      }))
    });
    setViewDrawerOpen(false);
    setFormDrawerOpen(true);
    setShowMoreFormFields(true);
  };

  // Handle client change
  const handleClientChange = (client: Client | null) => {
    setSelectedClient(client);
    setFormData(prev => ({ ...prev, client_id: client?.id || 0 }));
  };

  // Handle item change
  const handleItemChange = (index: number, item: InvoiceItemInput) => {
    const newItems = [...formData.items];
    newItems[index] = item;
    recalculateTotals(newItems);
  };

  // Handle item remove
  const handleItemRemove = (index: number) => {
    if (formData.items.length <= 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    recalculateTotals(newItems);
  };

  // Add new item
  const addItem = () => {
    const newItems = [...formData.items, { ...emptyQuoteItem }];
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  // Recalculate totals
  const recalculateTotals = (items: InvoiceItemInput[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const taxTotal = items.reduce((sum, item) => sum + item.tax_amount, 0);
    const total = subtotal + taxTotal;
    setFormData(prev => ({
      ...prev,
      items,
      subtotal,
      tax_total: taxTotal,
      total
    }));
  };

  // Delete quote
  const handleDelete = async () => {
    if (!selectedCompany || !token || !activeQuote) return;
    setLoading(true);
    try {
      await deleteQuote(selectedCompany.slug, activeQuote.id, token);
      showToast("Ponuda uspješno obrisana", "info");
      setViewDrawerOpen(false);
      fetchQuotes(currentPage);
    } catch (err: any) {
      showToast(err.message || "Greška pri brisanju ponude", "error");
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
    }
  };

  // Form submit
  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !token) return;
    if (formMode === "create" && !selectedClient) {
      showToast("Klijent je obavezan", "error");
      return;
    }
    if (formData.items.length === 0 || !formData.items.some(i => i.name)) {
      showToast("Morate dodati barem jednu stavku", "error");
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        ...formData,
        valid_until: formData.valid_until || null,
        client_id: formMode === "create" ? selectedClient!.id : (formData.client_id ?? selectedClient?.id ?? null),
      };
      if (formMode === "create") {
        const res = await createQuote(selectedCompany.slug, token, payload);
        showToast("Ponuda uspješno kreirana", "success");
        setFormDrawerOpen(false);
        const fullQuote = await getQuote(selectedCompany.slug, res.data.id, token);
        setActiveQuote(fullQuote.data);
        setViewDrawerOpen(true);
        fetchQuotes(currentPage);
      } else if (activeQuote) {
        await updateQuote(selectedCompany.slug, activeQuote.id, token, payload);
        showToast("Ponuda uspješno ažurirana", "success");
        setFormDrawerOpen(false);
        const updated = await getQuote(selectedCompany.slug, activeQuote.id, token);
        setActiveQuote(updated.data);
        setViewDrawerOpen(true);
        fetchQuotes(currentPage);
      }
    } catch (err: any) {
      showToast(err.message || "Greška pri čuvanju ponude", "error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedCompany || !token || !activeQuote) return;
    setPdfLoading(true);
    try {
      await downloadQuotePdf(selectedCompany.slug, activeQuote.id, activeQuote.quote_number, token);
      showToast("PDF preuzet", "success");
    } catch (err: any) {
      showToast(err.message || "Greška pri preuzimanju PDF-a", "error");
    } finally {
      setPdfLoading(false);
    }
  };

  const openEmailModal = () => {
    setEmailForm({
      to: activeQuote?.client?.email || "",
      subject: `Ponuda ${activeQuote?.quote_number || ""}`,
      body: `Poštovani,\n\nU prilogu vam šaljemo ponudu ${activeQuote?.quote_number || ""}.\n\nS poštovanjem`,
      attach_pdf: true,
    });
    setEmailModalOpen(true);
  };

  const handleSendEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !token || !activeQuote) return;
    if (!emailForm.to) {
      showToast("Unesite email adresu primaoca", "error");
      return;
    }
    setEmailLoading(true);
    try {
      await sendQuoteEmail(selectedCompany.slug, activeQuote.id, token, {
        to: emailForm.to,
        subject: emailForm.subject,
        body: emailForm.body,
        attach_pdf: emailForm.attach_pdf,
      });
      showToast("Ponuda uspješno poslata na email", "success");
      setEmailModalOpen(false);
    } catch (err: any) {
      showToast(err.message || "Greška pri slanju maila", "error");
    } finally {
      setEmailLoading(false);
    }
  };

  const statusOptions = [
    { value: "", label: "Status: Svi" },
    { value: "created", label: "Status: Kreiran" },
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
        value: "Kreiran",
        onClear: () => setStatusFilter(""),
      }]
      : []),
    ...((dateFrom || dateTo)
      ? [{
        id: "date",
        label: "Datum",
        value: `${dateFrom || "—"} → ${dateTo || "—"}`,
        onClear: () => {
          setDateFrom("");
          setDateTo("");
        },
      }]
      : []),
  ];

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  return (
    <AppLayout
      title="quotes"
      selectedCompany={selectedCompany}
      onCompanyChange={updateSelectedCompany}
      actions={
        <CreateButton label="Nova ponuda" onClick={openCreateForm} />
      }
    >
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Obriši ponudu"
        message={`Da li ste sigurni da želite trajno obrisati ponudu ${activeQuote?.quote_number}? Ova akcija se ne može poništiti.`}
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
                if (val.trim().length >= 3 || val.trim().length === 0) setCurrentPage(1);
              }}
              placeholder="Pretraži ponude (min. 3 znaka)..."
            />
          }
        />
        {filtersOpen && (
          <div className="p-3 rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-surface)]">
            <div className="flex flex-wrap items-end gap-2">
              <FilterPillSelect
                value={statusFilter}
                options={statusOptions}
                onChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
              />
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-dim)] ml-1">
                  Datum ponude
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <FilterDateInput
                    value={dateFrom}
                    onChange={(val) => {
                      setDateFrom(val);
                      setCurrentPage(1);
                    }}
                    placeholder="Od"
                  />
                  <FilterDateInput
                    value={dateTo}
                    onChange={(val) => {
                      setDateTo(val);
                      setCurrentPage(1);
                    }}
                    placeholder="Do"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        <ActiveFiltersBar filters={activeFilters} onReset={resetFilters} />
      </div>

      {/* Mobile: cards */}
      <div className="md:hidden space-y-3">
        {quotes.map((quote) => (
          <EntityCard key={quote.id} onClick={() => handleRowClick(quote)}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <HashIcon className="w-3 h-3 text-primary" />
                <span className="text-base font-black text-[var(--color-text-main)] tracking-tighter italic leading-none group-hover:text-primary transition-colors">
                  {quote.quote_number}
                </span>
              </div>
              <StatusBadge
                label={quote.status_label}
                color={(quote.status_color as BadgeColor) || "gray"}
              />
            </div>
            <div className="flex items-center gap-2">
              <ContactRoundIcon className="w-3.5 h-3.5 text-[var(--color-text-dim)]" />
              <span className="text-xs font-bold text-[var(--color-text-muted)] tracking-tight truncate">
                {quote.client?.name || 'Nepoznat klijent'}
              </span>
            </div>
            <div className="h-[1px] w-full bg-[var(--color-border)]" />
            <div className="flex justify-between items-end">
              <div className="flex gap-4">
                <MetaItem
                  icon={Calendar1Icon}
                  label="Datum"
                  value={quote.date}
                />
                <MetaItem
                  icon={Clock1Icon}
                  label="Važi do"
                  value={quote.valid_until || "—"}
                  valueClassName="text-red-500"
                />
              </div>
              <p className="text-lg font-black text-[var(--color-text-main)] tracking-tighter italic">
                {formatPrice(quote.total)} {quote.currency}
              </p>
            </div>
          </EntityCard>
        ))}
      </div>

      {/* Desktop: header */}
      <ListHeader
        grid="grid-cols-[minmax(0,1.6fr)_0.6fr_0.7fr_0.7fr_0.7fr]"
        columns={[
          { label: "Ponuda / Klijent" },
          { label: "Status" },
          { label: "Datum" },
          { label: "Važi do" },
          { label: "Ukupno", align: "right" },
        ]}
      />

      {/* Desktop: structured list */}
      <div className="hidden md:block space-y-3">
        {quotes.map((quote) => (
          <EntityCard key={quote.id} onClick={() => handleRowClick(quote)}>
            <div className="grid grid-cols-[minmax(0,1.6fr)_0.6fr_0.7fr_0.7fr_0.7fr] gap-3 items-center">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FileSlidersIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <HashIcon className="w-3 h-3 text-primary" />
                    <span className="text-sm font-black text-[var(--color-text-main)] tracking-tighter italic leading-none truncate">
                      {quote.quote_number}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs font-bold text-[var(--color-text-muted)] min-w-0">
                    <ContactRoundIcon className="w-3.5 h-3.5 text-[var(--color-text-dim)] shrink-0" />
                    <span className="truncate">{quote.client?.name || 'Nepoznat klijent'}</span>
                  </div>
                </div>
              </div>
              <StatusBadge
                label={quote.status_label}
                color={(quote.status_color as BadgeColor) || "gray"}
              />
              <div className="flex items-center gap-1 text-xs font-bold text-[var(--color-text-muted)]">
                <Calendar1Icon className="w-3 h-3 text-[var(--color-text-dim)]" />
                <span>{quote.date}</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-red-500">
                <Clock1Icon className="w-3 h-3" />
                <span>{quote.valid_until || "—"}</span>
              </div>
              <p className="text-right text-lg font-black text-[var(--color-text-main)] tracking-tighter italic">
                {formatPrice(quote.total)} {quote.currency}
              </p>
            </div>
          </EntityCard>
        ))}
      </div>

      {loading && <LoadingState />}

      {!loading && quotes.length === 0 && (
        <EmptyState icon={XIcon} message="Nema pronađenih ponuda" />
      )}

      {/* Pagination */}
      {pagination && (
        <Pagination
          pagination={pagination}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          loading={loading}
        />
      )}

      {/* View Drawer */}
      <DetailDrawer
        isOpen={viewDrawerOpen}
        onClose={() => setViewDrawerOpen(false)}
        title="Detalji ponude"
        entityName={activeQuote?.quote_number || ""}
        entityIcon={FileSlidersIcon}
        badges={
          activeQuote && (
            <StatusBadge
              label={activeQuote.status_label}
              color={(activeQuote.status_color as BadgeColor) || "gray"}
            />
          )
        }
        onEdit={openEditForm}
        onDelete={() => setDeleteModalOpen(true)}
      >
        {activeQuote && (
          <div className="space-y-3">
            <SectionBlock variant="plain">
              <SectionHeader icon={FileSlidersIcon} title="Osnovni podaci" />
              <DetailsGrid columns={2}>
                <DetailsItem
                  icon={ContactRoundIcon}
                  label="Klijent"
                  value={activeQuote.client?.name}
                  color="bg-blue-500/10 text-blue-500"
                />
                <DetailsItem
                  icon={GlobeIcon}
                  label="Jezik"
                  value={activeQuote.language_label}
                  color="bg-purple-500/10 text-purple-500"
                />
                <DetailsItem
                  icon={Calendar1Icon}
                  label="Datum"
                  value={activeQuote.date}
                  color="bg-green-500/10 text-green-500"
                />
                <DetailsItem
                  icon={Clock1Icon}
                  label="Važi do"
                  value={activeQuote.valid_until || "—"}
                  color="bg-red-500/10 text-red-500"
                />
                <DetailsItem
                  icon={CreditCardIcon}
                  label="Valuta"
                  value={activeQuote.currency}
                  color="bg-amber-500/10 text-amber-500"
                />
                {activeQuote.bank_account && (
                  <DetailsItem
                    icon={CreditCardIcon}
                    label="Bankovni račun"
                    value={`${activeQuote.bank_account.bank_name} (${activeQuote.bank_account.account_number})`}
                    color="bg-slate-500/10 text-slate-600"
                  />
                )}
                <DetailsItem
                  icon={FileTextIcon}
                  label="Predložak"
                  value={activeQuote.quote_template_label || "—"}
                  color="bg-indigo-500/10 text-indigo-500"
                />
              </DetailsGrid>
            </SectionBlock>

            {/* Notes */}
            {activeQuote.notes && (
              <div className="p-3 bg-[var(--color-border)] rounded-2xl border border-[var(--color-border-strong)]">
                <div className="flex items-center gap-2 mb-1">
                  <StickyNoteIcon className="h-3 w-3 text-[var(--color-text-dim)]" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-dim)]">Napomena</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">{activeQuote.notes}</p>
              </div>
            )}

            {/* Items */}
            <SectionBlock variant="plain">
              <SectionHeader icon={BoxesIcon} title={`Stavke (${activeQuote.items.length})`} />

              <div className="hidden md:grid grid-cols-[minmax(0,1fr)_70px_110px_80px_120px] gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-dim)] px-2">
                <span>Stavka</span>
                <span className="text-right">Kol.</span>
                <span className="text-right">Cijena</span>
                <span className="text-right">PDV</span>
                <span className="text-right">Ukupno</span>
              </div>

              <div className="space-y-2">
                {activeQuote.items.map((item, idx) => {
                  const unitPrice = item.quantity > 0 ? Math.round(item.total / item.quantity) : 0;
                  return (
                    <div key={item.id || idx} className="p-3 bg-[var(--color-border)] rounded-xl border border-[var(--color-border-strong)]">
                      <div className="md:hidden">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-sm font-bold text-[var(--color-text-main)]">{item.name}</p>
                            {item.description && (
                              <p className="text-[10px] text-[var(--color-text-dim)]">{item.description}</p>
                            )}
                          </div>
                          <p className="text-sm font-black text-primary">
                            {formatPrice(item.total)} {activeQuote.currency}
                          </p>
                        </div>
                        <div className="flex gap-4 text-[10px] text-[var(--color-text-dim)]">
                          <span>Kol: <strong className="text-[var(--color-text-muted)]">{item.quantity}</strong></span>
                          <span>Cijena: <strong className="text-[var(--color-text-muted)]">{formatPrice(unitPrice)} {activeQuote.currency}</strong></span>
                          <span>PDV: <strong className="text-[var(--color-text-muted)]">{item.tax_rate / 100}%</strong></span>
                        </div>
                      </div>
                      <div className="hidden md:grid grid-cols-[minmax(0,1fr)_70px_110px_80px_120px] gap-2 items-center">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[var(--color-text-main)]">{item.name}</p>
                          {item.description && (
                            <p className="text-[10px] text-[var(--color-text-dim)]">{item.description}</p>
                          )}
                        </div>
                        <div className="text-xs font-bold text-[var(--color-text-muted)] text-right">
                          {item.quantity}
                        </div>
                        <div className="text-xs font-bold text-[var(--color-text-muted)] text-right">
                          {formatPrice(unitPrice)} {activeQuote.currency}
                        </div>
                        <div className="text-xs font-bold text-[var(--color-text-muted)] text-right">
                          {item.tax_rate / 100}%
                        </div>
                        <div className="text-sm font-black text-primary text-right">
                          {formatPrice(item.total)} {activeQuote.currency}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionBlock>

            {/* Totals */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-dim)]">Osnovica:</span>
                <span className="font-bold text-[var(--color-text-main)]">{formatPrice(activeQuote.subtotal)} {activeQuote.currency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-dim)]">PDV:</span>
                <span className="font-bold text-[var(--color-text-main)]">{formatPrice(activeQuote.tax_total)} {activeQuote.currency}</span>
              </div>
              <div className="h-[1px] bg-amber-500/20" />
              <div className="flex justify-between">
                <span className="text-sm font-bold text-[var(--color-text-main)]">Ukupno:</span>
                <span className="text-xl font-black text-primary tracking-tighter italic">{formatPrice(activeQuote.total)} {activeQuote.currency}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={pdfLoading}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-primary/30 bg-primary/10 text-primary font-bold text-sm hover:bg-primary/20 transition-all disabled:opacity-50 cursor-pointer min-h-[44px]"
              >
                {pdfLoading ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                ) : (
                  <FileTextIcon className="h-4 w-4" />
                )}
                Preuzmi PDF
              </button>
              <button
                type="button"
                onClick={openEmailModal}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-primary/30 bg-primary/10 text-primary font-bold text-sm hover:bg-primary/20 transition-all cursor-pointer min-h-[44px]"
              >
                <MailIcon className="h-4 w-4" />
                Pošalji mail
              </button>
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* Send Email modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[12px]"
            onClick={() => !emailLoading && setEmailModalOpen(false)}
          />
          <div className="relative w-full max-w-[480px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-[var(--color-border)]">
              <h3 className="text-lg font-black text-[var(--color-text-main)] flex items-center gap-2">
                <MailIcon className="h-5 w-5 text-primary" />
                Pošalji ponudu na email
              </h3>
            </div>
            <form onSubmit={handleSendEmail} className="p-6 space-y-4">
              <Input
                label="Email primaoca"
                type="email"
                value={emailForm.to}
                onChange={(e) => setEmailForm(prev => ({ ...prev, to: e.target.value }))}
                icon={MailIcon}
                required
                placeholder="klijent@email.com"
              />
              <Input
                label="Predmet"
                type="text"
                value={emailForm.subject}
                onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                icon={FileTextIcon}
                required
              />
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)] ml-1 block">
                  Tekst maila
                </label>
                <textarea
                  value={emailForm.body}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, body: e.target.value }))}
                  rows={5}
                  required
                  className="w-full p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] font-bold text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 placeholder:text-[var(--color-text-dim)] resize-none"
                  placeholder="Tekst maila..."
                />
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <Toggle
                  checked={emailForm.attach_pdf}
                  onChange={(v) => setEmailForm(prev => ({ ...prev, attach_pdf: v }))}
                  label="Priloži PDF ponude"
                  className="!p-2"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => !emailLoading && setEmailModalOpen(false)}
                  disabled={emailLoading}
                  className="flex-1 py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] font-bold text-sm hover:bg-[var(--color-surface-hover)] transition-all disabled:opacity-50 cursor-pointer"
                >
                  Odustani
                </button>
                <button
                  type="submit"
                  disabled={emailLoading}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {emailLoading ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <MailIcon className="h-4 w-4" />}
                  {emailLoading ? "Slanje..." : "Pošalji"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Form Drawer */}
      <FormDrawer
        isOpen={formDrawerOpen}
        onClose={() => setFormDrawerOpen(false)}
        title={formMode === "create" ? "Nova ponuda" : "Uredi ponudu"}
        onSubmit={handleFormSubmit}
        loading={formLoading}
        submitLabel={formMode === "create" ? "Kreiraj ponudu" : "Sačuvaj izmjene"}
      >
        <div className="space-y-3">
          {/* Osnovni podaci */}
          <SectionBlock variant="card">
            <SectionHeader icon={ContactRoundIcon} title="Osnovni podaci" />

            {/* 1. Klijent */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)] ml-1 block">
                Klijent <span className="text-primary">*</span>
              </label>
              <SearchSelect
                items={clients}
                value={selectedClient}
                onChange={handleClientChange}
                getKey={(c) => c.id}
                getLabel={(c) => c.name}
                getSearchText={(c) => `${c.name} ${c.email || ""} ${c.phone || ""}`}
                renderItem={(c, isSelected) => (
                  <div className="flex flex-col gap-0.5">
                    <span className={`text-sm font-bold ${isSelected ? "text-primary" : ""}`}>{c.name}</span>
                    {c.email && <span className="text-[10px] text-[var(--color-text-dim)]">{c.email}</span>}
                  </div>
                )}
                icon={ContactRoundIcon}
                placeholder="Odaberi klijenta..."
                required
              />
            </div>

            {/* 2. Datum + Važi do */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
              <Input
                label="Datum"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                icon={Calendar1Icon}
                required
                className="h-[44px] min-h-[44px] py-2 rounded-xl"
              />
              <Input
                label="Važi do"
                type="date"
                value={formData.valid_until || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
                icon={Clock1Icon}
                className="h-[44px] min-h-[44px] py-2 rounded-xl"
              />
            </div>
          </SectionBlock>

          {/* 3. Prikaži više / Sakrij dodatna polja */}
          <SectionBlock variant="accent">
            <SectionToggle
              open={showMoreFormFields}
              onClick={() => setShowMoreFormFields(!showMoreFormFields)}
              title="Dodatna polja"
              subtitle="Valuta, predložak, napomena..."
            />

            {showMoreFormFields && (
              <div className="space-y-3 pt-3 mt-2 border-t-2 border-dashed border-[var(--color-page-border-subtle)]">
                {/* Valuta, Bankovni račun, Jezik, Predložak */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-start">
                  <div className="space-y-1.5 group">
                    <label className="text-[11px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)] ml-1 block">Valuta</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]">
                        <CreditCardIcon className="h-4 w-4" />
                      </div>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                        className="w-full min-h-[44px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] font-bold text-sm pl-10 pr-10 py-3 outline-none focus:border-primary/50 cursor-pointer"
                      >
                        {currencies.map(c => (
                          <option key={c.id} value={c.code}>{c.code}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5 group">
                    <label className="text-[11px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)] ml-1 block">Bankovni račun</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]">
                        <CreditCardIcon className="h-4 w-4" />
                      </div>
                      <select
                        value={formData.bank_account_id ?? ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, bank_account_id: e.target.value ? parseInt(e.target.value) : null }))}
                        className="w-full min-h-[44px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] font-bold text-sm pl-10 pr-10 py-3 outline-none focus:border-primary/50 cursor-pointer"
                      >
                        <option value="">—</option>
                        {bankAccounts.map(b => (
                          <option key={b.id} value={b.id}>{b.bank_name} ({b.account_number})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5 group">
                    <label className="text-[11px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)] ml-1 block">Jezik</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]">
                        <GlobeIcon className="h-4 w-4" />
                      </div>
                      <select
                        value={formData.language}
                        onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                        className="w-full min-h-[44px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] font-bold text-sm pl-10 pr-10 py-3 outline-none focus:border-primary/50 cursor-pointer"
                      >
                        {languages.map(l => (
                          <option key={l.value} value={l.value}>{l.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5 group">
                    <label className="text-[11px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)] ml-1 block">Predložak</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]">
                        <FileTextIcon className="h-4 w-4" />
                      </div>
                      <select
                        value={formData.quote_template}
                        onChange={(e) => setFormData(prev => ({ ...prev, quote_template: e.target.value }))}
                        className="w-full min-h-[44px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] font-bold text-sm pl-10 pr-10 py-3 outline-none focus:border-primary/50 cursor-pointer"
                      >
                        {templates.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Napomena */}
                <div className="rounded-xl border border-dashed border-[var(--color-border)] overflow-hidden">
                  <div className="flex items-center gap-2 p-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]/50">
                    <div className="h-7 w-7 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center shrink-0">
                      <StickyNoteIcon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)]">Napomena</span>
                  </div>
                  <textarea
                    value={formData.notes || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                    className="w-full bg-[var(--color-surface)] border-none text-[var(--color-text-main)] font-bold text-sm px-4 py-3 outline-none focus:ring-0 placeholder:text-[var(--color-text-dim)] resize-none"
                    placeholder="Dodatne napomene..."
                  />
                </div>
              </div>
            )}
          </SectionBlock>

          {/* Stavke */}
          <SectionBlock variant="card">
            <SectionHeader icon={BoxesIcon} title={`Stavke (${formData.items.length})`} />
            <div className="space-y-2">
              {formData.items.map((item, index) => (
                <InvoiceItemRow
                  key={index}
                  item={item}
                  index={index}
                  articles={articles}
                  currency={formData.currency}
                  onChange={handleItemChange}
                  onRemove={handleItemRemove}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={addItem}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-primary/40 bg-primary/5 text-primary hover:border-primary/60 hover:bg-primary/10 transition-colors cursor-pointer"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="text-[11px] font-bold">Dodaj stavku</span>
            </button>
          </SectionBlock>

          {/* Totals preview */}
          <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-2xl">
            <div className="h-9 w-9 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
              <FileTextIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-dim)]">Osnovica:</span>
                <span className="font-bold text-[var(--color-text-main)]">{formatPrice(formData.subtotal)} {formData.currency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-dim)]">PDV:</span>
                <span className="font-bold text-[var(--color-text-main)]">{formatPrice(formData.tax_total)} {formData.currency}</span>
              </div>
              <div className="h-[1px] bg-primary/20" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-[var(--color-text-main)]">Ukupno</span>
                <span className="text-xl font-black text-primary tracking-tighter italic">{formatPrice(formData.total)} {formData.currency}</span>
              </div>
            </div>
          </div>
        </div>
      </FormDrawer>
    </AppLayout>
  );
}
