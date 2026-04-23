import { useNavigate } from "react-router";
import { Drawer } from "./Drawer";
import { DrawerNavItem } from "./DrawerNavItem";
import type { NAV_ITEMS } from "~/config/navigation";

interface DocumentsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    items: typeof NAV_ITEMS;
}

export function DocumentsDrawer({ isOpen, onClose, items }: DocumentsDrawerProps) {
    const navigate = useNavigate();

    const goTo = (path: string) => {
        onClose();
        navigate(path);
    };

    return (
        <Drawer title="Dokumenti" isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col gap-3">
                {items.map((item) => (
                    <DrawerNavItem
                        key={item.id}
                        onClick={() => goTo(item.path)}
                        icon={item.icon}
                        title={item.title}
                        description={item.label}
                    />
                ))}
            </div>
        </Drawer>
    );
}
