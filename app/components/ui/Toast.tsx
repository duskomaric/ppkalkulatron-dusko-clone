import React, { useEffect } from "react";
import { XIcon, CheckCircleIcon, CogIcon, InfoIcon } from "~/components/ui/icons";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, isVisible, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const config = {
    success: {
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      shadow: "shadow-green-500/20",
      iconBg: "bg-green-500",
      icon: <CheckCircleIcon className="h-4 w-4" />,
      label: "Uspjeh",
      textColor: "text-green-400"
    },
    error: {
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      shadow: "shadow-red-500/20",
      iconBg: "bg-red-500",
      icon: <XIcon className="h-4 w-4" />,
      label: "Greška",
      textColor: "text-red-400"
    },
    info: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      shadow: "shadow-blue-500/20",
      iconBg: "bg-blue-500",
      icon: <InfoIcon className="h-4 w-4" />,
      label: "Informacija",
      textColor: "text-blue-400"
    },
    warning: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      shadow: "shadow-amber-500/20",
      iconBg: "bg-amber-500",
      icon: <CogIcon className="h-4 w-4" />,
      label: "Upozorenje",
      textColor: "text-amber-400"
    }
  };

  const current = config[type];

  return (
    <div className={`fixed top-[76px] left-1/2 -translate-x-1/2 z-[1200] transition-all duration-500 transform 
      w-[calc(100%-2.5rem)] max-w-[360px]
      ${isVisible ? "translate-y-0 opacity-100 scale-100" : "-translate-y-8 opacity-0 scale-95 pointer-events-none"}`}
    >
      <div className={`backdrop-blur-2xl border p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3
        ${current.bg} ${current.border} ${current.shadow}`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`h-8 w-8 min-w-[2rem] rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 ${current.iconBg}`}>
            {current.icon}
          </div>

          <div className="min-w-0">
            <p className="text-white font-black text-[9px] leading-tight uppercase tracking-widest italic opacity-80">
              {current.label}
            </p>
            <p className={`text-[11px] font-bold truncate leading-tight mt-0.5 ${current.textColor}`}>
              {message}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 h-8 w-8 flex items-center justify-center bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all hover:bg-white/10 shrink-0"
          aria-label="Zatvori"
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Dynamic line at bottom for progress feel */}
      {isVisible && (
        <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-white/10 opacity-50 blur-[0.5px]"></div>
      )}
    </div>
  );
}
