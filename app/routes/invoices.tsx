import { useNavigate } from "react-router";
import { useAuth } from "~/hooks/useAuth";
import { useEffect, useState, useCallback } from "react";
import { getInvoices } from "~/api/invoices";
import type { Invoice } from "~/types/invoice";
import type { Company } from "~/types/company";
import {
  HashIcon,
  ContactRoundIcon,
  Calendar1Icon,
  Clock1Icon,
  XIcon
} from "~/components/ui/icons";
import { AppLayout } from "~/components/layout/AppLayout";
import { Toast, type ToastType } from "~/components/ui/Toast";
import { Pagination } from "~/components/ui/Pagination";
import { StatusBadge, type BadgeColor } from "~/components/ui/StatusBadge";
import { EntityCard } from "~/components/ui/EntityCard";
import { EmptyState } from "~/components/ui/EmptyState";
import { LoadingState } from "~/components/ui/LoadingState";
import type { PaginationMeta } from "~/types/api";

export default function InvoicesPage() {
  const { user, token, isAuthenticated } = useAuth();

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: "",
    type: "success",
    isVisible: false,
  });

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type, isVisible: true });
  };

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
    } catch (error: any) {
      showToast(error.message || "Greška pri dohvatanju računa", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, token]);

  useEffect(() => {
    if (isAuthenticated && selectedCompany) {
      fetchInvoices(currentPage);
    }
  }, [isAuthenticated, selectedCompany, currentPage, fetchInvoices]);

  return (
    <AppLayout
      title="invoices"
      selectedCompany={selectedCompany}
      onCompanyChange={setSelectedCompany}
      actions={
        <button className="cursor-pointer h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold text-sm border border-primary/20 hover:bg-primary hover:text-white transition-all shadow-glow-primary">
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

      <div className="space-y-3">
        {invoices.map((inv) => (
          <EntityCard key={inv.id}>
            {/* Gornji dio: Broj i Status */}
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

            {/* Srednji dio: Klijent */}
            <div className="flex items-center gap-2">
              <ContactRoundIcon className="w-3 h-3 text-gray-500" />
              <span className="text-[11px] font-bold text-gray-400 tracking-tight truncate">
                {inv.client?.name || 'Nepoznat klijent'}
              </span>
            </div>

            {/* Separator */}
            <div className="h-[1px] w-full bg-[var(--color-border)]" />

            {/* Donji dio: Datumi i Iznos */}
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

              {/* Total - Desni fokus */}
              <div className="text-right">
                <p className="text-lg font-black text-[var(--color-text-main)] tracking-tighter italic">
                  {inv.total} {inv.currency}
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
    </AppLayout>
  );
}
