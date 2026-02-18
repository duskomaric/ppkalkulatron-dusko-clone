import { useAuth } from "~/hooks/useAuth";
import { useEffect, useState, useCallback } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { getClients, createClient, updateClient, deleteClient } from "~/api/clients";
import type { Client } from "~/types/client";
import {
  ContactRoundIcon,
  XIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  HashIcon,
  GlobeIcon,
  CheckCircleIcon,
  FileSlidersIcon
} from "~/components/ui/icons";
import { AppLayout } from "~/components/layout/AppLayout";
import { CreateButton } from "~/components/ui/CreateButton";
import { Toast } from "~/components/ui/Toast";
import { ConfirmModal } from "~/components/ui/ConfirmModal";
import { Pagination } from "~/components/ui/Pagination";
import { StatusBadge } from "~/components/ui/StatusBadge";
import { Input } from "~/components/ui/Input";
import { ResponsiveEntityCard } from "~/components/ui/ResponsiveEntityCard";
import { MetaItem } from "~/components/ui/MetaItem";
import { EmptyState } from "~/components/ui/EmptyState";
import { DetailsItem } from "~/components/ui/DetailsItem";
import { LoadingState } from "~/components/ui/LoadingState";
import { DetailDrawer } from "~/components/ui/DetailDrawer";
import { FormDrawer } from "~/components/ui/FormDrawer";
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

