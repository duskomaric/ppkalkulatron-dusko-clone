import React, {type ReactNode, type FormEvent, type SyntheticEvent} from "react";
import { Drawer } from "../layout/Drawer";

interface FormDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    onSubmit: (e: SyntheticEvent) => void;
    loading: boolean;
    submitLabel: string;
    children: ReactNode;
}

export function FormDrawer({
    isOpen,
    onClose,
    title,
    onSubmit,
    loading,
    submitLabel,
    children
}: FormDrawerProps) {
    return (
        <Drawer
            title={title}
            isOpen={isOpen}
            onClose={onClose}
        >
            <form onSubmit={onSubmit} className="space-y-4">
                {children}

                <div className="flex flex-col gap-2 pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-primary text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] shadow-glow-primary hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <span>{submitLabel}</span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full py-3.5 bg-white/5 text-gray-400 border border-white/5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all"
                    >
                        Odustani
                    </button>
                </div>
            </form>
        </Drawer>
    );
}
