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
} from "~/components/ui/icons";
import { AppLayout } from "~/components/layout/AppLayout";
import { CreateButton } from "~/components/ui/CreateButton";
import { Toast } from "~/components/ui/Toast";
import { useNavigate } from "react-router";
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
import { ClientFilterSection } from "~/components/clients/ClientFilterSection";
import type { PaginationMeta } from "~/types/api";
import { useToast } from "~/hooks/useToast";

type LanguageCode = "en" | "bs" | "hr" | "sr_Latn" | "sr_Cyrl" | "fr" | "de" | "it" | "ru";
const clientsTranslations: Record<LanguageCode, Record<string, string>> = {
  en: { title: "Clients", newClient: "New client", fetchError: "Error fetching clients", created: "Client created successfully", updated: "Client updated successfully", saveError: "Error saving client", deleted: "Client deleted successfully", deleteError: "Error deleting client", deleteTitle: "Delete client", deleteMessage: "Are you sure you want to permanently delete client", listClient: "Client", listStatus: "Status", listEmail: "Email", listPhone: "Phone", listLocation: "Location", active: "Active", inactive: "Inactive", empty: "No clients found", detailsTitle: "Client details", basicInfo: "Basic info", phone: "Phone", address: "Address", city: "City", country: "Country", status: "Status", editClient: "Edit client", createClient: "Create client", saveChanges: "Save changes", clientName: "Client name", clientNamePlaceholder: "e.g. PlusPlus Ltd.", clientActive: "Client is active", contact: "Contact", addressTitle: "Address", addressPlaceholder: "Street and number", taxInfo: "Tax info" },
  bs: { title: "Klijenti", newClient: "Novi klijent", fetchError: "Greška pri dohvatanju klijenata", created: "Klijent uspješno kreiran", updated: "Klijent uspješno ažuriran", saveError: "Greška pri čuvanju klijenta", deleted: "Klijent uspješno obrisan", deleteError: "Greška pri brisanju klijenta", deleteTitle: "Obriši klijenta", deleteMessage: "Da li ste sigurni da želite trajno obrisati klijenta", listClient: "Klijent", listStatus: "Status", listEmail: "Email", listPhone: "Telefon", listLocation: "Lokacija", active: "Aktivan", inactive: "Neaktivan", empty: "Nema pronađenih klijenata", detailsTitle: "Detalji klijenta", basicInfo: "Osnovni podaci", phone: "Telefon", address: "Adresa", city: "Grad", country: "Država", status: "Status", editClient: "Uredi klijenta", createClient: "Kreiraj klijenta", saveChanges: "Sačuvaj izmjene", clientName: "Naziv klijenta", clientNamePlaceholder: "npr. PlusPlus d.o.o.", clientActive: "Klijent je aktivan", contact: "Kontakt", addressTitle: "Adresa", addressPlaceholder: "Ulica i broj", taxInfo: "Porezni podaci" },
  hr: { title: "Klijenti", newClient: "Novi klijent", fetchError: "Greška pri dohvaćanju klijenata", created: "Klijent uspješno kreiran", updated: "Klijent uspješno ažuriran", saveError: "Greška pri spremanju klijenta", deleted: "Klijent uspješno obrisan", deleteError: "Greška pri brisanju klijenta", deleteTitle: "Obriši klijenta", deleteMessage: "Jeste li sigurni da želite trajno obrisati klijenta", listClient: "Klijent", listStatus: "Status", listEmail: "E-mail", listPhone: "Telefon", listLocation: "Lokacija", active: "Aktivan", inactive: "Neaktivan", empty: "Nema pronađenih klijenata", detailsTitle: "Detalji klijenta", basicInfo: "Osnovni podaci", phone: "Telefon", address: "Adresa", city: "Grad", country: "Država", status: "Status", editClient: "Uredi klijenta", createClient: "Kreiraj klijenta", saveChanges: "Spremi promjene", clientName: "Naziv klijenta", clientNamePlaceholder: "npr. PlusPlus d.o.o.", clientActive: "Klijent je aktivan", contact: "Kontakt", addressTitle: "Adresa", addressPlaceholder: "Ulica i broj", taxInfo: "Porezni podaci" },
  "sr_Latn": { title: "Klijenti", newClient: "Novi klijent", fetchError: "Greška pri dohvatanju klijenata", created: "Klijent uspešno kreiran", updated: "Klijent uspešno ažuriran", saveError: "Greška pri čuvanju klijenta", deleted: "Klijent uspešno obrisan", deleteError: "Greška pri brisanju klijenta", deleteTitle: "Obriši klijenta", deleteMessage: "Da li ste sigurni da želite trajno obrisati klijenta", listClient: "Klijent", listStatus: "Status", listEmail: "Email", listPhone: "Telefon", listLocation: "Lokacija", active: "Aktivan", inactive: "Neaktivan", empty: "Nema pronađenih klijenata", detailsTitle: "Detalji klijenta", basicInfo: "Osnovni podaci", phone: "Telefon", address: "Adresa", city: "Grad", country: "Država", status: "Status", editClient: "Uredi klijenta", createClient: "Kreiraj klijenta", saveChanges: "Sačuvaj izmene", clientName: "Naziv klijenta", clientNamePlaceholder: "npr. PlusPlus d.o.o.", clientActive: "Klijent je aktivan", contact: "Kontakt", addressTitle: "Adresa", addressPlaceholder: "Ulica i broj", taxInfo: "Poreski podaci" },
  "sr_Cyrl": { title: "Клијенти", newClient: "Нови клијент", fetchError: "Грешка при дохватању клијената", created: "Клијент успешно креиран", updated: "Клијент успешно ажуриран", saveError: "Грешка при чувању клијента", deleted: "Клијент успешно обрисан", deleteError: "Грешка при брисању клијента", deleteTitle: "Обриши клијента", deleteMessage: "Да ли сте сигурни да желите трајно обрисати клијента", listClient: "Клијент", listStatus: "Статус", listEmail: "Имејл", listPhone: "Телефон", listLocation: "Локација", active: "Активан", inactive: "Неактиван", empty: "Нема пронађених клијената", detailsTitle: "Детаљи клијента", basicInfo: "Основни подаци", phone: "Телефон", address: "Адреса", city: "Град", country: "Држава", status: "Статус", editClient: "Уреди клијента", createClient: "Креирај клијента", saveChanges: "Сачувај измене", clientName: "Назив клијента", clientNamePlaceholder: "нпр. PlusPlus д.о.о.", clientActive: "Клијент је активан", contact: "Контакт", addressTitle: "Адреса", addressPlaceholder: "Улица и број", taxInfo: "Порески подаци" },
  fr: { title: "Clients", newClient: "Nouveau client", fetchError: "Erreur lors du chargement des clients", created: "Client créé avec succès", updated: "Client mis à jour avec succès", saveError: "Erreur lors de l'enregistrement du client", deleted: "Client supprimé avec succès", deleteError: "Erreur lors de la suppression du client", deleteTitle: "Supprimer le client", deleteMessage: "Voulez-vous vraiment supprimer définitivement le client", listClient: "Client", listStatus: "Statut", listEmail: "E-mail", listPhone: "Téléphone", listLocation: "Localisation", active: "Actif", inactive: "Inactif", empty: "Aucun client trouvé", detailsTitle: "Détails du client", basicInfo: "Informations de base", phone: "Téléphone", address: "Adresse", city: "Ville", country: "Pays", status: "Statut", editClient: "Modifier le client", createClient: "Créer le client", saveChanges: "Enregistrer les modifications", clientName: "Nom du client", clientNamePlaceholder: "ex. PlusPlus SARL", clientActive: "Le client est actif", contact: "Contact", addressTitle: "Adresse", addressPlaceholder: "Rue et numéro", taxInfo: "Données fiscales" },
  de: { title: "Kunden", newClient: "Neuer Kunde", fetchError: "Fehler beim Laden der Kunden", created: "Kunde erfolgreich erstellt", updated: "Kunde erfolgreich aktualisiert", saveError: "Fehler beim Speichern des Kunden", deleted: "Kunde erfolgreich gelöscht", deleteError: "Fehler beim Löschen des Kunden", deleteTitle: "Kunden löschen", deleteMessage: "Möchten Sie den Kunden dauerhaft löschen", listClient: "Kunde", listStatus: "Status", listEmail: "E-Mail", listPhone: "Telefon", listLocation: "Standort", active: "Aktiv", inactive: "Inaktiv", empty: "Keine Kunden gefunden", detailsTitle: "Kundendetails", basicInfo: "Grunddaten", phone: "Telefon", address: "Adresse", city: "Stadt", country: "Land", status: "Status", editClient: "Kunde bearbeiten", createClient: "Kunde erstellen", saveChanges: "Änderungen speichern", clientName: "Kundenname", clientNamePlaceholder: "z. B. PlusPlus GmbH", clientActive: "Kunde ist aktiv", contact: "Kontakt", addressTitle: "Adresse", addressPlaceholder: "Straße und Nummer", taxInfo: "Steuerdaten" },
  it: { title: "Clienti", newClient: "Nuovo cliente", fetchError: "Errore nel caricamento dei clienti", created: "Cliente creato con successo", updated: "Cliente aggiornato con successo", saveError: "Errore nel salvataggio del cliente", deleted: "Cliente eliminato con successo", deleteError: "Errore durante l'eliminazione del cliente", deleteTitle: "Elimina cliente", deleteMessage: "Sei sicuro di voler eliminare definitivamente il cliente", listClient: "Cliente", listStatus: "Stato", listEmail: "Email", listPhone: "Telefono", listLocation: "Posizione", active: "Attivo", inactive: "Inattivo", empty: "Nessun cliente trovato", detailsTitle: "Dettagli cliente", basicInfo: "Dati base", phone: "Telefono", address: "Indirizzo", city: "Città", country: "Paese", status: "Stato", editClient: "Modifica cliente", createClient: "Crea cliente", saveChanges: "Salva modifiche", clientName: "Nome cliente", clientNamePlaceholder: "es. PlusPlus S.r.l.", clientActive: "Il cliente è attivo", contact: "Contatto", addressTitle: "Indirizzo", addressPlaceholder: "Via e numero", taxInfo: "Dati fiscali" },
  ru: { title: "Клиенты", newClient: "Новый клиент", fetchError: "Ошибка загрузки клиентов", created: "Клиент успешно создан", updated: "Клиент успешно обновлен", saveError: "Ошибка сохранения клиента", deleted: "Клиент успешно удален", deleteError: "Ошибка удаления клиента", deleteTitle: "Удалить клиента", deleteMessage: "Вы уверены, что хотите окончательно удалить клиента", listClient: "Клиент", listStatus: "Статус", listEmail: "Email", listPhone: "Телефон", listLocation: "Локация", active: "Активен", inactive: "Неактивен", empty: "Клиенты не найдены", detailsTitle: "Детали клиента", basicInfo: "Основные данные", phone: "Телефон", address: "Адрес", city: "Город", country: "Страна", status: "Статус", editClient: "Редактировать клиента", createClient: "Создать клиента", saveChanges: "Сохранить изменения", clientName: "Название клиента", clientNamePlaceholder: "напр. PlusPlus LLC", clientActive: "Клиент активен", contact: "Контакты", addressTitle: "Адрес", addressPlaceholder: "Улица и номер", taxInfo: "Налоговые данные" },
};