export default function ClientsPage() {
  const { selectedCompany, updateSelectedCompany, token, isAuthenticated } = useAuth();

  const createEmptyClientForm = (): Partial<Client> => ({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
    country: "",
    tax_id: "",
    vat_id: "",
    is_active: true,
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const { toast, showToast, hideToast } = useToast();

  // Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Drawer States
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  // Form State
  const [formData, setFormData] = useState<Partial<Client>>(createEmptyClientForm);

  // Init company handled by useAuth

  const fetchClients = useCallback(async (page: number = 1) => {
    if (!selectedCompany || !token) return;
    setLoading(true);
    try {
      const response = await getClients(selectedCompany.slug, token, page, {
        search: searchQuery.trim() || undefined,
        status: statusFilter || undefined,
      });
      setClients(response.data);
      setPagination(response.meta);
      setCurrentPage(page);
    } catch (error: any) {
      showToast(error.message || "Greška pri dohvatanju klijenata", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, token, searchQuery, statusFilter]);

  useEffect(() => {
    if (isAuthenticated && selectedCompany) {
      fetchClients(currentPage);
    }
  }, [isAuthenticated, selectedCompany, currentPage, fetchClients]);

  const handleRowClick = (client: Client) => {
    setActiveClient(client);
    setViewDrawerOpen(true);
  };

  const openCreateForm = () => {
    setFormMode("create");
    setFormData(createEmptyClientForm());
    setFormDrawerOpen(true);
  };

  const openEditForm = () => {
    if (!activeClient) return;
    setFormMode("edit");
    setFormData({ ...activeClient });
    setViewDrawerOpen(false);
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !token) return;

    setLoading(true);
    try {
      if (formMode === "create") {
        await createClient(selectedCompany.slug, token, formData);
        showToast("Klijent uspješno kreiran", "success");
      } else if (activeClient) {
        await updateClient(selectedCompany.slug, activeClient.id, token, formData);
        showToast("Klijent uspješno ažuriran", "success");
      }
      setFormDrawerOpen(false);
      fetchClients(currentPage);
    } catch (err: any) {
      showToast(err.message || "Greška pri čuvanju klijenta", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!activeClient || !selectedCompany || !token) return;

    setLoading(true);
    try {
      const res = await deleteClient(selectedCompany.slug, activeClient.id, token);
      showToast(res.message || "Klijent uspješno obrisan", "info");
      setViewDrawerOpen(false);
      fetchClients(currentPage);
    } catch (err: any) {
      showToast(err.message || "Greška pri brisanju klijenta", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const statusOptions = [
    { value: "", label: "Status: Svi" },
    { value: "active", label: "Status: Aktivan" },
    { value: "inactive", label: "Status: Neaktivan" },
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
  ];

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  return (
    <AppLayout
      title="clients"
      selectedCompany={selectedCompany}
      onCompanyChange={updateSelectedCompany}
      actions={
        <CreateButton label="Novi klijent" onClick={openCreateForm} />
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
        title="Obriši klijenta"
        message={`Da li ste sigurni da želite trajno obrisati klijenta ${activeClient?.name}? Ova akcija se ne može poništiti.`}
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
              placeholder="Pretraži klijente..."
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
            </div>
          </div>
        )}
        <ActiveFiltersBar filters={activeFilters} onReset={resetFilters} />
      </div>

      {/* Desktop: header */}
      <ListHeader
        grid="grid-cols-[minmax(0,1.3fr)_0.5fr_0.9fr_0.7fr_0.8fr]"
        columns={[
          { label: "Klijent" },
          { label: "Status" },
          { label: "Email" },
          { label: "Telefon" },
          { label: "Lokacija" },
        ]}
      />

      {/* Cards */}
      <div className="space-y-4 md:space-y-3">
        {clients.map((client) => (
          <ResponsiveEntityCard
            key={client.id}
            onClick={() => handleRowClick(client)}
            mobile={
              <div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <ContactRoundIcon className="w-3 h-3 text-primary" />
                    <span className="text-base font-black text-[var(--color-text-main)] tracking-tighter italic leading-none group-hover:text-primary transition-colors">
                      {client.name}
                    </span>
                  </div>
                  <StatusBadge
                    label={client.is_active ? 'Aktivan' : 'Neaktivan'}
                    color={client.is_active ? 'green' : 'gray'}
                  />
                </div>
                <div className="h-[1px] w-full bg-[var(--color-border)]" />
                <div className="flex justify-between items-end">
                  <div className="flex gap-4">
                    {client.email && (
                      <MetaItem
                        icon={MailIcon}
                        label="Email"
                        value={client.email}
                        valueClassName="truncate max-w-[150px]"
                      />
                    )}
                    {client.phone && (
                      <MetaItem
                        icon={PhoneIcon}
                        label="Telefon"
                        value={client.phone}
                      />
                    )}
                  </div>
                  {(client.address || client.city) && (
                    <MetaItem
                      icon={MapPinIcon}
                      label="Lokacija"
                      className="items-end text-right"
                      valueClassName="text-[var(--color-text-main)] tracking-tight italic leading-none"
                      value={
                        <>
                          <span className="text-primary text-[9px] not-italic opacity-70 mr-1">{client.zip}</span>
                          {client.city}
                        </>
                      }
                    />
                  )}
                </div>
              </div>
            }
            desktop={
              <div className="grid grid-cols-[minmax(0,1.3fr)_0.5fr_0.9fr_0.7fr_0.8fr] gap-3 items-center">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <ContactRoundIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-[var(--color-text-main)] tracking-tighter italic truncate">
                      {client.name}
                    </p>
                    {(client.address || client.city) && (
                      <p className="text-xs font-bold text-[var(--color-text-muted)] truncate">
                        {client.address || ""} {client.city ? `· ${client.city}` : ""}
                      </p>
                    )}
                  </div>
                </div>
                <StatusBadge
                  label={client.is_active ? 'Aktivan' : 'Neaktivan'}
                  color={client.is_active ? 'green' : 'gray'}
                />
                <div className="text-xs font-bold text-[var(--color-text-muted)] truncate">
                  {client.email || "—"}
                </div>
                <div className="text-xs font-bold text-[var(--color-text-muted)]">
                  {client.phone || "—"}
                </div>
                <div className="text-xs font-bold text-[var(--color-text-muted)]">
                  {client.city ? (
                    <>
                      <span className="text-primary text-[9px] not-italic opacity-70 mr-1">{client.zip}</span>
                      {client.city}
                    </>
                  ) : "—"}
                </div>
              </div>
            }
          />
        ))}
      </div>

      {loading && !viewDrawerOpen && !formDrawerOpen && <LoadingState />}

      {!loading && clients.length === 0 && (
        <EmptyState icon={XIcon} message="Nema pronađenih klijenata" />
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

      {/* VIEW DRAWER */}
      <DetailDrawer
        title="Detalji klijenta"
        isOpen={viewDrawerOpen}
        onClose={() => setViewDrawerOpen(false)}
        entityName={activeClient?.name || ""}
        entityIcon={ContactRoundIcon}
        badges={
          activeClient && (
            <StatusBadge
              label={activeClient.is_active ? 'Aktivan' : 'Neaktivan'}
              color={activeClient.is_active ? 'green' : 'gray'}
            />
          )
        }
        onEdit={openEditForm}
        onDelete={() => setIsDeleteModalOpen(true)}
      >
        {activeClient && (
          <SectionBlock variant="plain">
            <SectionHeader icon={ContactRoundIcon} title="Osnovni podaci" />
            <DetailsGrid columns={2}>
              <DetailsItem icon={MailIcon} label="Email" value={activeClient.email} />
              <DetailsItem icon={PhoneIcon} label="Telefon" value={activeClient.phone} />
              <DetailsItem icon={MapPinIcon} label="Adresa" value={activeClient.address} />
              <DetailsItem icon={MapPinIcon} label="Grad" value={activeClient.city} />
              <DetailsItem icon={HashIcon} label="ZIP" value={activeClient.zip} />
              <DetailsItem icon={GlobeIcon} label="Država" value={activeClient.country} />
              <DetailsItem icon={HashIcon} label="VAT ID" value={activeClient.vat_id} />
              <DetailsItem icon={HashIcon} label="TAX ID" value={activeClient.tax_id} />
              <DetailsItem icon={CheckCircleIcon} label="Status" value={activeClient.is_active} />
            </DetailsGrid>
          </SectionBlock>
        )}
      </DetailDrawer>

      {/* FORM DRAWER (Create/Edit) */}
      <FormDrawer
        title={formMode === 'create' ? "Novi klijent" : "Uredi klijenta"}
        isOpen={formDrawerOpen}
        onClose={() => setFormDrawerOpen(false)}
        onSubmit={handleFormSubmit}
        loading={loading}
        submitLabel={formMode === 'create' ? "Kreiraj klijenta" : "Sačuvaj izmjene"}
      >
        <SectionBlock variant="card">
          <SectionHeader icon={ContactRoundIcon} title="Osnovni podaci" />
          <Input
            label="Naziv klijenta"
            name="name"
            required
            value={formData.name}
            onChange={handleInputChange}
            placeholder="npr. PlusPlus d.o.o."
          />
          <Toggle
            id="is_active"
            name="is_active"
            checked={formData.is_active ?? false}
            onChange={(v) => handleInputChange({ target: { name: "is_active", type: "checkbox", checked: v } } as ChangeEvent<HTMLInputElement>)}
            label="Klijent je aktivan"
          />
        </SectionBlock>

        <SectionBlock variant="card">
          <SectionHeader icon={MailIcon} title="Kontakt" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email"
              name="email"
              type="email"
              icon={MailIcon}
              value={formData.email || ""}
              onChange={handleInputChange}
              placeholder="info@klijent.com"
            />
            <Input
              label="Telefon"
              name="phone"
              icon={PhoneIcon}
              value={formData.phone || ""}
              onChange={handleInputChange}
              placeholder="+387 61 ..."
            />
          </div>
        </SectionBlock>

        <SectionBlock variant="card">
          <SectionHeader icon={MapPinIcon} title="Adresa" />
          <Input
            label="Adresa"
            name="address"
            icon={MapPinIcon}
            value={formData.address || ""}
            onChange={handleInputChange}
            placeholder="Ulica i broj"
          />
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <Input
                label="ZIP"
                name="zip"
                value={formData.zip || ""}
                onChange={handleInputChange}
                placeholder="71000"
              />
            </div>
            <div className="col-span-2">
              <Input
                label="Grad"
                name="city"
                value={formData.city || ""}
                onChange={handleInputChange}
                placeholder="Sarajevo"
              />
            </div>
          </div>
          <Input
            label="Država"
            name="country"
            icon={GlobeIcon}
            value={formData.country || ""}
            onChange={handleInputChange}
            placeholder="Bosna i Hercegovina"
          />
        </SectionBlock>

        <SectionBlock variant="card">
          <SectionHeader icon={HashIcon} title="Porezni podaci" />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="VAT ID"
              name="vat_id"
              icon={HashIcon}
              value={formData.vat_id || ""}
              onChange={handleInputChange}
              placeholder="Identifikacioni broj"
            />
            <Input
              label="TAX ID"
              name="tax_id"
              icon={HashIcon}
              value={formData.tax_id || ""}
              onChange={handleInputChange}
              placeholder="Porezni broj"
            />
          </div>
        </SectionBlock>
      </FormDrawer>
    </AppLayout>
  );
}
