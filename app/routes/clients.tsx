import { useNavigate } from "react-router";
import { useAuth } from "~/hooks/useAuth";
import { useEffect, useState, useCallback } from "react";
import { getClients } from "~/api/clients";
import type { Client } from "~/types/client";
import type { Company } from "~/types/company";
import {
    ContactRoundIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    XIcon,
    CogIcon, HashIcon, MailIcon, PhoneIcon, MapPinIcon
} from "~/components/ui/icons";
import { AppLayout } from "~/components/layout/AppLayout";
import type { PaginationMeta } from "~/types/api";

export default function ClientsPage() {
  const { user, token, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.companies.length > 0 && !selectedCompany) {
      setSelectedCompany(user.companies[0]);
    }
  }, [user, selectedCompany]);

  const fetchClients = useCallback(async (page: number = 1) => {
    if (!selectedCompany || !token) return;
    setLoading(true);
    try {
      const response = await getClients(selectedCompany.slug, token, page);
      setClients(response.data);
      setPagination(response.meta);
      setCurrentPage(page);
    } catch (error) {
      console.error("Greška pri dohvatanju klijenata:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, token]);

  useEffect(() => {
    if (isAuthenticated && selectedCompany) {
      fetchClients(currentPage);
    }
  }, [isAuthenticated, selectedCompany, currentPage, fetchClients]);

  return (
    <AppLayout 
      title="Klijenti" 
      selectedCompany={selectedCompany}
      onCompanyChange={setSelectedCompany}
      actions={
        <div className="cursor-pointer h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold text-sm border border-primary/20 hover:bg-primary hover:text-white transition-all shadow-glow-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"/><path d="M12 5v14"/>
          </svg>
        </div>
      }
    >
      <div className="space-y-4">
          {clients.map((client) => (
              <div
                  key={client.id}
                  className="group cursor-pointer bg-[#16161E]/80 backdrop-blur-xl border border-white/5 rounded-xl transition-all duration-500 hover:bg-[#1C1C26] hover:border-primary/40 p-3.5 flex flex-col gap-3 relative overflow-hidden"
                  style={{ boxShadow: '0 8px 30px rgba(var(--primary-base), 0.1)' }}
              >
                  {/* Gornji dio: Ime klijenta sa HashIcon-om */}
                  <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                          <ContactRoundIcon className="w-3.5 h-3.5 text-primary" />
                          <span className="text-lg font-black text-white tracking-tighter italic leading-none">
                    {client.name}
                </span>
                      </div>
                      {client.is_active !== undefined && (
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border backdrop-blur-md ${client.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                    {client.is_active ? 'Aktivan' : 'Neaktivan'}
                </span>
                      )}
                  </div>

                {/*  /!* Srednji dio: VAT info - po uzoru na klijent info kod računa *!/*/}
                {/*  {client.vat_id && (*/}
                {/*      <div className="flex items-center gap-2">*/}
                {/*          /!* Ovdje možeš staviti HashIcon ako želiš da VAT bude upečatljiviji *!/*/}
                {/*          <HashIcon className="w-3 h-3 text-gray-600 opacity-50" />*/}
                {/*          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">*/}
                {/*    VAT ID: <span className="text-gray-400">{client.vat_id}</span>*/}
                {/*</span>*/}
                {/*      </div>*/}
                {/*  )}*/}

                  {/* Separator */}
                  <div className="h-[1px] w-full bg-white/5" />

                  {/* Donji dio: Kontakt i Adresa */}
                  <div className="flex justify-between items-end">
                      <div className="flex gap-5">
                          {/* Email */}
                          {client.email && (
                              <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-1.5 text-gray-600">
                                      <MailIcon className="w-2.5 h-2.5" /> {/* Manja verzija za podnaslove */}
                                      <span className="text-[8px] font-black uppercase tracking-tighter">Email</span>
                                  </div>
                                  <p className="text-[10px] font-bold text-gray-300 truncate max-w-[120px]">
                                      {client.email}
                                  </p>
                              </div>
                          )}

                          {/* Telefon */}
                          {client.phone && (
                              <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-1.5 text-gray-600">
                                      <PhoneIcon className="w-2.5 h-2.5" />
                                      <span className="text-[8px] font-black uppercase tracking-tighter">Telefon</span>
                                  </div>
                                  <p className="text-[10px] font-bold text-gray-300">
                                      {client.phone}
                                  </p>
                              </div>
                          )}
                      </div>

                      {/* Adresa - Desni fokus (umjesto Totala) */}
                      {(client.address || client.city) && (
                          <div className="text-right flex flex-col items-end gap-1">
                              <div className="flex items-center gap-1.5 text-gray-600">
                                  <MapPinIcon className="w-2.5 h-2.5" />
                                  <span className="text-[8px] font-black uppercase tracking-tighter">Lokacija</span>
                              </div>
                              <p className="text-[10px] font-black text-white tracking-tight italic leading-none">
                                  <span className="text-primary text-[8px] not-italic opacity-70 mr-1">{client.zip}</span> {client.city}
                              </p>
                          </div>
                      )}
                  </div>
              </div>
          ))}

        {loading && (
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
      {pagination && pagination.last_page > 1 && (
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1 || loading}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${currentPage === 1 || loading ? "bg-white/5 text-gray-500 cursor-not-allowed border border-white/10" : "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30"}`}
          >
            <ChevronLeftIcon className="h-5 w-5"/>
          </button>

          {Array.from({length: pagination.last_page}, (_, i) => i + 1)
            .filter((page) => page >= Math.max(1, currentPage - 2) && page <= Math.min(pagination.last_page, currentPage + 2))
            .map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                disabled={loading}
                className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl text-sm font-bold transition-all ${page === currentPage ? "bg-primary text-white shadow-glow-primary" : "bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10"}`}
              >
                {page}
              </button>
            ))}

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, pagination.last_page))}
            disabled={currentPage === pagination.last_page || loading}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${currentPage === pagination.last_page || loading ? "bg-white/5 text-gray-500 cursor-not-allowed border border-white/10" : "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30"}`}
          >
            <ChevronRightIcon className="h-5 w-5"/>
          </button>
        </div>
      )}
    </AppLayout>
  );
}
