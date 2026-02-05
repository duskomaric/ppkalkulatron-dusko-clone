import { useAuth } from "~/hooks/useAuth";
import { useEffect, useState, useCallback } from "react";
import { getInvoices, getInvoice, createInvoice, updateInvoice } from "~/api/invoices";
import { getClients } from "~/api/clients";
import { getArticles } from "~/api/articles";
import { getMe, getCurrencies } from "~/api/config";
import type { Invoice, InvoiceInput, InvoiceItemInput } from "~/types/invoice";
import type { Client } from "~/types/client";
import type { Article } from "~/types/article";
import type { Company } from "~/types/company";
import type { SelectOption, Currency } from "~/types/config";
import {
  HashIcon,
  ContactRoundIcon,
  Calendar1Icon,
  Clock1Icon,
  XIcon,
  PlusIcon,
  FileTextIcon,
  GlobeIcon,
  RepeatIcon,
  CreditCardIcon,
  StickyNoteIcon
} from "~/components/ui/icons";
import { AppLayout } from "~/components/layout/AppLayout";
import { Toast, type ToastType } from "~/components/ui/Toast";
import { Pagination } from "~/components/ui/Pagination";
import { StatusBadge, type BadgeColor } from "~/components/ui/StatusBadge";
import { EntityCard } from "~/components/ui/EntityCard";
import { EmptyState } from "~/components/ui/EmptyState";
import { LoadingState } from "~/components/ui/LoadingState";
import { DetailsItem } from "~/components/ui/DetailsItem";
import { DetailDrawer } from "~/components/ui/DetailDrawer";
import { FormDrawer } from "~/components/ui/FormDrawer";
import { SearchSelect } from "~/components/ui/SearchSelect";
import { Input } from "~/components/ui/Input";
import { InvoiceItemRow } from "~/components/invoice/InvoiceItemRow";
import type { PaginationMeta } from "~/types/api";

// Empty invoice item template
const emptyInvoiceItem: InvoiceItemInput = {
  article_id: null,
  name: "",
  description: null,
  quantity: 1,
  unit_price: 0,
  subtotal: 0,
  tax_rate: 0,
  tax_amount: 0,
  total: 0
};

