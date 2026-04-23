import type { ElementType, ReactNode } from "react";
import { Drawer } from "../layout/Drawer";
import { TrashIcon, PencilIcon } from "./icons";
import { DrawerSecondaryButton } from "./DrawerSecondaryButton";

interface DetailDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    entityName: string;
    entityIcon: ElementType;
    badges?: ReactNode;
    onEdit?: () => void;
    onDelete?: () => void;
    deleteLabel?: string;
    deleteIcon?: ElementType;
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
    deleteLabel = "Obriši",
    deleteIcon: DeleteIcon,
    children
}: DetailDrawerProps) {
    const DeleteActionIcon = DeleteIcon || TrashIcon;

    return (
        <Drawer
            title={title}
            isOpen={isOpen}
            onClose={onClose}
        >
            <div className="flex flex-col gap-4">
                {/* Header Card */}
                <div className="flex items-center gap-3 p-4 bg-[var(--color-border)] rounded-[24px] border border-[var(--color-border-strong)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <EntityIcon className="h-16 w-16 text-[var(--color-text-main)]" />
                    </div>
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20 bg-primary z-10 shrink-0`}>
                        <EntityIcon className="h-8 w-8 primary/20" />
                    </div>
                    <div className="z-10 min-w-0">
                        <p className="font-black text-lg text-[var(--color-text-main)] tracking-tighter italic leading-tight truncate">{entityName}</p>
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
                                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-black text-[11px] uppercase tracking-[0.15em] hover:bg-red-500 hover:text-white transition-all group cursor-pointer"
                            >
                                <DeleteActionIcon className="h-4 w-4 transition-transform group-hover:rotate-12" />
                                {deleteLabel}
                            </button>
                        )}
                        {onEdit && (
                            <button
                                onClick={onEdit}
                                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-xl font-black text-[11px] uppercase tracking-[0.15em] shadow-glow-primary hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                            >
                                <PencilIcon className="h-4 w-4" />
                                Uredi
                            </button>
                        )}
                    </div>
                    <DrawerSecondaryButton label="Zatvori" onClick={onClose} />
                </div>
            </div>
        </Drawer>
    );
}
