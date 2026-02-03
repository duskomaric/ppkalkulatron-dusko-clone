import { useNavigate } from "react-router";
import { useAuth } from "~/hooks/useAuth";
import { useEffect, useState, useCallback } from "react";
import { getInvoices } from "~/api/invoices";
import type { Invoice, StatusColor } from "~/types/invoice";
import type { Company } from "~/types/company";
import { 
  HashIcon, 
  ContactRoundIcon, 
  Calendar1Icon, 
  Clock1Icon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  XIcon
} from "~/components/ui/icons";
import { AppLayout } from "~/components/layout/AppLayout";
import type { PaginationMeta } from "~/types/api";

export default function InvoicesPage() {
  const { user, token, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.companies.length > 0 && !selectedCompany) {
      setSelectedCompany(user.companies[0]);
    }
  }, [user, selectedCompany]);

  const fetchInvoices = useCallback(async (page: number = 1) => {
    if (!selectedCompany || !token) return;
    setLoading(true);
    try {
      const response = await getInvoices(selectedCompany.slug, token, page);
      setInvoices(response.data);
      setPagination(response.meta);
      setCurrentPage(page);
    } catch (error) {
      console.error("Greška pri dohvatanju računa:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, token]);

  useEffect(() => {
    if (isAuthenticated && selectedCompany) {
      fetchInvoices(currentPage);
    }
  }, [isAuthenticated, selectedCompany, currentPage, fetchInvoices]);

  const statusColors: Record<StatusColor, string> = {
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    gray: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const formatAmount = (amount: number, currency: string) => {
    return (amount / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' ' + currency;
  };

  return (
    <AppLayout 
      title="Računi" 
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
        {invoices.map((inv) => (
            <div
                key={inv.id}
                className="group cursor-pointer bg-[#16161E]/80 backdrop-blur-xl border border-white/5 rounded-xl transition-all duration-500 hover:bg-[#1C1C26] hover:border-primary/40 hover:shadow-[0_8px_30px_rgba(168,85,247,0.1)] p-3.5 flex flex-col gap-3 relative overflow-hidden"
            >
                {/* Gornji dio: Broj i Status */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <HashIcon className="w-3.5 h-3.5 text-primary" />
                        <span className="text-lg font-black text-white tracking-tighter italic leading-none">
                {inv.invoice_number}
            </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border backdrop-blur-md ${statusColors[inv.status_color]}`}>
            {inv.status_label}
        </span>
                </div>

                {/* Srednji dio: Klijent - Bez margina, čisto poravnato */}
                <div className="flex items-center gap-2">
                    <ContactRoundIcon className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs font-bold text-gray-400 tracking-tight truncate">
            {inv.client.name}
        </span>
                </div>

                {/* Separator */}
                <div className="h-[1px] w-full bg-white/5" />

                {/* Donji dio: Datumi i Iznos */}
                <div className="flex justify-between items-end">
                    <div className="flex gap-5">
                        {/* Datum - Poravnato uz ikonu, tekst ispod ikone */}
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-gray-600">
                                <Calendar1Icon className="w-3 h-3" />
                                <span className="text-[8px] font-black uppercase">Datum</span>
                            </div>
                            <p className="text-[10px] font-bold text-gray-300">{inv.date}</p>
                        </div>

                        {/* Dospijeće */}
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-gray-600">
                                <Clock1Icon className="w-3 h-3" />
                                <span className="text-[8px] font-black uppercase">Rok</span>
                            </div>
                            <p className="text-[10px] font-bold text-red-400/80">{inv.due_date}</p>
                        </div>
                    </div>

                    {/* Total - Desni fokus */}
                    <div className="text-right">
                        <p className="text-xl font-black text-white tracking-tighter">
                            {inv.total} <span className="text-primary text-[10px] italic">{inv.currency}</span>
                        </p>
                    </div>
                </div>
            </div>
        ))}

        {loading && (
          <div className="flex justify-center py-10">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}

        {!loading && invoices.length === 0 && (
          <div className="py-20 text-center bg-[#16161E]/40 border border-dashed border-white/5 rounded-2xl">
            <XIcon className="h-8 w-8 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Nema pronađenih računa</p>
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
