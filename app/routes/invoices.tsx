import { useAuth } from "~/hooks/useAuth";
import { useEffect, useState, useCallback } from "react";
import type { FormEvent } from "react";
import { getInvoices, getInvoice, createInvoice, updateInvoice, deleteInvoice, createRefundInvoice, fiscalizeInvoice, fiscalizeCopy, fiscalizeRefund, downloadInvoicePdf, sendInvoiceEmail } from "~/api/invoices";
import { getClients } from "~/api/clients";
import { getArticles } from "~/api/articles";
import { getMe, getCurrencies } from "~/api/config";
import { getBankAccounts } from "~/api/settings";
import type { Invoice, InvoiceInput, InvoiceItemInput } from "~/types/invoice";
import type { Client } from "~/types/client";
import type { Article } from "~/types/article";
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
  StickyNoteIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  TrashIcon,
  ExternalLinkIcon,
  ImageIcon,
  BoxesIcon,
  MailIcon,
  FileSlidersIcon,
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
import { ImageModal } from "~/components/ui/ImageModal";
import { FormDrawer } from "~/components/ui/FormDrawer";
import { SearchSelect } from "~/components/ui/SearchSelect";
import { Input } from "~/components/ui/Input";
import { InvoiceItemRow } from "~/components/invoice/InvoiceItemRow";
import { Toggle } from "~/components/ui/Toggle";
import { SectionBlock } from "~/components/ui/SectionBlock";
import { SectionHeader } from "~/components/ui/SectionHeader";
import { SectionToggle } from "~/components/ui/SectionToggle";
import { DetailsGrid } from "~/components/ui/DetailsGrid";
import { ListHeader } from "~/components/ui/ListHeader";
import { MetaItem } from "~/components/ui/MetaItem";
import { FilterBar } from "~/components/ui/FilterBar";
import { FilterPillSelect } from "~/components/ui/FilterPillSelect";
import { FilterSearchInput } from "~/components/ui/FilterSearchInput";
import { ActiveFiltersBar } from "~/components/ui/ActiveFiltersBar";
import { FilterDateInput } from "~/components/ui/FilterDateInput";
import type { PaginationMeta } from "~/types/api";
import { useToast } from "~/hooks/useToast";

