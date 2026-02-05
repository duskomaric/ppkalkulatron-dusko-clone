import React, { type ReactNode } from "react";
import { Drawer } from "../layout/Drawer";
import { TrashIcon, PencilIcon } from "./icons";

interface DetailDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    entityName: string;
    entityIcon: React.ElementType;
    badges?: ReactNode;
    onEdit?: () => void;
    onDelete?: () => void;
    children: ReactNode;
}

export function DetailDrawer({
    isOpen,
    onClose,
    title,
    entityName,
    entityIcon: EntityIcon,
    badges,
    onEdit,
    onDelete,
    children
}: DetailDrawerProps) {
    return (
        <Drawer
            title={title}
            isOpen={isOpen}
            onClose={onClose}
        >
            <div className="flex flex-col gap-4">
                {/* Header Card */}
                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-[24px] border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <EntityIcon className="h-16 w-16 text-white" />
                    </div>
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20 bg-primary z-10 shrink-0`}>
                        {entityName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="z-10 min-w-0">
                        <p className="font-black text-lg text-white tracking-tighter italic leading-tight truncate">{entityName}</p>
                        <div className="flex items-center gap-2 mt-1">
                            {badges}
                        </div>
                    </div>
                </div>

                {/* Content Section (Grids, Descriptions, etc.) */}
                {children}

                {/* Actions Footer */}
                <div className="flex flex-col gap-2 pt-2">
                    <div className="flex gap-2">
                        {onDelete && (
                            <button
                                onClick={onDelete}
                                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all group"
                            >
                                <TrashIcon className="h-3.5 w-3.5 transition-transform group-hover:rotate-12" />
                                Obriši
                            </button>
                        )}
                        {onEdit && (
                            <button
                                onClick={onEdit}
                                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-glow-primary hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                <PencilIcon className="h-3.5 w-3.5" />
                                Uredi
                            </button>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="w-full py-3.5 bg-white/5 text-gray-400 border border-white/5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all"
                    >
                        Zatvori
                    </button>
                </div>
            </div>
        </Drawer>
    );
}
