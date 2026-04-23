import { useEffect } from "react";
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
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
            iconBg: "bg-emerald-500",
            icon: <CheckCircleIcon className="h-4 w-4 text-white" />,
            label: "Uspjeh",
            accent: "bg-emerald-500"
        },
        error: {
            bg: "bg-rose-500/10",
            border: "border-rose-500/20",
            iconBg: "bg-rose-500",
            icon: <XIcon className="h-4 w-4 text-white" />,
            label: "Greška",
            accent: "bg-rose-500"
        },
        info: {
            bg: "bg-sky-500/10",
            border: "border-sky-500/20",
            iconBg: "bg-sky-500",
            icon: <InfoIcon className="h-4 w-4 text-white" />,
            label: "Informacija",
            accent: "bg-sky-500"
        },
        warning: {
            bg: "bg-amber-500/10",
            border: "border-amber-500/20",
            iconBg: "bg-amber-500",
            icon: <CogIcon className="h-4 w-4 text-white" />,
            label: "Upozorenje",
            accent: "bg-amber-500"
        }
    };

    const current = config[type];

    return (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[1200] transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] transform 
      w-[calc(100%-2.5rem)] max-w-[420px]
      ${isVisible ? "translate-y-0 opacity-100 scale-100" : "-translate-y-6 opacity-0 scale-95 pointer-events-none"}`}
        >
            {/* Glavni kontejner mora imati overflow-hidden da progress bar ne izlazi van rounded ivica */}
            <div className={`relative overflow-hidden backdrop-blur-2xl bg-zinc-900/80 border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)]
        ${current.bg} ${current.border} transition-colors hover:bg-zinc-900/90`}
            >
                <div className="flex items-start justify-between gap-4 p-4">
                    <div className="flex items-start gap-4 min-w-0">
                        {/* Ikona */}
                        <div className={`h-10 w-10 min-w-[2.5rem] rounded-xl flex items-center justify-center shadow-lg shrink-0 ${current.iconBg} ring-4 ring-black/10`}>
                            {current.icon}
                        </div>

                        <div className="min-w-0 pt-0.5">
              <span className="block text-white/40 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">
                {current.label}
              </span>
                            <p className="text-[14px] font-medium leading-relaxed text-zinc-100 break-words">
                                {message}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 -mr-1 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all shrink-0 cursor-pointer"
                        aria-label="Zatvori"
                    >
                        <XIcon className="h-4 w-4" />
                    </button>
                </div>

                {/* Ispravljen Progress Bar: Bez lijevih/desnih margina, puni širinu dna */}
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/5">
                    <div
                        className={`h-full ${current.accent} opacity-60 transition-all ease-linear`}
                        style={{
                            width: isVisible ? '0%' : '100%',
                            transitionDuration: isVisible ? `${duration}ms` : '0ms'
                        }}
                    />
                </div>
            </div>

            {/* Glow efekt u pozadini */}
            <div className={`absolute -inset-1 blur-2xl opacity-10 -z-10 ${current.accent}`} />
        </div>
    );
}