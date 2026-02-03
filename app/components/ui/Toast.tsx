import React, { useEffect } from "react";
import { XIcon, CheckCircleIcon, CogIcon, HashIcon } from "~/components/ui/icons";

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
      shadow: "shadow-green-500/10",
      iconBg: "bg-green-500 shadow-green-500/20",
      icon: <CheckCircleIcon className="h-5 w-5" />,
      label: "Uspjeh",
      textColor: "text-green-400"
    },
    error: {
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      shadow: "shadow-red-500/10",
      iconBg: "bg-red-500 shadow-red-500/20",
      icon: <XIcon className="h-5 w-5" />,
      label: "Greška",
      textColor: "text-red-400"
    },
    info: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      shadow: "shadow-blue-500/10",
      iconBg: "bg-blue-500 shadow-blue-500/20",
      icon: <HashIcon className="h-5 w-5" />,
      label: "Info",
      textColor: "text-blue-400"
    },
    warning: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      shadow: "shadow-amber-500/10",
      iconBg: "bg-amber-500 shadow-amber-500/20",
      icon: <CogIcon className="h-5 w-5" />,
      label: "Upozorenje",
      textColor: "text-amber-400"
    }
  };

  const current = config[type];

  return (
    <div className={`fixed top-[72px] left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 transform 
      w-[calc(100%-2rem)] max-w-md md:w-auto
      ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0 pointer-events-none"}`}
    >
      <div className={`backdrop-blur-2xl border p-3 md:px-4 md:py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-4
        ${current.bg} ${current.border} ${current.shadow}`}
      >
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 min-w-[2rem] rounded-xl flex items-center justify-center text-white shadow-lg ${current.iconBg}`}>
            {current.icon}
          </div>

          <div className="overflow-hidden">
            <p className="text-white font-black text-[10px] leading-none uppercase tracking-wider italic">
              {current.label}
            </p>
            <p className={`text-[10px] mt-1 font-bold break-words line-clamp-2 ${current.textColor}`}>
              {message}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 -mr-1 text-gray-500 hover:text-white transition-colors"
          aria-label="Zatvori"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
