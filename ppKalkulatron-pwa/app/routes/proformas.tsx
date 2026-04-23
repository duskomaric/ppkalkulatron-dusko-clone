import { useNavigate } from "react-router";
import { useAuth } from "~/hooks/useAuth";
import { useSelectedYear } from "~/contexts/YearContext";
import { useEffect, useState, useCallback } from "react";
import type { FormEvent } from "react";
import { parseDateForInput, emptyDocumentItem } from "~/utils/format";
import { getProformas, getProforma, createProforma, updateProforma, deleteProforma, downloadProformaPdf, sendProformaEmail, convertProformaToInvoice } from "~/api/proformas";
import type { Proforma, ProformaInput } from "~/types/proforma";
import type { Client } from "~/types/client";
import { XIcon, FileCheckIcon, FileSlidersIcon } from "~/components/ui/icons";
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

export default function ProformasPage() {
  const navigate = useNavigate();
  const { selectedCompany, updateSelectedCompany, token, isAuthenticated } = useAuth();
  const [selectedYear] = useSelectedYear();

  const [proformas, setProformas] = useState<Proforma[]>([]);
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
  const [activeProforma, setActiveProforma] = useState<Proforma | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [showMoreFormFields, setShowMoreFormFields] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [formData, setFormData] = useState<ProformaInput>({
    client_id: 0, date: new Date().toISOString().split("T")[0],
    due_date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    currency_id: null, language: "sr_Latn", proforma_template: "classic", notes: "",
    subtotal: 0, tax_total: 0, discount_total: 0, total: 0, items: [{ ...emptyItem }]
  });

  const { handleItemChange, handleItemRemove, addItem, handleClientChange } = useDocumentItems(formData, setFormData, emptyItem, setSelectedClient);
  const searchForApi = searchQuery.trim().length >= 3 ? searchQuery.trim() : "";

  const fetchProformas = useCallback(async (page: number = 1) => {
    if (!selectedCompany || !token) return;
    setLoading(true);
    try {
      const response = await getProformas(selectedCompany.slug, token, page, {
        search: searchForApi || undefined, status: statusFilter || undefined,
        date_from: dateFrom || undefined, date_to: dateTo || undefined,
        year: (dateFrom || dateTo) ? undefined : selectedYear,
      });
      setProformas(response.data);
      setPagination(response.meta);
      setCurrentPage(page);
    } catch (error: any) {
      showToast(error.message || "Greška pri dohvatanju predračuna", "error");
    } finally { setLoading(false); }
  }, [selectedCompany, token, searchForApi, statusFilter, dateFrom, dateTo, selectedYear]);

  useEffect(() => {
    if (isAuthenticated && selectedCompany) { fetchProformas(currentPage); }
  }, [isAuthenticated, selectedCompany, currentPage, fetchProformas]);

  const handleRowClick = async (proforma: Proforma) => {
    if (!selectedCompany || !token) return;
    try {
      const response = await getProforma(selectedCompany.slug, proforma.id, token);
      setActiveProforma(response.data); setViewDrawerOpen(true);
    } catch (error: any) { showToast(error.message || "Greška pri učitavanju predračuna", "error"); }
  };

  const openCreateForm = () => {
    const s = companySettings;
    const dueDays = s?.default_proforma_due_days;
    const defCurr = currencies.find(c => c.is_default) || currencies[0];
    setFormMode("create"); setSelectedClient(null);
    setFormData({
      client_id: 0, date: new Date().toISOString().split("T")[0],
      due_date: dueDays != null ? new Date(Date.now() + dueDays * 86400000).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      currency_id: defCurr?.id ?? null,
      language: s?.default_document_language ?? languages[0]?.value ?? "",
      proforma_template: s?.default_document_template ?? "",
      notes: s?.default_proforma_notes ?? s?.default_document_notes ?? "",
      subtotal: 0, tax_total: 0, discount_total: 0, total: 0, items: [{ ...emptyItem }]
    });
    setFormDrawerOpen(true); setShowMoreFormFields(false);
  };

  const openEditForm = () => {
    if (!activeProforma) return;
    setFormMode("edit");
    setSelectedClient(clients.find(c => c.id === activeProforma.client_id) || null);
    setFormData({
      proforma_number: activeProforma.proforma_number, client_id: activeProforma.client_id ?? 0,
      date: parseDateForInput(activeProforma.date), due_date: parseDateForInput(activeProforma.due_date),
      currency_id: activeProforma.currency_id ?? null,
      language: activeProforma.language, proforma_template: activeProforma.proforma_template,
      notes: activeProforma.notes || "", subtotal: activeProforma.subtotal, tax_total: activeProforma.tax_total,
      discount_total: activeProforma.discount_total, total: activeProforma.total,
      items: activeProforma.items.map(i => ({
        article_id: i.article_id, name: i.name, description: i.description,
        quantity: i.quantity, unit_price: i.unit_price, subtotal: i.subtotal,
        tax_rate: i.tax_rate, tax_amount: i.tax_amount, total: i.total
      }))
    });
    setViewDrawerOpen(false); setFormDrawerOpen(true); setShowMoreFormFields(true);
  };

  const handleDelete = async () => {
    if (!selectedCompany || !token || !activeProforma) return;
    setLoading(true);
    try {
      const res = await deleteProforma(selectedCompany.slug, activeProforma.id, token);
      showToast(res.message || "Predračun uspješno obrisan", "info");
      setViewDrawerOpen(false); fetchProformas(currentPage);
    } catch (err: any) { showToast(err.message || "Greška pri brisanju predračuna", "error"); }
    finally { setLoading(false); setDeleteModalOpen(false); }
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !token) return;
    if (formMode === "create" && !selectedClient) { showToast("Klijent je obavezan", "error"); return; }
    if (formData.items.length === 0 || !formData.items.some(i => i.name)) { showToast("Morate dodati barem jednu stavku", "error"); return; }
    setFormLoading(true);
    try {
      const payload = { ...formData, due_date: formData.due_date || null,
        client_id: formMode === "create" ? selectedClient!.id : (formData.client_id ?? selectedClient?.id ?? null) };
      if (formMode === "create") {
        const res = await createProforma(selectedCompany.slug, token, payload);
        showToast("Predračun uspješno kreiran", "success"); setFormDrawerOpen(false);
        const full = await getProforma(selectedCompany.slug, res.data.id, token);
        setActiveProforma(full.data); setViewDrawerOpen(true); fetchProformas(currentPage);
      } else if (activeProforma) {
        const res = await updateProforma(selectedCompany.slug, activeProforma.id, token, payload);
        showToast("Predračun uspješno ažuriran", "success"); setFormDrawerOpen(false);
        setActiveProforma((prev) => (prev ? { ...prev, ...res.data } : res.data));
        setViewDrawerOpen(true); fetchProformas(currentPage);
      }
    } catch (err: any) { showToast(err.message || "Greška pri čuvanju predračuna", "error"); }
    finally { setFormLoading(false); }
  };

  const handleDownloadPdf = async () => {
    if (!selectedCompany || !token || !activeProforma) return;
    setPdfLoading(true);
    try { await downloadProformaPdf(selectedCompany.slug, activeProforma.id, activeProforma.proforma_number, token); showToast("PDF preuzet", "success"); }
    catch (err: any) { showToast(err.message || "Greška pri preuzimanju PDF-a", "error"); }
    finally { setPdfLoading(false); }
  };

  const handleConvert = async () => {
    if (!selectedCompany || !token || !activeProforma) return;
    setConvertLoading(true);
    try { await convertProformaToInvoice(selectedCompany.slug, activeProforma.id, token); showToast("Predračun pretvoren u račun", "success"); setViewDrawerOpen(false); navigate("/invoices"); }
    catch (err: any) { showToast(err.message || "Greška pri pretvaranju u račun", "error"); }
    finally { setConvertLoading(false); }
  };

  const openEmailModal = () => {
    setEmailForm({ to: activeProforma?.client?.email || "", subject: `Predračun ${activeProforma?.proforma_number || ""}`,
      body: `Poštovani,\n\nU prilogu vam šaljemo predračun ${activeProforma?.proforma_number || ""}.\n\nS poštovanjem`, attach_pdf: true });
    setEmailModalOpen(true);
  };

  const handleSendEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !token || !activeProforma) return;
    if (!emailForm.to) { showToast("Unesite email adresu primaoca", "error"); return; }
    setEmailLoading(true);
    try {
      const res = await sendProformaEmail(selectedCompany.slug, activeProforma.id, token, emailForm);
      showToast(res.message || "Predračun uspješno poslat na email", "success"); setEmailModalOpen(false);
    } catch (err: any) { showToast(err.message || "Greška pri slanju maila", "error"); }
    finally { setEmailLoading(false); }
  };

  const statusOptions = [{ value: "", label: "Status: Svi" }, { value: "created", label: "Status: Kreiran" }];

  return (
    <AppLayout title="proformas" selectedCompany={selectedCompany} onCompanyChange={updateSelectedCompany}
      actions={<CreateButton label="Novi predračun" onClick={openCreateForm} />}>
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />
      <ConfirmModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleDelete}
        title="Obriši predračun" message={`Da li ste sigurni da želite trajno obrisati predračun ${activeProforma?.proforma_number}? Ova akcija se ne može poništiti.`} />

      <DocumentFilterSection filtersOpen={filtersOpen} onToggleFilters={() => setFiltersOpen(p => !p)}
        searchQuery={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Pretraži predračune (min. 3 znaka)..."
        statusFilter={statusFilter} onStatusChange={setStatusFilter} statusOptions={statusOptions}
        dateFrom={dateFrom} onDateFromChange={setDateFrom} dateTo={dateTo} onDateToChange={setDateTo}
        dateLabel="Datum predračuna" selectedYear={selectedYear} onPageReset={() => setCurrentPage(1)} />

      <DocumentListView
        items={proformas} onRowClick={handleRowClick} icon={FileCheckIcon}
        getNumber={(p) => p.proforma_number} getSecondaryDate={(p) => p.due_date}
        headerLabel="Predračun / Klijent" secondaryDateLabel="Dospijeće"
        getSourceLabel={(p) => (p.source_document_number ? `Iz ponude: ${p.source_document_number}` : null)}
        getSourceIcon={() => FileSlidersIcon}
      />

      {loading && <LoadingState />}
      {!loading && proformas.length === 0 && <EmptyState icon={XIcon} message="Nema pronađenih predračuna" />}
      {pagination && <Pagination pagination={pagination} currentPage={currentPage} onPageChange={setCurrentPage} loading={loading} />}

      {/* View Drawer */}
      <DetailDrawer isOpen={viewDrawerOpen} onClose={() => setViewDrawerOpen(false)} title="Detalji predračuna"
        entityName={activeProforma?.proforma_number || ""} entityIcon={FileCheckIcon}
        badges={activeProforma && <StatusBadge label={activeProforma.status_label} color={(activeProforma.status_color as BadgeColor) || "gray"} />}
        onEdit={openEditForm} onDelete={() => setDeleteModalOpen(true)}>
        {activeProforma && (
          <DocumentDetailView
            document={activeProforma} icon={FileCheckIcon}
            secondaryDateLabel="Dospijeće" secondaryDateValue={activeProforma.due_date}
            templateLabel={activeProforma.proforma_template_label || "—"}
            sourceLabel={activeProforma.source_document_number ? `Iz ponude: ${activeProforma.source_document_number}` : null}
            sourceIcon={FileSlidersIcon}
            onDownloadPdf={handleDownloadPdf} pdfLoading={pdfLoading} onSendEmail={openEmailModal}
            convertButton={
              <button type="button" onClick={handleConvert} disabled={convertLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-primary/30 bg-primary/10 text-primary font-bold text-sm hover:bg-primary/20 transition-all disabled:opacity-50 cursor-pointer min-h-[44px] mt-2">
                {convertLoading ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" /> : <FileCheckIcon className="h-4 w-4" />}
                Pretvori u račun
              </button>
            }
          />
        )}
      </DetailDrawer>

      {emailModalOpen && (
        <EmailModal title="Pošalji predračun na email" emailForm={emailForm} onChange={setEmailForm}
          onSubmit={handleSendEmail} onClose={() => setEmailModalOpen(false)} loading={emailLoading} pdfLabel="Priloži PDF predračuna" />
      )}

      {/* Form Drawer */}
      <FormDrawer isOpen={formDrawerOpen} onClose={() => setFormDrawerOpen(false)}
        title={formMode === "create" ? "Novi predračun" : "Uredi predračun"} onSubmit={handleFormSubmit}
        loading={formLoading} submitLabel={formMode === "create" ? "Kreiraj predračun" : "Sačuvaj izmjene"}>
        <DocumentFormFields
          formData={formData} onFormChange={setFormData}
          secondaryDateLabel="Dospijeće" secondaryDateValue={formData.due_date ?? ""}
          secondaryDateKey="due_date" templateKey="proforma_template" templateValue={formData.proforma_template ?? ""}
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