export default function ClientsPage() {
  const { user, selectedCompany, updateSelectedCompany, token, isAuthenticated } = useAuth();
  const lang = (user?.language || "sr_Latn") as LanguageCode;
  const t = clientsTranslations[lang] || clientsTranslations["sr_Latn"];

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
      showToast(error.message || t.fetchError, "error");
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
        showToast(t.created, "success");
      } else if (activeClient) {
        await updateClient(selectedCompany.slug, activeClient.id, token, formData);
        showToast(t.updated, "success");
      }
      setFormDrawerOpen(false);
      fetchClients(currentPage);
    } catch (err: any) {
      showToast(err.message || t.saveError, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!activeClient || !selectedCompany || !token) return;

    setLoading(true);
    try {
      const res = await deleteClient(selectedCompany.slug, activeClient.id, token);
      showToast(res.message || t.deleted, "info");
      setViewDrawerOpen(false);
      fetchClients(currentPage);
    } catch (err: any) {
      showToast(err.message || t.deleteError, "error");
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


  return (
    <AppLayout
      title={t.title}
      selectedCompany={selectedCompany}
      onCompanyChange={updateSelectedCompany}
      actions={
        <CreateButton label={t.newClient} onClick={openCreateForm} />
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
        title={t.deleteTitle}
        message={`${t.deleteMessage} ${activeClient?.name}? Ova akcija se ne može poništiti.`}
      />

      <ClientFilterSection
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen((prev) => !prev)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        onPageReset={() => setCurrentPage(1)}
      />

      {/* Desktop: header */}
      <ListHeader
        grid="grid-cols-[minmax(0,1.3fr)_0.5fr_0.9fr_0.7fr_0.8fr]"
        columns={[
          { label: t.listClient },
          { label: t.listStatus },
          { label: t.listEmail },
          { label: t.listPhone },
          { label: t.listLocation },
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
                    label={client.is_active ? t.active : t.inactive}
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
                        label={t.phone}
                        value={client.phone}
                      />
                    )}
                  </div>
                  {(client.address || client.city) && (
                    <MetaItem
                      icon={MapPinIcon}
                      label={t.listLocation}
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
                  label={client.is_active ? t.active : t.inactive}
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
        <EmptyState icon={XIcon} message={t.empty} />
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
        title={t.detailsTitle}
        isOpen={viewDrawerOpen}
        onClose={() => setViewDrawerOpen(false)}
        entityName={activeClient?.name || ""}
        entityIcon={ContactRoundIcon}
        badges={
          activeClient && (
            <StatusBadge
              label={activeClient.is_active ? t.active : t.inactive}
              color={activeClient.is_active ? 'green' : 'gray'}
            />
          )
        }
        onEdit={openEditForm}
        onDelete={() => setIsDeleteModalOpen(true)}
      >
        {activeClient && (
          <SectionBlock variant="plain">
            <SectionHeader icon={ContactRoundIcon} title={t.basicInfo} />
            <DetailsGrid columns={2}>
              <DetailsItem icon={MailIcon} label="Email" value={activeClient.email} />
              <DetailsItem icon={PhoneIcon} label={t.phone} value={activeClient.phone} />
              <DetailsItem icon={MapPinIcon} label={t.address} value={activeClient.address} />
              <DetailsItem icon={MapPinIcon} label={t.city} value={activeClient.city} />
              <DetailsItem icon={HashIcon} label="ZIP" value={activeClient.zip} />
              <DetailsItem icon={GlobeIcon} label={t.country} value={activeClient.country} />
              <DetailsItem icon={HashIcon} label="VAT ID" value={activeClient.vat_id} />
              <DetailsItem icon={HashIcon} label="TAX ID" value={activeClient.tax_id} />
              <DetailsItem icon={CheckCircleIcon} label={t.status} value={activeClient.is_active} />
            </DetailsGrid>
          </SectionBlock>
        )}
      </DetailDrawer>

      {/* FORM DRAWER (Create/Edit) */}
      <FormDrawer
        title={formMode === 'create' ? t.newClient : t.editClient}
        isOpen={formDrawerOpen}
        onClose={() => setFormDrawerOpen(false)}
        onSubmit={handleFormSubmit}
        loading={loading}
        submitLabel={formMode === 'create' ? t.createClient : t.saveChanges}
      >
        <SectionBlock variant="card">
          <SectionHeader icon={ContactRoundIcon} title={t.basicInfo} />
          <Input
            label={t.clientName}
            name="name"
            required
            value={formData.name}
            onChange={handleInputChange}
            placeholder={t.clientNamePlaceholder}
          />
          <Toggle
            id="is_active"
            name="is_active"
            checked={formData.is_active ?? false}
            onChange={(v) => handleInputChange({ target: { name: "is_active", type: "checkbox", checked: v } } as ChangeEvent<HTMLInputElement>)}
            label={t.clientActive}
          />
        </SectionBlock>

        <SectionBlock variant="card">
          <SectionHeader icon={MailIcon} title={t.contact} />
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
              label={t.phone}
              name="phone"
              icon={PhoneIcon}
              value={formData.phone || ""}
              onChange={handleInputChange}
              placeholder="+387 61 ..."
            />
          </div>
        </SectionBlock>

        <SectionBlock variant="card">
          <SectionHeader icon={MapPinIcon} title={t.addressTitle} />
          <Input
            label={t.address}
            name="address"
            icon={MapPinIcon}
            value={formData.address || ""}
            onChange={handleInputChange}
            placeholder={t.addressPlaceholder}
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
                label={t.city}
                name="city"
                value={formData.city || ""}
                onChange={handleInputChange}
                placeholder="Sarajevo"
              />
            </div>
          </div>
          <Input
            label={t.country}
            name="country"
            icon={GlobeIcon}
            value={formData.country || ""}
            onChange={handleInputChange}
            placeholder="Bosna i Hercegovina"
          />
        </SectionBlock>

        <SectionBlock variant="card">
          <SectionHeader icon={HashIcon} title={t.taxInfo} />
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