// Empty invoice item template (tax_rate in basis points: 1700 = 17%)
const emptyInvoiceItem: InvoiceItemInput = {
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

export default function InvoicesPage() {
  const { selectedCompany, updateSelectedCompany, token, isAuthenticated } = useAuth();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Reference data
  const [clients, setClients] = useState<Client[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [bankAccounts, setBankAccounts] = useState<import("~/types/config").BankAccount[]>([]);
  const [languages, setLanguages] = useState<SelectOption[]>([]);
  const [frequencies, setFrequencies] = useState<SelectOption[]>([]);
  const [templates, setTemplates] = useState<SelectOption[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<SelectOption[]>([]);
  const [companySettings, setCompanySettings] = useState<import("~/types/config").CompanySettings | null>(null);

  const { toast, showToast, hideToast } = useToast();

  // Drawer states
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  // Fiscal
  const [fiscalLoading, setFiscalLoading] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [stornoModalOpen, setStornoModalOpen] = useState(false);
  const [stornoLoading, setStornoLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // PDF & Email
  const [pdfLoading, setPdfLoading] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailForm, setEmailForm] = useState({
    to: "",
    subject: "",
    body: "",
    attach_pdf: true,
    attach_fiscal_record_ids: [] as number[],
  });
  const [fiscalImageModalOpen, setFiscalImageModalOpen] = useState(false);
  const [fiscalImageRecordId, setFiscalImageRecordId] = useState<number | null>(null);

  // Form: collapsible sections (uključuje napomenu)
  const [showMoreFormFields, setShowMoreFormFields] = useState(false);

  // Form state
  const [formData, setFormData] = useState<InvoiceInput>({
    client_id: 0,
    date: new Date().toISOString().split("T")[0],
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    currency: "BAM",
    currency_id: null,
    bank_account_id: null,
    language: "sr-Latn",
    invoice_template: "classic",
    payment_type: "Cash",
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

  // Format price
  const formatPrice = (amount: number): string => {
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount / 100);
  };

  const applyRefundSign = (amount: number, invoice?: Invoice | null): number => {
    if (!invoice) return amount;
    const isRefundInvoice = invoice.status === "refund_created" || invoice.status === "refunded";
    return isRefundInvoice ? -Math.abs(amount) : amount;
  };

  const formatSignedPrice = (amount: number, invoice?: Invoice | null): string => {
    return formatPrice(applyRefundSign(amount, invoice));
  };

  const isRefundCreated = activeInvoice?.status === "refund_created";
  const isRefunded = activeInvoice?.status === "refunded";
  const isFiscalized = activeInvoice?.status === "fiscalized";
  const isRefundInvoice = isRefundCreated || isRefunded;
  const hasOriginalFiscal = activeInvoice?.fiscal_records?.some((r) => r.type === "original");
  const hasRefundFiscal = activeInvoice?.fiscal_records?.some((r) => r.type === "refund");
  const canCreateRefundInvoice = Boolean(
    activeInvoice &&
    hasOriginalFiscal &&
    !activeInvoice.refund_invoice_id &&
    !isRefundCreated &&
    !isRefunded
  );
  const canEditInvoice = Boolean(activeInvoice && activeInvoice.status === "created");
  const canDeleteInvoice = Boolean(activeInvoice && (activeInvoice.status === "created" || activeInvoice.status === "refund_created"));
  const deleteAction = canCreateRefundInvoice
    ? { label: "Storniraj", icon: AlertTriangleIcon, onDelete: () => setStornoModalOpen(true) }
    : canDeleteInvoice
      ? { label: "Obriši", icon: TrashIcon, onDelete: () => setDeleteModalOpen(true) }
      : null;
  const fiscalBadge = isRefundInvoice
    ? {
      label: isRefundCreated ? "Storno kreiran" : "Storniran",
      color: isRefundCreated ? "amber" : "red",
    }
    : {
      label: isFiscalized ? "Fiskalizovan" : "Nije fiskalizovan",
      color: isFiscalized ? "green" : "gray",
    };
  const fiscalHelperText = isRefundInvoice
    ? isRefundCreated
      ? "Storno faktura je kreirana i čeka refundaciju kroz fiskalizaciju."
      : "Refundacija je završena i evidentirana u fiskalnim zapisima."
    : isFiscalized
      ? "Račun je fiskalizovan u OFS sistemu. Po potrebi možete odštampati kopiju."
      : "Račun nije fiskalizovan. Kliknite ispod da fiskalizujete i odštampate.";

  const statusOptions = [
    { value: "", label: "Status: Svi" },
    { value: "created", label: "Status: Kreiran" },
    { value: "fiscalized", label: "Status: Fiskalizovan" },
    { value: "refund_created", label: "Status: Storno kreiran" },
    { value: "refunded", label: "Status: Storniran" },
  ];

  const paymentOptions = [
    { value: "", label: "Plaćanje: Svi" },
    ...paymentTypes.map((pt) => ({
      value: pt.value,
      label: `Plaćanje: ${pt.label}`,
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
        value: statusOptions.find((s) => s.value === statusFilter)?.label.replace("Status: ", "") || statusFilter,
        onClear: () => setStatusFilter(""),
      }]
      : []),
    ...(paymentFilter
      ? [{
        id: "payment",
        label: "Plaćanje",
        value: paymentOptions.find((p) => p.value === paymentFilter)?.label.replace("Plaćanje: ", "") || paymentFilter,
        onClear: () => setPaymentFilter(""),
      }]
      : []),
    ...((createdFrom || createdTo)
      ? [{
        id: "created",
        label: "Datum",
        value: `${createdFrom || "—"} → ${createdTo || "—"}`,
        onClear: () => {
          setCreatedFrom("");
          setCreatedTo("");
        },
      }]
      : []),
  ];

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setPaymentFilter("");
    setCreatedFrom("");
    setCreatedTo("");
    setCurrentPage(1);
  };

  // Init company handled by useAuth

  // Pretraga se šalje na API tek nakon 3+ znaka (ili kad je prazno)
  const searchForApi = searchQuery.trim().length >= 3 ? searchQuery.trim() : "";

  // Fetch invoices
  const fetchInvoices = useCallback(async (page: number = 1) => {
    if (!selectedCompany || !token) return;
    setLoading(true);
    try {
      const response = await getInvoices(selectedCompany.slug, token, page, {
        search: searchForApi || undefined,
        status: statusFilter || undefined,
        payment_type: paymentFilter || undefined,
        created_from: createdFrom || undefined,
        created_to: createdTo || undefined,
      });
      setInvoices(response.data);
      setPagination(response.meta);
      setCurrentPage(page);
    } catch (error: any) {
      showToast(error.message || "Greška pri dohvatanju računa", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, token, searchForApi, statusFilter, paymentFilter, createdFrom, createdTo]);

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
      setFrequencies(meRes.data.frequencies);
      setTemplates(meRes.data.templates);
      setPaymentTypes(meRes.data.payment_types || []);
      setCompanySettings(meRes.data.company_settings || null);

      // Set default currency from company settings or first/default
      const settings = meRes.data.company_settings;
      const defaultCurrency = settings?.default_document_currency
        ? currenciesRes.data.find(c => c.code === settings.default_document_currency) || currenciesRes.data.find(c => c.is_default) || currenciesRes.data[0]
        : currenciesRes.data.find(c => c.is_default) || currenciesRes.data[0];
      if (defaultCurrency) {
        setFormData(prev => ({ ...prev, currency: defaultCurrency.code, currency_id: defaultCurrency.id }));
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

  // Refetch invoice when view drawer opens to ensure fresh fiscal_records (incl. images for copy/refund)
  useEffect(() => {
    if (viewDrawerOpen && activeInvoice && selectedCompany && token) {
      getInvoice(selectedCompany.slug, activeInvoice.id, token)
        .then((res) => {
          setActiveInvoice(res.data);
        })
        .catch(() => {});
    }
  }, [viewDrawerOpen, activeInvoice?.id, selectedCompany?.slug, token]);

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
      due_date: new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      currency: defaultCurrency?.code || "BAM",
      currency_id: defaultCurrency?.id ?? null,
      bank_account_id: defaultBank?.id ?? null,
      language: (settings?.default_document_language || languages[0]?.value) ?? "",
      invoice_template: (settings?.default_document_template || templates[0]?.value) ?? "classic",
      payment_type: (companySettings?.ofs_default_payment_type || paymentTypes[0]?.value) ?? "",
      is_recurring: false,
      frequency: null,
      next_invoice_date: null,
      notes: settings?.default_invoice_notes ?? settings?.default_document_notes ?? "",
      subtotal: 0,
      tax_total: 0,
      discount_total: 0,
      total: 0,
      items: [{ ...emptyInvoiceItem }]
    });
    setFormDrawerOpen(true);
    setShowMoreFormFields(false);
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
      client_id: activeInvoice.client_id ?? 0,
      date: parseDateForInput(activeInvoice.date),
      due_date: parseDateForInput(activeInvoice.due_date),
      currency: activeInvoice.currency,
      currency_id: activeInvoice.currency_id ?? null,
      bank_account_id: activeInvoice.bank_account_id ?? null,
      language: activeInvoice.language,
      invoice_template: activeInvoice.invoice_template,
      payment_type: (activeInvoice.payment_type || paymentTypes[0]?.value) ?? "",
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

  // Fiscalize invoice
  const handleFiscalize = async () => {
    if (!selectedCompany || !token || !activeInvoice) return;
    setFiscalLoading(true);
    try {
      const res = await fiscalizeInvoice(selectedCompany.slug, activeInvoice.id, token);
      if (res.success) {
        showToast(res.message || "Račun uspješno fiskalizovan", "success");
        const updated = await getInvoice(selectedCompany.slug, activeInvoice.id, token);
        setActiveInvoice(updated.data);
        fetchInvoices(currentPage);
      } else {
        showToast(res.message || "Greška pri fiskalizaciji", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Greška pri fiskalizaciji", "error");
    } finally {
      setFiscalLoading(false);
    }
  };

  // PDF download
  const handleDownloadPdf = async () => {
    if (!selectedCompany || !token || !activeInvoice) return;
    setPdfLoading(true);
    try {
      await downloadInvoicePdf(selectedCompany.slug, activeInvoice.id, activeInvoice.invoice_number, token);
      showToast("PDF preuzet", "success");
    } catch (err: any) {
      showToast(err.message || "Greška pri preuzimanju PDF-a", "error");
    } finally {
      setPdfLoading(false);
    }
  };

  // Open email modal - prefill with client email
  const openEmailModal = () => {
    const clientEmail = activeInvoice?.client?.email || "";
    setEmailForm({
      to: clientEmail,
      subject: `Faktura ${activeInvoice?.invoice_number || ""}`,
      body: `Poštovani,\n\nU prilogu vam šaljemo fakturu ${activeInvoice?.invoice_number || ""}.\n\nS poštovanjem`,
      attach_pdf: true,
      attach_fiscal_record_ids: (activeInvoice?.fiscal_records ?? [])
        .filter((r) => r.fiscal_receipt_image_path)
        .map((r) => r.id),
    });
    setEmailModalOpen(true);
  };

  const handleSendEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !token || !activeInvoice) return;
    if (!emailForm.to) {
      showToast("Unesite email adresu primaoca", "error");
      return;
    }
    setEmailLoading(true);
    try {
      await sendInvoiceEmail(selectedCompany.slug, activeInvoice.id, token, {
        to: emailForm.to,
        subject: emailForm.subject,
        body: emailForm.body,
        attach_pdf: emailForm.attach_pdf,
        attach_fiscal_record_ids: emailForm.attach_fiscal_record_ids,
      });
      showToast("Faktura uspješno poslata na email", "success");
      setEmailModalOpen(false);
    } catch (err: any) {
      showToast(err.message || "Greška pri slanju maila", "error");
    } finally {
      setEmailLoading(false);
    }
  };

  // Create refund (storno) invoice
  const handleCreateRefundInvoice = async () => {
    if (!selectedCompany || !token || !activeInvoice) return;
    setStornoLoading(true);
    try {
      const res = await createRefundInvoice(selectedCompany.slug, activeInvoice.id, token);
      showToast("Storno faktura je kreirana", "success");
      setStornoModalOpen(false);
      setActiveInvoice(res.data);
      setViewDrawerOpen(true);
      fetchInvoices(currentPage);
    } catch (err: any) {
      showToast(err.message || "Greška pri kreiranju storno fakture", "error");
    } finally {
      setStornoLoading(false);
    }
  };

  // Refund / Storno fiscal invoice
  const handleFiscalizeRefund = async () => {
    if (!selectedCompany || !token || !activeInvoice) return;
    if (activeInvoice.status !== "refund_created") {
      showToast("Storno faktura mora biti kreirana prije refundacije", "error");
      return;
    }
    setFiscalLoading(true);
    try {
      const res = await fiscalizeRefund(selectedCompany.slug, activeInvoice.id, token);
      if (res.success) {
        showToast(res.message || "Storno uspješno izvršeno", "success");
        const updated = await getInvoice(selectedCompany.slug, activeInvoice.id, token);
        setActiveInvoice(updated.data);
        setRefundModalOpen(false);
        fetchInvoices(currentPage);
      } else {
        showToast(res.message || "Greška pri storniranju", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Greška pri storniranju", "error");
    } finally {
      setFiscalLoading(false);
    }
  };

  // Delete invoice (created or refund_created)
  const handleDeleteInvoice = async () => {
    if (!selectedCompany || !token || !activeInvoice) return;
    setDeleteLoading(true);
    try {
      const res = await deleteInvoice(selectedCompany.slug, activeInvoice.id, token);
      showToast(res.message || "Račun je obrisan", "success");
      setDeleteModalOpen(false);
      setViewDrawerOpen(false);
      setActiveInvoice(null);
      fetchInvoices(currentPage);
    } catch (err: any) {
      showToast(err.message || "Greška pri brisanju računa", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Print copy of fiscal invoice
  const handleFiscalizeCopy = async () => {
    if (!selectedCompany || !token || !activeInvoice) return;
    setFiscalLoading(true);
    try {
      const res = await fiscalizeCopy(selectedCompany.slug, activeInvoice.id, token);
      if (res.success) {
        showToast(res.message || "Kopija uspješno odštampana", "success");
        const updated = await getInvoice(selectedCompany.slug, activeInvoice.id, token);
        setActiveInvoice(updated.data);
      } else {
        showToast(res.message || "Greška pri štampi kopije", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Greška pri štampi kopije", "error");
    } finally {
      setFiscalLoading(false);
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
        client_id: formMode === "create" ? selectedClient!.id : (formData.client_id ?? selectedClient?.id ?? null),
      };
      if (formMode === "create") {
        const res = await createInvoice(selectedCompany.slug, token, payload);
        showToast("Račun uspješno kreiran", "success");
        setFormDrawerOpen(false);
        const fullInvoice = await getInvoice(selectedCompany.slug, res.data.id, token);
        setActiveInvoice(fullInvoice.data);
        setViewDrawerOpen(true);
        fetchInvoices(currentPage);
      } else if (activeInvoice) {
        await updateInvoice(selectedCompany.slug, activeInvoice.id, token, payload);
        showToast("Račun uspješno ažuriran", "success");
        setFormDrawerOpen(false);
        const updated = await getInvoice(selectedCompany.slug, activeInvoice.id, token);
        setActiveInvoice(updated.data);
        setViewDrawerOpen(true);
        fetchInvoices(currentPage);
      }
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
      onCompanyChange={updateSelectedCompany}
      actions={
        <CreateButton label="Novi račun" onClick={openCreateForm} />
      }
    >
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
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
              placeholder="Pretraži račune (min. 3 znaka)..."
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
              <FilterPillSelect
                value={paymentFilter}
                options={paymentOptions}
                onChange={(val) => {
                  setPaymentFilter(val);
                  setCurrentPage(1);
                }}
              />
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-dim)] ml-1">
                  Datum kreiranja
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <FilterDateInput
                    value={createdFrom}
                    onChange={(val) => {
                      setCreatedFrom(val);
                      setCurrentPage(1);
                    }}
                    placeholder="Od"
                  />
                  <FilterDateInput
                    value={createdTo}
                    onChange={(val) => {
                      setCreatedTo(val);
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

      {/* Mobile: cards (original layout) */}
      <div className="md:hidden space-y-3">
        {invoices.map((inv) => (
          <EntityCard key={inv.id} onClick={() => handleRowClick(inv)}>
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
            <div className="flex items-center gap-2">
              <ContactRoundIcon className="w-3.5 h-3.5 text-[var(--color-text-dim)]" />
              <span className="text-xs font-bold text-[var(--color-text-muted)] tracking-tight truncate">
                {inv.client?.name || 'Nepoznat klijent'}
              </span>
            </div>
            {inv.original_invoice_number && (
              <div className="flex items-center gap-2">
                <RepeatIcon className="w-3 h-3 text-red-500" />
                <span className="text-[10px] font-bold text-[var(--color-text-dim)] tracking-tight truncate">
                  Storno od: {inv.original_invoice_number}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <CreditCardIcon className="w-3 h-3 text-[var(--color-text-dim)]" />
              <span className="text-[10px] font-bold text-[var(--color-text-muted)]">
                {inv.payment_type_label || "—"}
              </span>
            </div>
            <div className="h-[1px] w-full bg-[var(--color-border)]" />
            <div className="flex justify-between items-end">
              <div className="flex gap-4">
                <MetaItem
                  icon={Calendar1Icon}
                  label="Datum"
                  value={inv.date}
                />
                <MetaItem
                  icon={Clock1Icon}
                  label="Dospijeće"
                  value={inv.due_date}
                  valueClassName="text-red-500"
                />
              </div>
              <p className="text-lg font-black text-[var(--color-text-main)] tracking-tighter italic">
                {formatSignedPrice(inv.total, inv)} {inv.currency}
              </p>
            </div>
          </EntityCard>
        ))}
      </div>

      {/* Desktop: header */}
      <ListHeader
        grid="grid-cols-[minmax(0,1.6fr)_0.6fr_0.7fr_0.7fr_0.7fr_0.7fr]"
        columns={[
          { label: "Račun / Klijent" },
          { label: "Status" },
          { label: "Datum" },
          { label: "Dospijeće" },
          { label: "Plaćanje" },
          { label: "Ukupno", align: "right" },
        ]}
      />

      {/* Desktop: structured list */}
      <div className="hidden md:block space-y-3">
        {invoices.map((inv) => (
          <EntityCard key={inv.id} onClick={() => handleRowClick(inv)}>
            <div className="grid grid-cols-[minmax(0,1.6fr)_0.6fr_0.7fr_0.7fr_0.7fr_0.7fr] gap-3 items-center">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FileTextIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <HashIcon className="w-3 h-3 text-primary" />
                    <span className="text-sm font-black text-[var(--color-text-main)] tracking-tighter italic leading-none truncate">
                      {inv.invoice_number}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs font-bold text-[var(--color-text-muted)] min-w-0">
                    <ContactRoundIcon className="w-3.5 h-3.5 text-[var(--color-text-dim)] shrink-0" />
                    <span className="truncate">{inv.client?.name || 'Nepoznat klijent'}</span>
                  </div>
                  {inv.original_invoice_number && (
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-[var(--color-text-dim)] min-w-0">
                      <RepeatIcon className="w-3 h-3 text-red-500 shrink-0" />
                      <span className="truncate">Storno od: {inv.original_invoice_number}</span>
                    </div>
                  )}
                </div>
              </div>
              <StatusBadge
                label={inv.status_label}
                color={(inv.status_color as BadgeColor) || "gray"}
              />
              <div className="flex items-center gap-1 text-xs font-bold text-[var(--color-text-muted)]">
                <Calendar1Icon className="w-3 h-3 text-[var(--color-text-dim)]" />
                <span>{inv.date}</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-red-500">
                <Clock1Icon className="w-3 h-3" />
                <span>{inv.due_date}</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-[var(--color-text-muted)]">
                <CreditCardIcon className="w-3 h-3 text-[var(--color-text-dim)]" />
                <span>{inv.payment_type_label || "—"}</span>
              </div>
              <p className="text-right text-lg font-black text-[var(--color-text-main)] tracking-tighter italic">
                {formatSignedPrice(inv.total, inv)} {inv.currency}
              </p>
            </div>
          </EntityCard>
        ))}
      </div>

      {loading && <LoadingState />}

      {!loading && invoices.length === 0 && (
        <EmptyState icon={XIcon} message="Nema pronađenih računa" />
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
        onEdit={canEditInvoice ? openEditForm : undefined}
        onDelete={deleteAction?.onDelete}
        deleteLabel={deleteAction?.label}
        deleteIcon={deleteAction?.icon}
      >
        {activeInvoice && (
          <div className="space-y-3">
            <SectionBlock variant="plain">
              <SectionHeader icon={FileTextIcon} title="Osnovni podaci" />
              <DetailsGrid columns={2}>
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
                {activeInvoice.original_invoice_number && (
                  <DetailsItem
                    icon={RepeatIcon}
                    label="Storno od"
                    value={activeInvoice.original_invoice_number}
                    color="bg-red-500/10 text-red-500"
                  />
                )}
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
                  icon={CreditCardIcon}
                  label="Bankovni račun"
                  value={activeInvoice.bank_account ? `${activeInvoice.bank_account.bank_name} (${activeInvoice.bank_account.account_number})` : "—"}
                  color="bg-slate-500/10 text-slate-500"
                />
                <DetailsItem
                  icon={FileTextIcon}
                  label="Predložak"
                  value={activeInvoice.invoice_template_label || "—"}
                  color="bg-indigo-500/10 text-indigo-500"
                />
                <DetailsItem
                  icon={CreditCardIcon}
                  label="Način plaćanja"
                  value={activeInvoice.payment_type_label || "—"}
                  color="bg-teal-500/10 text-teal-500"
                />
                <DetailsItem
                  icon={RepeatIcon}
                  label="Ponavljanje"
                  value={activeInvoice.is_recurring ? activeInvoice.frequency_label : "Ne"}
                  color="bg-teal-500/10 text-teal-500"
                />
              </DetailsGrid>
            </SectionBlock>

            {/* Notes */}
            {activeInvoice.notes && (
              <div className="p-3 bg-[var(--color-border)] rounded-2xl border border-[var(--color-border-strong)]">
                <div className="flex items-center gap-2 mb-1">
                  <StickyNoteIcon className="h-3 w-3 text-[var(--color-text-dim)]" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-dim)]">Napomena</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">{activeInvoice.notes}</p>
              </div>
            )}

            {/* Items */}
            <SectionBlock variant="plain">
              <SectionHeader icon={BoxesIcon} title={`Stavke (${activeInvoice.items.length})`} />

              <div className="hidden md:grid grid-cols-[minmax(0,1fr)_70px_110px_80px_120px] gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-dim)] px-2">
                <span>Stavka</span>
                <span className="text-right">Kol.</span>
                <span className="text-right">Cijena</span>
                <span className="text-right">PDV</span>
                <span className="text-right">Ukupno</span>
              </div>

              <div className="space-y-2">
                {activeInvoice.items.map((item, idx) => {
                  const signedTotal = applyRefundSign(item.total, activeInvoice);
                  const unitPrice = item.quantity > 0 ? Math.round(signedTotal / item.quantity) : 0;
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
                            {formatPrice(signedTotal)} {activeInvoice.currency}
                          </p>
                        </div>
                        <div className="flex gap-4 text-[10px] text-[var(--color-text-dim)]">
                          <span>Kol: <strong className="text-[var(--color-text-muted)]">{item.quantity}</strong></span>
                          <span>Cijena: <strong className="text-[var(--color-text-muted)]">{formatPrice(unitPrice)} {activeInvoice.currency}</strong></span>
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
                          {formatPrice(unitPrice)} {activeInvoice.currency}
                        </div>
                        <div className="text-xs font-bold text-[var(--color-text-muted)] text-right">
                          {item.tax_rate / 100}%
                        </div>
                        <div className="text-sm font-black text-primary text-right">
                          {formatPrice(signedTotal)} {activeInvoice.currency}
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
                <span className="font-bold text-[var(--color-text-main)]">{formatSignedPrice(activeInvoice.subtotal, activeInvoice)} {activeInvoice.currency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-dim)]">PDV:</span>
                <span className="font-bold text-[var(--color-text-main)]">{formatSignedPrice(activeInvoice.tax_total, activeInvoice)} {activeInvoice.currency}</span>
              </div>
              <div className="h-[1px] bg-amber-500/20" />
              <div className="flex justify-between">
                <span className="text-sm font-bold text-[var(--color-text-main)]">Ukupno:</span>
                <span className="text-xl font-black text-primary tracking-tighter italic">{formatSignedPrice(activeInvoice.total, activeInvoice)} {activeInvoice.currency}</span>
              </div>
            </div>

            {/* PDF i Email */}
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
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-blue-500/30 bg-blue-500/10 text-blue-500 font-bold text-sm hover:bg-blue-500/20 transition-all cursor-pointer min-h-[44px]"
              >
                <MailIcon className="h-4 w-4" />
                Pošalji mail
              </button>
            </div>

            {/* Fiskalizacija - vizuelno odvojena sekcija */}
            <div className="mt-6 pt-4 border-t-2 border-dashed border-[var(--color-border)]">
              <SectionHeader
                icon={FileTextIcon}
                title="Fiskalizacija (OFS ESIR)"
                iconClassName={isRefunded
                  ? "bg-red-500/10 text-red-500"
                  : isFiscalized
                    ? "bg-emerald-500/10 text-emerald-500"
                    : isRefundCreated
                      ? "bg-amber-500/10 text-amber-500"
                      : "bg-amber-500/10 text-amber-500"}
                className="mb-3"
              />

              <div className="p-4 rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-[var(--color-text-main)] mt-1">
                      {fiscalBadge.label}
                    </p>
                  </div>
                  <StatusBadge
                    label={fiscalBadge.label}
                    color={fiscalBadge.color as BadgeColor}
                  />
                </div>

                <div className="h-px bg-[var(--color-border)]" />

                <div>
                  {activeInvoice.fiscal_records && activeInvoice.fiscal_records.length > 0 ? (
                    <div className="space-y-1.5">
                      {activeInvoice.fiscal_records.map((rec) => {
                        const isOriginal = rec.type === "original";
                        const isCopy = rec.type === "copy";
                        const bgClass = isOriginal
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : isCopy
                            ? "bg-blue-500/10 border-blue-500/30"
                            : "bg-red-500/10 border-red-500/30";
                        const textClass = isOriginal ? "text-emerald-600" : isCopy ? "text-blue-600" : "text-red-600";
                        const hoverClass = isOriginal ? "hover:bg-emerald-500/15" : isCopy ? "hover:bg-blue-500/15" : "hover:bg-red-500/15";
                        const hasActions = Boolean(rec.verification_url || rec.fiscal_receipt_image_path);

                        return (
                          <div
                            key={rec.id}
                            className={`rounded-xl border-2 overflow-hidden transition-colors ${bgClass}`}
                          >
                            <div className={`flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-1 px-4 py-3 ${hoverClass}`}>
                              <div className="flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-1 min-w-0 flex-1">
                                <span className={`text-[9px] font-black uppercase tracking-widest shrink-0 ${textClass}`}>
                                  {rec.type_label}
                                </span>
                                <span className="text-xs font-bold text-[var(--color-text-main)] truncate min-w-0 flex-1" title={rec.fiscal_invoice_number || undefined}>
                                  {rec.fiscal_invoice_number || "—"}
                                </span>
                                {rec.fiscalized_at && (
                                  <span className="text-[9px] text-[var(--color-text-dim)] shrink-0 whitespace-nowrap">
                                    {rec.fiscalized_at}
                                  </span>
                                )}
                                {rec.fiscal_counter != null && (
                                  <span className="text-[9px] text-[var(--color-text-dim)] shrink-0 whitespace-nowrap">
                                    Brojač: {String(rec.fiscal_counter)}
                                  </span>
                                )}
                              </div>
                              {hasActions && (
                                <div className="flex items-center gap-1.5 ml-auto shrink-0">
                                  {rec.verification_url && (
                                    <a
                                      href={rec.verification_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-primary hover:text-primary/80"
                                      title="Verifikacija na Poreskoj upravi"
                                    >
                                      <ExternalLinkIcon className="h-3.5 w-3.5" />
                                    </a>
                                  )}
                                  {rec.fiscal_receipt_image_path && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFiscalImageRecordId(rec.id);
                                        setFiscalImageModalOpen(true);
                                      }}
                                      className={`p-1 rounded-lg transition-all cursor-pointer ${
                                        isOriginal
                                          ? "text-emerald-500 hover:bg-emerald-500/20"
                                          : isCopy
                                            ? "text-blue-500 hover:bg-blue-500/20"
                                            : "text-red-500 hover:bg-red-500/20"
                                      }`}
                                      title="Pregled slike računa"
                                    >
                                      <ImageIcon className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : activeInvoice.fiscal_invoice_number ? (
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                      <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span className="text-xs font-bold text-[var(--color-text-main)]">{activeInvoice.fiscal_invoice_number}</span>
                      {activeInvoice.fiscal_counter != null && (
                        <span className="text-[9px] text-[var(--color-text-dim)]">Brojač: {String(activeInvoice.fiscal_counter)}</span>
                      )}
                      {activeInvoice.fiscal_verification_url && (
                        <a
                          href={activeInvoice.fiscal_verification_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex text-primary hover:text-primary/80 shrink-0"
                          title="Verifikacija na Poreskoj upravi"
                        >
                          <ExternalLinkIcon className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {activeInvoice.fiscal_receipt_image_path && (
                        <button
                          type="button"
                          onClick={() => {
                            const origRec = activeInvoice.fiscal_records?.find((r) => r.type === "original");
                            setFiscalImageRecordId(origRec?.id ?? null);
                            setFiscalImageModalOpen(true);
                          }}
                          className="p-1 rounded-lg text-emerald-500 hover:bg-emerald-500/20 transition-all cursor-pointer shrink-0"
                          title="Pregled slike računa"
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[var(--color-text-dim)]">
                      Nema fiskalnih zapisa za ovaj račun.
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  {!isRefundInvoice && !isFiscalized && (
                    <button
                      type="button"
                      onClick={handleFiscalize}
                      disabled={fiscalLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary/20 border-2 border-primary/30 text-primary font-bold text-sm hover:bg-primary/30 transition-all disabled:opacity-50 cursor-pointer min-h-[44px]"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      {fiscalLoading ? "Fiskalizacija..." : "Fiskalizuj i štampaj"}
                    </button>
                  )}
                  {!isRefundInvoice && hasOriginalFiscal && (
                    <button
                      type="button"
                      onClick={handleFiscalizeCopy}
                      disabled={fiscalLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-blue-500/30 bg-blue-500/10 text-blue-500 font-bold text-sm hover:bg-blue-500/20 transition-all disabled:opacity-50 cursor-pointer min-h-[44px]"
                    >
                      {fiscalLoading ? (
                        <>
                          <span className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
                          Obrada...
                        </>
                      ) : (
                        <>
                          <FileTextIcon className="h-4 w-4" />
                          Štampaj kopiju
                        </>
                      )}
                    </button>
                  )}
                  {isRefundInvoice && isRefundCreated && (
                    <button
                      type="button"
                      onClick={() => setRefundModalOpen(true)}
                      disabled={fiscalLoading || hasRefundFiscal}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-red-500/30 bg-red-500/10 text-red-500 font-bold text-sm hover:bg-red-500/20 transition-all disabled:opacity-50 cursor-pointer min-h-[44px]"
                    >
                      {fiscalLoading ? (
                        <>
                          <span className="animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-t-transparent" />
                          Obrada...
                        </>
                      ) : (
                        <>
                          <AlertTriangleIcon className="h-4 w-4" />
                          Refundacija
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* Fiscal image modal */}
      <ImageModal
        isOpen={fiscalImageModalOpen}
        onClose={() => {
          setFiscalImageModalOpen(false);
          setFiscalImageRecordId(null);
        }}
        src={
          activeInvoice?.fiscal_receipt_image_path || activeInvoice?.fiscal_records?.some((r) => r.fiscal_receipt_image_path)
            ? `/${selectedCompany?.slug}/invoices/${activeInvoice?.id}/fiscal-receipt-image${fiscalImageRecordId ? `?fiscal_record_id=${fiscalImageRecordId}` : ""}`
            : undefined
        }
        token={token ?? undefined}
        alt="Fiskalni račun"
        title="Pregled fiskalnog računa"
      />

      {/* Create refund invoice modal */}
      <ConfirmModal
        isOpen={stornoModalOpen}
        onClose={() => !stornoLoading && setStornoModalOpen(false)}
        onConfirm={handleCreateRefundInvoice}
        title="Kreiraj storno fakturu"
        message="Da li ste sigurni da želite kreirati storno fakturu? Nakon toga ćete moći izvršiti refundaciju kroz fiskalizaciju."
        confirmLabel="Kreiraj storno"
        cancelLabel="Odustani"
        type="warning"
        loading={stornoLoading}
      />

      {/* Delete invoice modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => !deleteLoading && setDeleteModalOpen(false)}
        onConfirm={handleDeleteInvoice}
        title="Obriši račun"
        message="Da li ste sigurni da želite obrisati ovaj račun? Ova akcija se ne može poništiti."
        confirmLabel="Obriši"
        cancelLabel="Odustani"
        type="danger"
        loading={deleteLoading}
      />

      {/* Refund confirmation modal */}
      <ConfirmModal
        isOpen={refundModalOpen}
        onClose={() => !fiscalLoading && setRefundModalOpen(false)}
        onConfirm={handleFiscalizeRefund}
        title="Storniraj fiskalni račun"
        message="Da li ste sigurni da želite stornirati ovaj fiskalni račun? Ova akcija se ne može poništiti."
        confirmLabel="Storniraj"
        cancelLabel="Odustani"
        type="danger"
        loading={fiscalLoading}
      />

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
                Pošalji fakturu na email
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
                  label="Priloži PDF fakturu"
                  className="!p-2"
                />
                {(() => {
                  const fiscalRecordsWithImages = (activeInvoice?.fiscal_records ?? []).filter((r) => r.fiscal_receipt_image_path);
                  if (fiscalRecordsWithImages.length === 0) return null;
                  return (
                    <div className="space-y-2">
                      {fiscalRecordsWithImages.map((r) => (
                        <Toggle
                          key={r.id}
                          checked={emailForm.attach_fiscal_record_ids.includes(r.id)}
                          onChange={(v) => {
                            setEmailForm((prev) => ({
                              ...prev,
                              attach_fiscal_record_ids: v
                                ? [...prev.attach_fiscal_record_ids, r.id]
                                : prev.attach_fiscal_record_ids.filter((id) => id !== r.id),
                            }));
                          }}
                          label={`Priloži sliku fiskalnog računa (${r.type_label})`}
                          className="!p-2"
                        />
                      ))}
                    </div>
                  );
                })()}
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
        title={formMode === "create" ? "Novi račun" : "Uredi račun"}
        onSubmit={handleFormSubmit}
        loading={formLoading}
        submitLabel={formMode === "create" ? "Kreiraj račun" : "Sačuvaj izmjene"}
      >
        <div className="space-y-3">
          {/* Osnovni podaci */}
          <SectionBlock variant="card">
            <SectionHeader icon={ContactRoundIcon} title="Osnovni podaci" />

            {/* 1. Klijent - uvijek vidljiv, ikona unutar */}
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

            {/* 2. Datum, Dospijeće, Način plaćanja - ikone unutar inputa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 items-start">
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
                label="Dospijeće"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                icon={Clock1Icon}
                required
                className="h-[44px] min-h-[44px] py-2 rounded-xl"
              />
              <div className="space-y-1.5 group">
                <label className="text-[11px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)] ml-1 block">
                  Način plaćanja
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)] group-focus-within:text-primary transition-colors">
                    <CreditCardIcon className="h-4 w-4" />
                  </div>
                  <select
                    value={formData.payment_type ?? ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_type: e.target.value }))}
                    className="w-full h-[44px] min-h-[44px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] font-bold text-sm pl-11 pr-10 py-2 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 cursor-pointer"
                  >
                    {paymentTypes.map((pt) => (
                      <option key={pt.value} value={pt.value}>{pt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
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
                {/* Valuta, Bankovni račun, Jezik, Predložak - ikone unutar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-start">
                  <div className="space-y-1.5 group">
                    <label className="text-[11px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)] ml-1 block">Valuta</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]">
                        <CreditCardIcon className="h-4 w-4" />
                      </div>
                      <select
                        value={formData.currency_id ?? currencies.find(c => c.code === formData.currency)?.id ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const curr = currencies.find(c => c.id === parseInt(val));
                          setFormData(prev => ({ ...prev, currency_id: curr?.id ?? null, currency: curr?.code ?? prev.currency }));
                        }}
                        className="w-full min-h-[44px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] font-bold text-sm pl-10 pr-10 py-3 outline-none focus:border-primary/50 cursor-pointer"
                      >
                        {currencies.map(c => (
                          <option key={c.id} value={c.id}>{c.code}</option>
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
                        value={formData.invoice_template}
                        onChange={(e) => setFormData(prev => ({ ...prev, invoice_template: e.target.value }))}
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

                {/* Ponavljajući račun */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-teal-500/10 text-teal-500 rounded-lg flex items-center justify-center shrink-0">
                      <RepeatIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--color-text-main)]">Ponavljajući račun</p>
                      <p className="text-[9px] text-[var(--color-text-dim)]">Automatski generiši račune</p>
                    </div>
                  </div>
                  <Toggle
                    checked={formData.is_recurring}
                    onChange={(v) => setFormData(prev => ({
                      ...prev,
                      is_recurring: v,
                      frequency: v ? "monthly" : null,
                      next_invoice_date: v ? prev.due_date : null
                    }))}
                    label=""
                    className="!p-0 !border-0 !bg-transparent"
                  />
                </div>

                {formData.is_recurring && (
                  <div className="grid grid-cols-2 gap-3 items-start">
                    <div className="space-y-1.5 group">
                      <label className="text-[11px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)] ml-1 block">Učestalost</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]">
                          <RepeatIcon className="h-4 w-4" />
                        </div>
                        <select
                          value={formData.frequency || "monthly"}
                          onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                          className="w-full min-h-[44px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] font-bold text-sm pl-10 pr-10 py-3 outline-none focus:border-primary/50 cursor-pointer"
                        >
                          {frequencies.map(f => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <Input
                      label="Sljedeći račun"
                      type="date"
                      value={formData.next_invoice_date || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, next_invoice_date: e.target.value }))}
                      icon={Calendar1Icon}
                      className="min-h-[44px] py-3 rounded-xl"
                    />
                  </div>
                )}
              </div>
            )}
          </SectionBlock>

          {/* 4. Stavke */}
          <SectionBlock variant="card">
            <SectionHeader icon={BoxesIcon} title={`Stavke (${formData.items.length})`} />

            {formData.items.map((item, idx) => (
              <InvoiceItemRow
                key={idx}
                item={item}
                index={idx}
                articles={articles}
                currency={formData.currency ?? "BAM"}
                onChange={handleItemChange}
                onRemove={handleItemRemove}
                disabled={formLoading}
              />
            ))}
            <button
              type="button"
              onClick={addItem}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-primary/40 bg-primary/5 text-primary hover:border-primary/60 hover:bg-primary/10 transition-colors cursor-pointer"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="text-[11px] font-bold">Dodaj stavku</span>
            </button>
          </SectionBlock>

          {/* 5. Ukupno */}
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
