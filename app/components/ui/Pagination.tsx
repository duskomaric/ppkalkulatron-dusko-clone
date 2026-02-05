import React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "~/components/ui/icons";
import type { PaginationMeta } from "~/types/api";

interface PaginationProps {
  pagination: PaginationMeta;
  currentPage: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export function Pagination({ pagination, currentPage, onPageChange, loading }: PaginationProps) {
  if (!pagination || pagination.last_page <= 1) return null;

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1 || loading}
        className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${currentPage === 1 || loading
            ? "bg-[var(--color-border)] text-[var(--color-text-dim)] cursor-not-allowed border border-[var(--color-border)]"
            : "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30"
          }`}
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>

      {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
        .filter(
          (page) =>
            page >= Math.max(1, currentPage - 2) &&
            page <= Math.min(pagination.last_page, currentPage + 2)
        )
        .map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            disabled={loading}
            className={`h-8 w-8 rounded-xl text-xs font-bold transition-all ${page === currentPage
                ? "bg-primary text-white shadow-glow-primary"
                : "bg-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] border border-[var(--color-border)]"
              }`}
          >
            {page}
          </button>
        ))}

      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, pagination.last_page))}
        disabled={currentPage === pagination.last_page || loading}
        className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${currentPage === pagination.last_page || loading
            ? "bg-[var(--color-border)] text-[var(--color-text-dim)] cursor-not-allowed border border-[var(--color-border)]"
            : "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30"
          }`}
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
