import React, { useEffect } from "react";
import { TrashIcon, XIcon } from "~/components/ui/icons";

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

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" 
        onClick={onClose}
      ></div>
      
      <div className="relative w-full max-w-sm bg-[#0B0B0F] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden animate-slide-in-bottom">
        <div className="p-6 text-center">
          {/* Icon */}
          <div className="mx-auto h-14 w-14 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-4 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
            <TrashIcon className="h-7 w-7" />
          </div>

          <h3 className="text-xl font-black text-white tracking-tight italic mb-2">{title}</h3>
          <p className="text-gray-400 text-sm font-bold leading-relaxed px-4">
            {message}
          </p>
        </div>

        <div className="flex flex-col gap-2 p-6 pt-0">
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:bg-red-600 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {confirmLabel}
          </button>
          <button
            onClick={onClose}
            className="w-full py-4 bg-white/5 text-gray-400 border border-white/5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:text-white hover:bg-white/10 transition-all"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
