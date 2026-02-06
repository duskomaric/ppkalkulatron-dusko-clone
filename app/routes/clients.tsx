import { useNavigate } from "react-router";
import { useAuth } from "~/hooks/useAuth";
import { useEffect, useState, useCallback } from "react";
import { getClients, createClient, updateClient, deleteClient } from "~/api/clients";
import type { Client } from "~/types/client";
import {
  ContactRoundIcon,
  XIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  TrashIcon,
  PencilIcon,
  HashIcon,
  GlobeIcon,
  CheckCircleIcon
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

export default function ClientsPage() {
  const { user, selectedCompany, updateSelectedCompany, token, isAuthenticated } = useAuth();

  const [clients, setClients] = useState<Client[]>([]);
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
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  // Form State
  const [formData, setFormData] = useState<Partial<Client>>({
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

  // Init company handled by useAuth

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type, isVisible: true });
  };

  const fetchClients = useCallback(async (page: number = 1) => {
    if (!selectedCompany || !token) return;
    setLoading(true);
    try {
      const response = await getClients(selectedCompany.slug, token, page);
      setClients(response.data);
      setPagination(response.meta);
      setCurrentPage(page);
    } catch (error: any) {
      showToast(error.message || "Greška pri dohvatanju klijenata", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, token]);

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
    setFormData({
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
    setFormDrawerOpen(true);
  };

  const openEditForm = () => {
    if (!activeClient) return;
    setFormMode("edit");
    setFormData({ ...activeClient });
    setViewDrawerOpen(false);
    setFormDrawerOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
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
      await deleteClient(selectedCompany.slug, activeClient.id, token);
      showToast("Klijent uspješno obrisan", "info");
      setViewDrawerOpen(false);
      fetchClients(currentPage);
    } catch (err: any) {
      showToast(err.message || "Greška pri brisanju klijenta", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <AppLayout
      title="clients"
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
        title="Obriši klijenta"
        message={`Da li ste sigurni da želite trajno obrisati klijenta ${activeClient?.name}? Ova akcija se ne može poništiti.`}
      />

      <div className="space-y-4">
        {clients.map((client) => (
          <EntityCard
            key={client.id}
            onClick={() => handleRowClick(client)}
          >
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
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1 text-[var(--color-text-dim)]">
                      <MailIcon className="w-2.5 h-2.5" />
                      <span className="text-[9px] font-black uppercase tracking-tight">Email</span>
                    </div>
                    <p className="text-xs font-bold text-[var(--color-text-muted)] truncate max-w-[150px]">
                      {client.email}
                    </p>
                  </div>
                )}

                {client.phone && (
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1 text-[var(--color-text-dim)]">
                      <PhoneIcon className="w-2.5 h-2.5" />
                      <span className="text-[9px] font-black uppercase tracking-tight">Telefon</span>
                    </div>
                    <p className="text-xs font-bold text-[var(--color-text-muted)]">
                      {client.phone}
                    </p>
                  </div>
                )}
              </div>

              {(client.address || client.city) && (
                <div className="text-right flex flex-col items-end gap-0.5">
                  <div className="flex items-center gap-1 text-[var(--color-text-dim)]">
                    <MapPinIcon className="w-2.5 h-2.5" />
                    <span className="text-[9px] font-black uppercase tracking-tight">Lokacija</span>
                  </div>
                  <p className="text-xs font-black text-[var(--color-text-main)] tracking-tight italic leading-none">
                    <span className="text-primary text-[9px] not-italic opacity-70 mr-1">{client.zip}</span> {client.city}
                  </p>
                </div>
              )}
            </div>
          </EntityCard>
        ))}

        {loading && !viewDrawerOpen && !formDrawerOpen && <LoadingState />}

        {!loading && clients.length === 0 && (
          <EmptyState icon={XIcon} message="Nema pronađenih klijenata" />
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
          <div className="grid grid-cols-2 gap-2">
            <DetailsItem icon={MailIcon} label="Email" value={activeClient.email} />
            <DetailsItem icon={PhoneIcon} label="Telefon" value={activeClient.phone} />
            <DetailsItem icon={MapPinIcon} label="Adresa" value={activeClient.address} />
            <DetailsItem icon={MapPinIcon} label="Grad" value={activeClient.city} />
            <DetailsItem icon={HashIcon} label="ZIP" value={activeClient.zip} />
            <DetailsItem icon={GlobeIcon} label="Država" value={activeClient.country} />
            <DetailsItem icon={HashIcon} label="VAT ID" value={activeClient.vat_id} />
            <DetailsItem icon={HashIcon} label="TAX ID" value={activeClient.tax_id} />
            <DetailsItem icon={CheckCircleIcon} label="Status" value={activeClient.is_active} />
          </div>
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
        <Input
          label="Naziv klijenta"
          name="name"
          required
          value={formData.name}
          onChange={handleInputChange}
          placeholder="npr. PlusPlus d.o.o."
        />

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
            Klijent je aktivan
          </span>
        </label>
      </FormDrawer>
    </AppLayout>
  );
}
