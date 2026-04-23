import { useNavigate } from "react-router";
import { useAuth } from "~/hooks/useAuth";
import { useSelectedYear } from "~/contexts/YearContext";
import { useEffect, useState, useCallback } from "react";
import type { FormEvent } from "react";
import { parseDateForInput, emptyDocumentItem } from "~/utils/format";
import { getQuotes, getQuote, createQuote, updateQuote, deleteQuote, downloadQuotePdf, sendQuoteEmail, convertQuoteToProforma } from "~/api/quotes";
import type { Quote, QuoteInput } from "~/types/quote";
import type { Client } from "~/types/client";
import { XIcon, FileSlidersIcon } from "~/components/ui/icons";
import { AppLayout } from "~/components/layout/AppLayout";
import { CreateButton } from "~/components/ui/CreateButton";
import { Toast } from "~/components/ui/Toast";
import { Pagination } from "~/components/ui/Pagination";
import { StatusBadge, type BadgeColor } from "~/components/ui/StatusBadge";
import { EmptyState } from "~/components/ui/EmptyState";
import { LoadingState } from "~/components/ui/LoadingState";
import { DetailDrawer } from "~/components/ui/DetailDrawer";
import { ConfirmModal } from "~/components/ui/ConfirmModal";
import { FormDrawer } from "~/components/ui/FormDrawer";
import { DocumentFilterSection } from "~/components/document/DocumentFilterSection";
import { DocumentDetailView } from "~/components/document/DocumentDetailView";
import { DocumentFormFields } from "~/components/document/DocumentFormFields";
import { DocumentListView } from "~/components/document/DocumentListView";
import { EmailModal } from "~/components/document/EmailModal";
import type { PaginationMeta } from "~/types/api";
import { useToast } from "~/hooks/useToast";
import { useDocumentItems } from "~/hooks/useDocumentItems";
import { useDocumentReferenceData } from "~/hooks/useDocumentReferenceData";

const emptyItem = emptyDocumentItem;