export default function InvoicesPage() {
  const { user, token, isAuthenticated } = useAuth();

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Reference data
  const [clients, setClients] = useState<Client[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [languages, setLanguages] = useState<SelectOption[]>([]);
  const [frequencies, setFrequencies] = useState<SelectOption[]>([]);
  const [templates, setTemplates] = useState<SelectOption[]>([]);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: "",
    type: "success",
    isVisible: false,
  });

  // Drawer states
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  // Form state
  const [formData, setFormData] = useState<InvoiceInput>({
    client_id: 0,
    date: new Date().toISOString().split("T")[0],
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    currency: "EUR",
    language: "sr-Latn",
    invoice_template: "classic",
    is_recurring: false,
    frequency: null,
    next_invoice_date: null,
    notes: "",
    subtotal: 0,
    tax_total: 0,
    discount_total: 0,
    total: 0,
    items: [{ ...emptyInvoiceItem }]
  });

  // Selected client for form
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type, isVisible: true });
  };

  // Format price
  const formatPrice = (amount: number): string => {
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount / 100);
  };

  // Init company
  useEffect(() => {
    if (user && user.companies.length > 0 && !selectedCompany) {
      setSelectedCompany(user.companies[0]);
    }
  }, [user, selectedCompany]);

  // Fetch invoices
  const fetchInvoices = useCallback(async (page: number = 1) => {
    if (!selectedCompany || !token) return;
    setLoading(true);
    try {
      const response = await getInvoices(selectedCompany.slug, token, page);
      setInvoices(response.data);
      setPagination(response.meta);
      setCurrentPage(page);
    } catch (error: any) {
      showToast(error.message || "Greška pri dohvatanju računa", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, token]);

  // Fetch reference data
  const fetchReferenceData = useCallback(async () => {
    if (!selectedCompany || !token) return;
    try {
      const [clientsRes, articlesRes, currenciesRes, meRes] = await Promise.all([
        getClients(selectedCompany.slug, token, 1),
        getArticles(selectedCompany.slug, token, 1),
        getCurrencies(selectedCompany.slug, token),
        getMe(token)
      ]);
      setClients(clientsRes.data);
      setArticles(articlesRes.data);
      setCurrencies(currenciesRes.data);
      setLanguages(meRes.data.languages);
      setFrequencies(meRes.data.frequencies);
      setTemplates(meRes.data.templates);

      // Set default currency
      const defaultCurrency = currenciesRes.data.find(c => c.is_default);
      if (defaultCurrency) {
        setFormData(prev => ({ ...prev, currency: defaultCurrency.code }));
      }
    } catch (error: any) {
      showToast(error.message || "Greška pri učitavanju podataka", "error");
    }
  }, [selectedCompany, token]);

  useEffect(() => {
    if (isAuthenticated && selectedCompany) {
      fetchInvoices(currentPage);
      fetchReferenceData();
    }
  }, [isAuthenticated, selectedCompany, currentPage, fetchInvoices, fetchReferenceData]);

  // Row click - open view
  const handleRowClick = async (invoice: Invoice) => {
    if (!selectedCompany || !token) return;
    try {
      const response = await getInvoice(selectedCompany.slug, invoice.id, token);
      setActiveInvoice(response.data);
      setViewDrawerOpen(true);
    } catch (error: any) {
      showToast(error.message || "Greška pri učitavanju računa", "error");
    }
  };

  // Open create form
  const openCreateForm = () => {
    const defaultCurrency = currencies.find(c => c.is_default)?.code || "EUR";
    setFormMode("create");
    setSelectedClient(null);
    setFormData({
      client_id: 0,
      date: new Date().toISOString().split("T")[0],
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      currency: defaultCurrency,
      language: "sr-Latn",
      invoice_template: "classic",
      is_recurring: false,
      frequency: null,
      next_invoice_date: null,
      notes: "",
      subtotal: 0,
      tax_total: 0,
      discount_total: 0,
      total: 0,
      items: [{ ...emptyInvoiceItem }]
    });
    setFormDrawerOpen(true);
  };

  // Open edit form
  const openEditForm = () => {
    if (!activeInvoice) return;
    setFormMode("edit");
    const client = clients.find(c => c.id === activeInvoice.client_id) || null;
    setSelectedClient(client);
    // Helper to parse date for input (d.m.Y -> Y-m-d)
    const parseDateForInput = (dateStr: string | null) => {
      if (!dateStr) return "";
      // Check for d.m.Y format (e.g. 19.02.2026)
      if (dateStr.includes(".")) {
        const [day, month, year] = dateStr.split(".");
        return `${year}-${month}-${day}`;
      }
      // Fallback for ISO format
      return dateStr.split("T")[0];
    };

    setFormData({
      invoice_number: activeInvoice.invoice_number,
      client_id: activeInvoice.client_id,
      date: parseDateForInput(activeInvoice.date),
      due_date: parseDateForInput(activeInvoice.due_date),
      currency: activeInvoice.currency,
      language: activeInvoice.language,
      invoice_template: activeInvoice.invoice_template,
      is_recurring: activeInvoice.is_recurring,
      frequency: activeInvoice.frequency,
      next_invoice_date: parseDateForInput(activeInvoice.next_invoice_date),
      notes: activeInvoice.notes || "",
      subtotal: activeInvoice.subtotal,
      tax_total: activeInvoice.tax_total,
      discount_total: activeInvoice.discount_total,
      total: activeInvoice.total,
      items: activeInvoice.items.map(item => ({
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
    const newItems = [...formData.items, { ...emptyInvoiceItem }];
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

  // Form submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !token) return;
    if (!formData.client_id) {
      showToast("Morate odabrati klijenta", "error");
      return;
    }
    if (formData.items.length === 0 || !formData.items.some(i => i.name)) {
      showToast("Morate dodati barem jednu stavku", "error");
      return;
    }

    setFormLoading(true);
    try {
      if (formMode === "create") {
        await createInvoice(selectedCompany.slug, token, formData);
        showToast("Račun uspješno kreiran", "success");
      } else if (activeInvoice) {
        await updateInvoice(selectedCompany.slug, activeInvoice.id, token, formData);
        showToast("Račun uspješno ažuriran", "success");
      }
      setFormDrawerOpen(false);
      fetchInvoices(currentPage);
    } catch (err: any) {
      showToast(err.message || "Greška pri čuvanju računa", "error");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <AppLayout
      title="invoices"
      selectedCompany={selectedCompany}
      onCompanyChange={setSelectedCompany}
      actions={
        <button
          onClick={openCreateForm}
          className="cursor-pointer h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold text-sm border border-primary/20 hover:bg-primary hover:text-white transition-all shadow-glow-primary"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      }
    >
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />

      <div className="space-y-3">
        {invoices.map((inv) => (
          <EntityCard key={inv.id} onClick={() => handleRowClick(inv)}>
            {/* Top: Number and Status */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <HashIcon className="w-3 h-3 text-primary" />
                <span className="text-base font-black text-[var(--color-text-main)] tracking-tighter italic leading-none group-hover:text-primary transition-colors">
                  {inv.invoice_number}
                </span>
              </div>
              <StatusBadge
                label={inv.status_label}
                color={(inv.status_color as BadgeColor) || "gray"}
              />
            </div>

            {/* Middle: Client */}
            <div className="flex items-center gap-2">
              <ContactRoundIcon className="w-3 h-3 text-[var(--color-text-dim)]" />
              <span className="text-[11px] font-bold text-[var(--color-text-muted)] tracking-tight truncate">
                {inv.client?.name || 'Nepoznat klijent'}
              </span>
            </div>

            {/* Separator */}
            <div className="h-[1px] w-full bg-[var(--color-border)]" />

            {/* Bottom: Dates and Total */}
            <div className="flex justify-between items-end">
              <div className="flex gap-4">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1 text-[var(--color-text-dim)]">
                    <Calendar1Icon className="w-2.5 h-2.5" />
                    <span className="text-[7px] font-black uppercase">Datum</span>
                  </div>
                  <p className="text-[9px] font-bold text-[var(--color-text-muted)]">
                    {inv.date}
                  </p>
                </div>

                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1 text-[var(--color-text-dim)]">
                    <Clock1Icon className="w-2.5 h-2.5" />
                    <span className="text-[7px] font-black uppercase">Dospijeće</span>
                  </div>
                  <p className="text-[9px] font-bold text-red-500">
                    {inv.due_date}
                  </p>
                </div>
              </div>

              {/* Total */}
              <div className="text-right">
                <p className="text-lg font-black text-[var(--color-text-main)] tracking-tighter italic">
                  {formatPrice(inv.total)} {inv.currency}
                </p>
              </div>
            </div>
          </EntityCard>
        ))}

        {loading && <LoadingState />}

        {!loading && invoices.length === 0 && (
          <EmptyState icon={XIcon} message="Nema pronađenih računa" />
        )}
      </div>

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
        title="Detalji računa"
        entityName={activeInvoice?.invoice_number || ""}
        entityIcon={FileTextIcon}
        badges={
          activeInvoice && (
            <StatusBadge
              label={activeInvoice.status_label}
              color={(activeInvoice.status_color as BadgeColor) || "gray"}
            />
          )
        }
        onEdit={openEditForm}
      >
        {activeInvoice && (
          <div className="space-y-4">
            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-2">
              <DetailsItem
                icon={ContactRoundIcon}
                label="Klijent"
                value={activeInvoice.client?.name}
                color="bg-blue-500/10 text-blue-500"
              />
              <DetailsItem
                icon={GlobeIcon}
                label="Jezik"
                value={activeInvoice.language_label}
                color="bg-purple-500/10 text-purple-500"
              />
              <DetailsItem
                icon={Calendar1Icon}
                label="Datum"
                value={activeInvoice.date}
                color="bg-green-500/10 text-green-500"
              />
              <DetailsItem
                icon={Clock1Icon}
                label="Dospijeće"
                value={activeInvoice.due_date}
                color="bg-red-500/10 text-red-500"
              />
              <DetailsItem
                icon={CreditCardIcon}
                label="Valuta"
                value={activeInvoice.currency}
                color="bg-amber-500/10 text-amber-500"
              />
              <DetailsItem
                icon={RepeatIcon}
                label="Ponavljanje"
                value={activeInvoice.is_recurring ? activeInvoice.frequency_label : "Ne"}
                color="bg-teal-500/10 text-teal-500"
              />
            </div>

            {/* Notes */}
            {activeInvoice.notes && (
              <div className="p-3 bg-[var(--color-border)] rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <StickyNoteIcon className="h-3 w-3 text-[var(--color-text-dim)]" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-dim)]">Napomena</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">{activeInvoice.notes}</p>
              </div>
            )}

            {/* Items */}
            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-dim)]">
                Stavke ({activeInvoice.items.length})
              </span>
              {activeInvoice.items.map((item, idx) => (
                <div key={item.id || idx} className="p-3 bg-[var(--color-border)] rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-bold text-[var(--color-text-main)]">{item.name}</p>
                      {item.description && (
                        <p className="text-[10px] text-[var(--color-text-dim)]">{item.description}</p>
                      )}
                    </div>
                    <p className="text-sm font-black text-primary">
                      {formatPrice(item.total)} {activeInvoice.currency}
                    </p>
                  </div>
                  <div className="flex gap-4 text-[10px] text-[var(--color-text-dim)]">
                    <span>Kol: <strong className="text-[var(--color-text-muted)]">{item.quantity}</strong></span>
                    <span>Cijena: <strong className="text-[var(--color-text-muted)]">{formatPrice(item.unit_price)}</strong></span>
                    <span>PDV: <strong className="text-[var(--color-text-muted)]">{item.tax_rate}%</strong></span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-dim)]">Osnovica:</span>
                <span className="font-bold text-[var(--color-text-main)]">{formatPrice(activeInvoice.subtotal)} {activeInvoice.currency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-dim)]">PDV:</span>
                <span className="font-bold text-[var(--color-text-main)]">{formatPrice(activeInvoice.tax_total)} {activeInvoice.currency}</span>
              </div>
              <div className="h-[1px] bg-primary/20" />
              <div className="flex justify-between">
                <span className="text-sm font-bold text-[var(--color-text-main)]">Ukupno:</span>
                <span className="text-xl font-black text-primary tracking-tighter italic">{formatPrice(activeInvoice.total)} {activeInvoice.currency}</span>
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* Form Drawer */}
      <FormDrawer
        isOpen={formDrawerOpen}
        onClose={() => setFormDrawerOpen(false)}
        title={formMode === "create" ? "Novi račun" : "Uredi račun"}
        onSubmit={handleFormSubmit}
        loading={formLoading}
        submitLabel={formMode === "create" ? "Kreiraj račun" : "Sačuvaj izmjene"}
      >
        <div className="space-y-4">
          {/* Client Select */}
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
            label="Klijent"
            placeholder="Odaberi klijenta..."
            required
          />

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Datum"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
            <Input
              label="Dospijeće"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              required
            />
          </div>

          {/* Currency & Language */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)] ml-1 block">
                Valuta <span className="text-primary">*</span>
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl text-[var(--color-text-main)] font-bold text-sm px-5 py-3.5 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
              >
                {currencies.map(c => (
                  <option key={c.id} value={c.code}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)] ml-1 block">
                Jezik
              </label>
              <select
                value={formData.language}
                onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl text-[var(--color-text-main)] font-bold text-sm px-5 py-3.5 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
              >
                {languages.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Template */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)] ml-1 block">
              Predložak
            </label>
            <select
              value={formData.invoice_template}
              onChange={(e) => setFormData(prev => ({ ...prev, invoice_template: e.target.value }))}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl text-[var(--color-text-main)] font-bold text-sm px-5 py-3.5 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
            >
              {templates.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Recurring Toggle */}
          <div className="flex items-center justify-between p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
            <div className="flex items-center gap-3">
              <RepeatIcon className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-bold text-[var(--color-text-main)]">Ponavljajući račun</p>
                <p className="text-[10px] text-[var(--color-text-dim)]">Automatski generiši račune</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_recurring}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  is_recurring: e.target.checked,
                  frequency: e.target.checked ? "monthly" : null,
                  next_invoice_date: e.target.checked ? prev.due_date : null
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[var(--color-border)] peer-focus:ring-4 peer-focus:ring-primary/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Recurring Options */}
          {formData.is_recurring && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)] ml-1 block">
                  Učestalost
                </label>
                <select
                  value={formData.frequency || "monthly"}
                  onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl text-[var(--color-text-main)] font-bold text-sm px-5 py-3.5 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
                >
                  {frequencies.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Sljedeći račun"
                type="date"
                value={formData.next_invoice_date || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, next_invoice_date: e.target.value }))}
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)] ml-1 block">
              Napomena
            </label>
            <textarea
              value={formData.notes || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl text-[var(--color-text-main)] font-bold text-sm px-5 py-3.5 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all resize-none"
              placeholder="Dodatne napomene..."
            />
          </div>

          {/* Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)]">
                Stavke ({formData.items.length})
              </span>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] font-bold hover:bg-primary hover:text-white transition-all cursor-pointer"
              >
                <PlusIcon className="h-3 w-3" />
                Dodaj stavku
              </button>
            </div>

            {formData.items.map((item, idx) => (
              <InvoiceItemRow
                key={idx}
                item={item}
                index={idx}
                articles={articles}
                currency={formData.currency}
                onChange={handleItemChange}
                onRemove={handleItemRemove}
                disabled={formLoading}
              />
            ))}
          </div>

          {/* Totals Summary */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-dim)]">Osnovica:</span>
              <span className="font-bold text-[var(--color-text-main)]">{formatPrice(formData.subtotal)} {formData.currency}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-dim)]">PDV:</span>
              <span className="font-bold text-[var(--color-text-main)]">{formatPrice(formData.tax_total)} {formData.currency}</span>
            </div>
            <div className="h-[1px] bg-primary/20" />
            <div className="flex justify-between">
              <span className="text-sm font-bold text-[var(--color-text-main)]">Ukupno:</span>
              <span className="text-xl font-black text-primary tracking-tighter italic">{formatPrice(formData.total)} {formData.currency}</span>
            </div>
          </div>
        </div>
      </FormDrawer>
    </AppLayout>
  );
}
