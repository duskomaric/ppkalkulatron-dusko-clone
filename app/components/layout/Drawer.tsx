import React, { useEffect } from "react";
import { XIcon } from "~/components/ui/icons";

interface DrawerProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

export const Drawer: React.FC<DrawerProps> = ({ title, children, isOpen, onClose }) => {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[8px] animate-fade-in transition-all duration-500"
        onClick={onClose}
      ></div>

      {/* Drawer Container */}
      <div className="relative w-full max-w-lg bg-[var(--color-surface)]/95 backdrop-blur-2xl rounded-t-[32px] sm:rounded-[40px] shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden animate-slide-in-bottom border-t sm:border border-[var(--color-border)] flex flex-col max-h-[94vh] sm:max-h-[90vh]">

        {/* Mobile Pull Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-[var(--color-border)] rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex flex-col">
            <h2 className="text-lg font-black text-[var(--color-text-main)] tracking-tight italic leading-tight">
              {title}
            </h2>
            <div className="h-0.5 w-8 bg-primary rounded-full mt-1 opacity-50"></div>
          </div>

          <button
            onClick={onClose}
            className="cursor-pointer h-10 w-10 flex items-center justify-center bg-[var(--color-border)] hover:bg-[var(--color-surface-hover)] rounded-[14px] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-all border border-[var(--color-border)] group active:scale-90"
            aria-label="Zatvori"
          >
            <XIcon className="h-5 w-5 transition-transform group-hover:rotate-90" />
          </button>
        </div>

        {/* Glow Decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-primary/20 blur-md pointer-events-none"></div>

        {/* Scrollable Body */}
        <div className="px-6 pb-24 sm:pb-12 overflow-y-auto custom-scrollbar flex-1">
          <div className="animate-fade-in mt-2 transition-all duration-700 delay-100">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