export default function QuotesPage() {
  const navigate = useNavigate();
  const { selectedCompany, updateSelectedCompany, token, isAuthenticated } = useAuth();
  const [selectedYear] = useSelectedYear();

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [convertLoading, setConvertLoading] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailForm, setEmailForm] = useState({ to: "", subject: "", body: "", attach_pdf: true });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { toast, showToast, hideToast } = useToast();
  const {
    clients, articles, currencies,
    languages, templates, companySettings, defaultCurrency,
  } = useDocumentReferenceData(selectedCompany?.slug, token, isAuthenticated, showToast);

  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [activeQuote, setActiveQuote] = useState<Quote | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [showMoreFormFields, setShowMoreFormFields] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [formData, setFormData] = useState<QuoteInput>({
    client_id: 0, date: new Date().toISOString().split("T")[0],
    valid_until: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    currency_id: null, language: "", quote_template: "classic", notes: "",
    subtotal: 0, tax_total: 0, discount_total: 0, total: 0, items: [{ ...emptyItem }]
  });

  const { handleItemChange, handleItemRemove, addItem, handleClientChange } = useDocumentItems(formData, setFormData, emptyItem, setSelectedClient);
  const searchForApi = searchQuery.trim().length >= 3 ? searchQuery.trim() : "";

  const fetchQuotes = useCallback(async (page: number = 1) => {
    if (!selectedCompany || !token) return;
    setLoading(true);
    try {
      const response = await getQuotes(selectedCompany.slug, token, page, {
        search: searchForApi || undefined, status: statusFilter || undefined,
        date_from: dateFrom || undefined, date_to: dateTo || undefined,
        year: (dateFrom || dateTo) ? undefined : selectedYear,
      });
      setQuotes(response.data);
      setPagination(response.meta);
      setCurrentPage(page);
    } catch (error: any) {
      showToast(error.message || "Greška pri dohvatanju ponuda", "error");
    } finally { setLoading(false); }
  }, [selectedCompany, token, searchForApi, statusFilter, dateFrom, dateTo, selectedYear]);

  useEffect(() => {
    if (isAuthenticated && selectedCompany) { fetchQuotes(currentPage); }
  }, [isAuthenticated, selectedCompany, currentPage, fetchQuotes]);

  const handleRowClick = async (quote: Quote) => {
    if (!selectedCompany || !token) return;
    try {
      const response = await getQuote(selectedCompany.slug, quote.id, token);
      setActiveQuote(response.data); setViewDrawerOpen(true);
    } catch (error: any) { showToast(error.message || "Greška pri učitavanju ponude", "error"); }
  };

  const openCreateForm = () => {
    const s = companySettings;
    const dueDays = s?.default_quote_due_days;
    const defCurr = currencies.find(c => c.is_default) || currencies[0];
    setFormMode("create"); setSelectedClient(null);
    setFormData({
      client_id: 0, date: new Date().toISOString().split("T")[0],
      valid_until: dueDays != null ? new Date(Date.now() + dueDays * 86400000).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      currency_id: defCurr?.id ?? null,
      language: s?.default_document_language ?? languages[0]?.value ?? "",
      quote_template: s?.default_document_template ?? "",
      notes: s?.default_quote_notes ?? s?.default_document_notes ?? "",
      subtotal: 0, tax_total: 0, discount_total: 0, total: 0, items: [{ ...emptyItem }]
    });
    setFormDrawerOpen(true); setShowMoreFormFields(false);
  };

  const openEditForm = () => {
    if (!activeQuote) return;
    setFormMode("edit");
    setSelectedClient(clients.find(c => c.id === activeQuote.client_id) || null);
    setFormData({
      quote_number: activeQuote.quote_number, client_id: activeQuote.client_id ?? 0,
      date: parseDateForInput(activeQuote.date), valid_until: parseDateForInput(activeQuote.valid_until),
      currency_id: activeQuote.currency_id ?? null,
      language: activeQuote.language, quote_template: activeQuote.quote_template,
      notes: activeQuote.notes || "", subtotal: activeQuote.subtotal, tax_total: activeQuote.tax_total,
      discount_total: activeQuote.discount_total, total: activeQuote.total,
      items: activeQuote.items.map(i => ({
        article_id: i.article_id, name: i.name, description: i.description,
        quantity: i.quantity, unit_price: i.unit_price, subtotal: i.subtotal,
        tax_rate: i.tax_rate, tax_amount: i.tax_amount, total: i.total
      }))
    });
    setViewDrawerOpen(false); setFormDrawerOpen(true); setShowMoreFormFields(true);
  };

  const handleDelete = async () => {
    if (!selectedCompany || !token || !activeQuote) return;
    setLoading(true);
    try {
      const res = await deleteQuote(selectedCompany.slug, activeQuote.id, token);
      showToast(res.message || "Ponuda uspješno obrisana", "info");
      setViewDrawerOpen(false); fetchQuotes(currentPage);
    } catch (err: any) { showToast(err.message || "Greška pri brisanju ponude", "error"); }
    finally { setLoading(false); setDeleteModalOpen(false); }
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !token) return;
    if (formMode === "create" && !selectedClient) { showToast("Klijent je obavezan", "error"); return; }
    if (formData.items.length === 0 || !formData.items.some(i => i.name)) { showToast("Morate dodati barem jednu stavku", "error"); return; }
    setFormLoading(true);
    try {
      const payload = { ...formData, valid_until: formData.valid_until || null,
        client_id: formMode === "create" ? selectedClient!.id : (formData.client_id ?? selectedClient?.id ?? null) };
      if (formMode === "create") {
        const res = await createQuote(selectedCompany.slug, token, payload);
        showToast("Ponuda uspješno kreirana", "success"); setFormDrawerOpen(false);
        const full = await getQuote(selectedCompany.slug, res.data.id, token);
        setActiveQuote(full.data); setViewDrawerOpen(true); fetchQuotes(currentPage);
      } else if (activeQuote) {
        const res = await updateQuote(selectedCompany.slug, activeQuote.id, token, payload);
        showToast("Ponuda uspješno ažurirana", "success"); setFormDrawerOpen(false);
        setActiveQuote((prev) => (prev ? { ...prev, ...res.data } : res.data));
        setViewDrawerOpen(true); fetchQuotes(currentPage);
      }
    } catch (err: any) { showToast(err.message || "Greška pri čuvanju ponude", "error"); }
    finally { setFormLoading(false); }
  };

  const handleDownloadPdf = async () => {
    if (!selectedCompany || !token || !activeQuote) return;
    setPdfLoading(true);
    try { await downloadQuotePdf(selectedCompany.slug, activeQuote.id, activeQuote.quote_number, token); showToast("PDF preuzet", "success"); }
    catch (err: any) { showToast(err.message || "Greška pri preuzimanju PDF-a", "error"); }
    finally { setPdfLoading(false); }
  };

  const handleConvert = async () => {
    if (!selectedCompany || !token || !activeQuote) return;
    setConvertLoading(true);
    try { await convertQuoteToProforma(selectedCompany.slug, activeQuote.id, token); showToast("Ponuda pretvorena u predračun", "success"); setViewDrawerOpen(false); navigate("/proformas"); }
    catch (err: any) { showToast(err.message || "Greška pri pretvaranju u predračun", "error"); }
    finally { setConvertLoading(false); }
  };

  const openEmailModal = () => {
    setEmailForm({ to: activeQuote?.client?.email || "", subject: `Ponuda ${activeQuote?.quote_number || ""}`,
      body: `Poštovani,\n\nU prilogu vam šaljemo ponudu ${activeQuote?.quote_number || ""}.\n\nS poštovanjem`, attach_pdf: true });
    setEmailModalOpen(true);
  };

  const handleSendEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !token || !activeQuote) return;
    if (!emailForm.to) { showToast("Unesite email adresu primaoca", "error"); return; }
    setEmailLoading(true);
    try {
      const res = await sendQuoteEmail(selectedCompany.slug, activeQuote.id, token, emailForm);
      showToast(res.message || "Ponuda uspješno poslata na email", "success"); setEmailModalOpen(false);
    } catch (err: any) { showToast(err.message || "Greška pri slanju maila", "error"); }
    finally { setEmailLoading(false); }
  };

  const statusOptions = [{ value: "", label: "Status: Svi" }, { value: "created", label: "Status: Kreiran" }];

  return (
    <AppLayout title="quotes" selectedCompany={selectedCompany} onCompanyChange={updateSelectedCompany}
      actions={<CreateButton label="Nova ponuda" onClick={openCreateForm} />}>
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />
      <ConfirmModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleDelete}
        title="Obriši ponudu" message={`Da li ste sigurni da želite trajno obrisati ponudu ${activeQuote?.quote_number}? Ova akcija se ne može poništiti.`} />

      <DocumentFilterSection filtersOpen={filtersOpen} onToggleFilters={() => setFiltersOpen(p => !p)}
        searchQuery={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Pretraži ponude (min. 3 znaka)..."
        statusFilter={statusFilter} onStatusChange={setStatusFilter} statusOptions={statusOptions}
        dateFrom={dateFrom} onDateFromChange={setDateFrom} dateTo={dateTo} onDateToChange={setDateTo}
        dateLabel="Datum ponude" selectedYear={selectedYear} onPageReset={() => setCurrentPage(1)} />

      <DocumentListView
        items={quotes} onRowClick={handleRowClick} icon={FileSlidersIcon}
        getNumber={(q) => q.quote_number} getSecondaryDate={(q) => q.valid_until}
        headerLabel="Ponuda / Klijent" secondaryDateLabel="Važi do"
      />

      {loading && <LoadingState />}
      {!loading && quotes.length === 0 && <EmptyState icon={XIcon} message="Nema pronađenih ponuda" />}
      {pagination && <Pagination pagination={pagination} currentPage={currentPage} onPageChange={setCurrentPage} loading={loading} />}

      {/* View Drawer */}
      <DetailDrawer isOpen={viewDrawerOpen} onClose={() => setViewDrawerOpen(false)} title="Detalji ponude"
        entityName={activeQuote?.quote_number || ""} entityIcon={FileSlidersIcon}
        badges={activeQuote && <StatusBadge label={activeQuote.status_label} color={(activeQuote.status_color as BadgeColor) || "gray"} />}
        onEdit={openEditForm} onDelete={() => setDeleteModalOpen(true)}>
        {activeQuote && (
          <DocumentDetailView
            document={activeQuote} icon={FileSlidersIcon}
            secondaryDateLabel="Važi do" secondaryDateValue={activeQuote.valid_until}
            templateLabel={activeQuote.quote_template_label || "—"}
            onDownloadPdf={handleDownloadPdf} pdfLoading={pdfLoading} onSendEmail={openEmailModal}
            convertButton={
              <button type="button" onClick={handleConvert} disabled={convertLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-primary/30 bg-primary/10 text-primary font-bold text-sm hover:bg-primary/20 transition-all disabled:opacity-50 cursor-pointer min-h-[44px] mt-2">
                {convertLoading ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" /> : <FileSlidersIcon className="h-4 w-4" />}
                Pretvori u predračun
              </button>
            }
          />
        )}
      </DetailDrawer>

      {emailModalOpen && (
        <EmailModal title="Pošalji ponudu na email" emailForm={emailForm} onChange={setEmailForm}
          onSubmit={handleSendEmail} onClose={() => setEmailModalOpen(false)} loading={emailLoading} pdfLabel="Priloži PDF ponude" />
      )}

      {/* Form Drawer */}
      <FormDrawer isOpen={formDrawerOpen} onClose={() => setFormDrawerOpen(false)}
        title={formMode === "create" ? "Nova ponuda" : "Uredi ponudu"} onSubmit={handleFormSubmit}
        loading={formLoading} submitLabel={formMode === "create" ? "Kreiraj ponudu" : "Sačuvaj izmjene"}>
        <DocumentFormFields
          formData={formData} onFormChange={setFormData}
          secondaryDateLabel="Važi do" secondaryDateValue={formData.valid_until ?? ""}
          secondaryDateKey="valid_until" templateKey="quote_template" templateValue={formData.quote_template ?? ""}
          clients={clients} articles={articles} currencies={currencies}
          languages={languages} templates={templates} selectedClient={selectedClient}
          onClientChange={handleClientChange} onItemChange={handleItemChange}
          onItemRemove={handleItemRemove} onAddItem={addItem}
          showMoreFields={showMoreFormFields} onToggleMoreFields={() => setShowMoreFormFields(p => !p)}
        />
      </FormDrawer>
    </AppLayout>
  );
}
