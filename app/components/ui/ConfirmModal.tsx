import React, { useEffect } from "react";
import { TrashIcon, XIcon, AlertTriangleIcon } from "~/components/ui/icons";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: "danger" | "warning";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Obriši",
  cancelLabel = "Odustani",
  type = "danger"
}: ConfirmModalProps) {
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

  const isDanger = type === "danger";

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[12px] animate-fade-in transition-all duration-500"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-[340px] bg-[#0F0F13]/95 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden animate-slide-in-bottom">

        {/* Glow Effects */}
        <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-[60px] opacity-20 pointer-events-none ${isDanger ? 'bg-red-500' : 'bg-amber-500'}`}></div>

        <div className="p-8 pb-6 text-center relative z-10">
          {/* Icon Section */}
          <div className="flex justify-center mb-6">
            <div className={`h-16 w-16 rounded-[24px] flex items-center justify-center border shadow-lg transform rotate-3 transition-transform hover:rotate-0 duration-500 ${isDanger
              ? 'bg-red-500/10 border-red-500/20 text-red-500 shadow-red-500/10'
              : 'bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-amber-500/10'
              }`}>
              {isDanger ? <TrashIcon className="h-7 w-7" /> : <AlertTriangleIcon className="h-7 w-7" />}
            </div>
          </div>

          <h3 className="text-xl font-black text-white tracking-tight italic mb-3">
            {title}
          </h3>
          <p className="text-gray-400 text-[13px] font-bold leading-relaxed px-2">
            {message}
          </p>
        </div>

        <div className="flex flex-col gap-2 p-8 pt-0 relative z-10">
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg hover:scale-[1.02] active:scale-95 transition-all ${isDanger
              ? 'bg-red-500 text-white shadow-red-500/25 hover:bg-red-600'
              : 'bg-amber-500 text-black shadow-amber-500/25 hover:bg-amber-600'
              }`}
          >
            {confirmLabel}
          </button>

          <button
            onClick={onClose}
            className="w-full py-4 bg-white/5 text-gray-400 border border-white/5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:text-white hover:bg-white/10 transition-all active:scale-95"
          >
            {cancelLabel}
          </button>
        </div>

        {/* Bottom Line decoration */}
        <div className={`h-1 w-full opacity-30 ${isDanger ? 'bg-red-500' : 'bg-amber-500'}`}></div>
      </div>
    </div>
  );
}
