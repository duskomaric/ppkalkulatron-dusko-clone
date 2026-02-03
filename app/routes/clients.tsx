import { useNavigate } from "react-router";
import { useAuth } from "~/hooks/useAuth";
import { useEffect, useState, useCallback } from "react";
import { getClients, createClient, updateClient, deleteClient } from "~/api/clients";
import type { Client } from "~/types/client";
import type { Company } from "~/types/company";
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
import { Drawer } from "~/components/layout/Drawer";
import { Toast, type ToastType } from "~/components/ui/Toast";
import { ConfirmModal } from "~/components/ui/ConfirmModal";
import { Pagination } from "~/components/ui/Pagination";
import { StatusBadge } from "~/components/ui/StatusBadge";
import { Input } from "~/components/ui/Input";
import type { PaginationMeta } from "~/types/api";

export default function ClientsPage() {
  const { user, token, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
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

  useEffect(() => {
    if (user && user.companies.length > 0 && !selectedCompany) {
      setSelectedCompany(user.companies[0]);
    }
  }, [user, selectedCompany]);

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

  const DataItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string | null | undefined | boolean }) => (
    <div className="flex items-center gap-2.5 p-2 bg-white/5 rounded-xl border border-white/5">
      <div className="h-7 w-7 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest leading-none mb-0.5">{label}</p>
        <p className="text-[10px] font-bold text-white truncate italic leading-none">
          {typeof value === 'boolean' ? (value ? 'Aktivan' : 'Neaktivan') : (value || '-')}
        </p>
      </div>
    </div>
  );

  return (
    <AppLayout
      title="clients"
      selectedCompany={selectedCompany}
      onCompanyChange={setSelectedCompany}
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
          <div
            key={client.id}
            onClick={() => handleRowClick(client)}
            className="group cursor-pointer bg-[#16161E]/80 backdrop-blur-xl border border-white/5 rounded-xl transition-all duration-500 hover:bg-[#1C1C26] hover:border-primary/40 p-3 flex flex-col gap-2 relative overflow-hidden"
            style={{ boxShadow: '0 4px 20px rgba(var(--primary-base), 0.05)' }}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ContactRoundIcon className="w-3 h-3 text-primary" />
                <span className="text-base font-black text-white tracking-tighter italic leading-none group-hover:text-primary transition-colors">
                  {client.name}
                </span>
              </div>
              <StatusBadge
                label={client.is_active ? 'Aktivan' : 'Neaktivan'}
                color={client.is_active ? 'green' : 'gray'}
              />
            </div>

            <div className="h-[1px] w-full bg-white/5" />

            <div className="flex justify-between items-end">
              <div className="flex gap-4">
                {client.email && (
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1 text-gray-600">
                      <MailIcon className="w-2 h-2" />
                      <span className="text-[7px] font-black uppercase tracking-tighter">Email</span>
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 truncate max-w-[100px]">
                      {client.email}
                    </p>
                  </div>
                )}

                {client.phone && (
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1 text-gray-600">
                      <PhoneIcon className="w-2 h-2" />
                      <span className="text-[7px] font-black uppercase tracking-tighter">Telefon</span>
                    </div>
                    <p className="text-[9px] font-bold text-gray-400">
                      {client.phone}
                    </p>
                  </div>
                )}
              </div>

              {(client.address || client.city) && (
                <div className="text-right flex flex-col items-end gap-0.5">
                  <div className="flex items-center gap-1 text-gray-600">
                    <MapPinIcon className="w-2 h-2" />
                    <span className="text-[7px] font-black uppercase tracking-tighter">Lokacija</span>
                  </div>
                  <p className="text-[9px] font-black text-white tracking-tight italic leading-none">
                    <span className="text-primary text-[7px] not-italic opacity-70 mr-1">{client.zip}</span> {client.city}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && !viewDrawerOpen && !formDrawerOpen && (
          <div className="flex justify-center py-10">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}

        {!loading && clients.length === 0 && (
          <div className="py-20 text-center bg-[#16161E]/40 border border-dashed border-white/5 rounded-2xl">
            <XIcon className="h-8 w-8 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Nema pronađenih klijenata</p>
          </div>
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
      <Drawer
        title="Detalji klijenta"
        isOpen={viewDrawerOpen}
        onClose={() => setViewDrawerOpen(false)}
      >
        {activeClient && (
          <div className="flex flex-col gap-4">
            {/* Header Card */}
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-[20px] border border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-5">
                <ContactRoundIcon className="h-12 w-12 text-white" />
              </div>
              <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-white font-black text-lg shadow-glow-primary z-10 shrink-0">
                {activeClient.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="z-10 min-w-0">
                <p className="font-black text-base text-white tracking-tighter italic leading-none truncate">{activeClient.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge
                    label={activeClient.is_active ? 'Aktivan' : 'Neaktivan'}
                    color={activeClient.is_active ? 'green' : 'gray'}
                  />
                </div>
              </div>
            </div>

            {/* Data Grid */}
            <div className="grid grid-cols-2 gap-2">
              <DataItem icon={MailIcon} label="Email" value={activeClient.email} />
              <DataItem icon={PhoneIcon} label="Telefon" value={activeClient.phone} />
              <DataItem icon={MapPinIcon} label="Adresa" value={activeClient.address} />
              <DataItem icon={MapPinIcon} label="Grad" value={activeClient.city} />
              <DataItem icon={HashIcon} label="ZIP" value={activeClient.zip} />
              <DataItem icon={GlobeIcon} label="Država" value={activeClient.country} />
              <DataItem icon={HashIcon} label="VAT ID" value={activeClient.vat_id} />
              <DataItem icon={HashIcon} label="TAX ID" value={activeClient.tax_id} />
              <DataItem icon={CheckCircleIcon} label="Status" value={activeClient.is_active} />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all group"
                >
                  <TrashIcon className="h-3.5 w-3.5 transition-transform group-hover:rotate-12" />
                  Obriši
                </button>
                <button
                  onClick={openEditForm}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-glow-primary hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                  Uredi
                </button>
              </div>
              <button
                onClick={() => setViewDrawerOpen(false)}
                className="w-full py-3 bg-white/5 text-gray-400 border border-white/5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all"
              >
                Zatvori
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* FORM DRAWER (Create/Edit) */}
      <Drawer
        title={formMode === 'create' ? "Novi klijent" : "Uredi klijenta"}
        isOpen={formDrawerOpen}
        onClose={() => setFormDrawerOpen(false)}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
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
            className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 cursor-pointer"
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

              <div className="w-9 h-5 bg-white/10 rounded-full
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

            <span className="text-[13px] font-bold text-gray-300">
              Klijent je aktivan
            </span>
          </label>


          <div className="flex flex-col gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] shadow-glow-primary hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span>{formMode === 'create' ? "Kreiraj klijenta" : "Sačuvaj izmjene"}</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setFormDrawerOpen(false)}
              className="w-full py-3 bg-white/5 text-gray-400 border border-white/5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all"
            >
              Odustani
            </button>
          </div>
        </form>
      </Drawer>
    </AppLayout>
  );
}
