import { useEffect, useState, useRef } from "react";
import type { FormEvent } from "react";
import { AppLayout } from "~/components/layout/AppLayout";
import { useAuth } from "~/hooks/useAuth";
import { getMe } from "~/api/config";
import { updateCompanySettings } from "~/api/settings";
import type { CompanySettings, AppConfigData } from "~/types/config";
import { Toast } from "~/components/ui/Toast";
import { CheckCircleIcon, GripIcon, ChevronUpIcon, ChevronDownIcon, InfoIcon } from "~/components/ui/icons";
import { NAV_ITEMS } from "~/config/navigation";
import { useNavigate, Link } from "react-router";
import { SectionBlock } from "~/components/ui/SectionBlock";
import { SectionHeader } from "~/components/ui/SectionHeader";
import { LoadingState } from "~/components/ui/LoadingState";
import { useToast } from "~/hooks/useToast";

const ROW_HIGHLIGHT_MS = 900;

export default function VisualSettingsPage() {
    const { selectedCompany, updateSelectedCompany, token, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [configData, setConfigData] = useState<AppConfigData | null>(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<CompanySettings | null>(null);
    const [saving, setSaving] = useState(false);
    const [lastChangedModuleId, setLastChangedModuleId] = useState<string | null>(null);
    const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { toast, showToast, hideToast } = useToast();

    useEffect(() => {
        return () => {
            if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
        };
    }, []);

    const setRowHighlight = (moduleId: string) => {
        if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
        setLastChangedModuleId(moduleId);
        highlightTimeoutRef.current = setTimeout(() => {
            setLastChangedModuleId(null);
            highlightTimeoutRef.current = null;
        }, ROW_HIGHLIGHT_MS);
    };

    const updateModulePlacement = (moduleId: string, placement: "menu" | "drawer" | "hidden") => {
        setFormData((prev) => {
            if (!prev) return prev;

            const currentMenu = Array.isArray(prev.menu_modules) ? [...prev.menu_modules] : [];
            const currentDrawer = Array.isArray(prev.drawer_modules)
                ? prev.drawer_modules.filter((id) => !currentMenu.includes(id))
                : [];

            let nextMenu = currentMenu.filter((id) => id !== moduleId);
            let nextDrawer = currentDrawer.filter((id) => id !== moduleId);

            if (placement === "menu") {
                if (nextMenu.length >= 4) {
                    showToast("Maksimalno 4 modula u meniju", "warning");
                    return prev;
                }
                nextMenu.push(moduleId);
            }

            if (placement === "drawer") {
                nextDrawer.push(moduleId);
            }

            return {
                ...prev,
                menu_modules: nextMenu,
                drawer_modules: nextDrawer,
            };
        });
        setRowHighlight(moduleId);
    };

    const reorderModule = (moduleId: string, direction: "up" | "down", inMenu: boolean) => {
        setFormData((prev) => {
            if (!prev) return prev;

            const menuModules = Array.isArray(prev.menu_modules) ? [...prev.menu_modules] : [];
            const drawerModules = Array.isArray(prev.drawer_modules)
                ? prev.drawer_modules.filter((id) => !menuModules.includes(id))
                : [];
            const list = inMenu ? [...menuModules] : [...drawerModules];
            const idx = list.indexOf(moduleId);
            if (idx < 0) return prev;

            const target = direction === "up" ? idx - 1 : idx + 1;
            if (target < 0 || target >= list.length) return prev;

            [list[idx], list[target]] = [list[target], list[idx]];
            return inMenu
                ? { ...prev, menu_modules: list, drawer_modules: drawerModules }
                : { ...prev, menu_modules: menuModules, drawer_modules: list };
        });
        setRowHighlight(moduleId);
    };

    useEffect(() => {
        if (!token || !selectedCompany) return;
        setLoading(true);
        getMe(token, selectedCompany.slug)
            .then((meRes) => {
                setConfigData(meRes.data);
                setFormData(meRes.data.company_settings);
            })
            .catch(() => showToast("Failed to load settings", "error"))
            .finally(() => setLoading(false));
    }, [token, selectedCompany]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedCompany || !token || !formData) return;
        setSaving(true);
        try {
            const menuModules = Array.isArray(formData.menu_modules) ? formData.menu_modules : [];
            const drawerModules = Array.isArray(formData.drawer_modules)
                ? formData.drawer_modules.filter((id) => !menuModules.includes(id))
                : [];
            const payload: Partial<CompanySettings> = {
                ...formData,
                menu_modules: menuModules,
                drawer_modules: drawerModules,
            };

            await updateCompanySettings(selectedCompany.slug, token, payload);
            setFormData((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    menu_modules: menuModules,
                    drawer_modules: drawerModules,
                };
            });
            await refreshUser();
            showToast("Podešavanja sačuvana", "success");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Greška pri čuvanju";
            showToast(message, "error");
        } finally {
            setSaving(false);
        }
    };

    if (!selectedCompany) return null;

    return (
        <AppLayout title="Vizuelna podešavanja" selectedCompany={selectedCompany} onCompanyChange={updateSelectedCompany}>
            <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />

            <div className="mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-text-dim)] hover:text-primary transition-colors mb-4 cursor-pointer"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Nazad
                </button>
            </div>

            {loading && <LoadingState />}

            {!loading && configData && formData && (
                <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <SectionBlock variant="card">
                        <SectionHeader
                            icon={GripIcon}
                            title="Podešavanje Menija"
                            rightElement={
                                <Link
                                    to="/help#menu-settings"
                                    className="h-8 w-8 rounded-lg border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-dim)] hover:text-primary hover:border-primary/30 transition-all cursor-pointer"
                                    title="Pomoć: Podešavanje menija"
                                >
                                    <InfoIcon className="h-4 w-4" />
                                </Link>
                            }
                        />
                        <p className="text-[11px] text-[var(--color-text-dim)] mb-6 pl-1 italic">
                            Odaberite gdje želite prikazati određene module. Glavni meni može imati maksimalno 4 modula. Ako su oba prekidača isključena, modul je sakriven.
                        </p>

                        <div className="space-y-2 p-1.5 sm:p-2 rounded-2xl bg-[var(--color-bg)]/30 border border-dashed border-[var(--color-border)]">
                            {(() => {
                                const enabledModuleIds = (selectedCompany.enabled_modules as any || []) as string[];
                                const configuredMenu = Array.isArray(formData.menu_modules) ? formData.menu_modules : [];
                                const configuredDrawer = Array.isArray(formData.drawer_modules)
                                    ? formData.drawer_modules.filter((id) => !configuredMenu.includes(id))
                                    : [];
                                const allModules = [
                                    ...configuredMenu,
                                    ...configuredDrawer,
                                    ...enabledModuleIds.filter(id => !configuredMenu.includes(id) && !configuredDrawer.includes(id)),
                                ].map(id => NAV_ITEMS.find(item => item.id === id)).filter(Boolean) as typeof NAV_ITEMS;

                                return allModules.map((module) => {
                                    const inMenu = configuredMenu.includes(module.id);
                                    const inDrawer = configuredDrawer.includes(module.id);
                                    const isHighlighted = lastChangedModuleId === module.id;

                                    return (
                                        <div key={module.id} className="flex items-center gap-2 group">
                                            <div
                                                className={`flex-1 flex flex-row items-center justify-between p-1.5 sm:p-2.5 gap-1.5 sm:gap-3 rounded-xl transition-all duration-300 border ${isHighlighted ? "ring-2 ring-primary ring-offset-2 ring-offset-[var(--color-page-bg)] bg-primary/15 border-primary/40 shadow-md" : ""} ${!isHighlighted && !inMenu && !inDrawer ? "bg-[var(--color-bg)]/20 border-dashed border-[var(--color-border)] opacity-60" : !isHighlighted ? "bg-[var(--color-surface)] border-[var(--color-border)] shadow-sm hover:border-primary/20" : ""}`}
                                            >
                                                <div className={`flex items-center gap-1.5 sm:gap-2 transition-all ${!inMenu && !inDrawer ? "grayscale" : ""}`}>
                                                    <div className={`p-1.5 sm:p-2 rounded-lg transition-colors ${inMenu || inDrawer ? "bg-primary text-white" : "bg-[var(--color-bg-hover)] text-[var(--color-text-dim)]"}`}>
                                                        <module.icon className="h-4 w-4" />
                                                    </div>
                                                    <span className={`text-[12px] sm:text-[13px] font-bold transition-colors ${!inMenu && !inDrawer ? "text-[var(--color-text-dim)]" : "text-[var(--color-text-main)]"}`}>{module.title}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 sm:gap-3">
                                                    <div className="flex items-center gap-2 sm:gap-3">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-tighter ${inMenu ? "text-primary" : "text-[var(--color-text-dim)]"}`}>Meni</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => updateModulePlacement(module.id, inMenu ? "hidden" : "menu")}
                                                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${inMenu ? "bg-primary" : "bg-[var(--color-border-strong)]"}`}
                                                            >
                                                                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${inMenu ? "translate-x-4" : "translate-x-0"}`} />
                                                            </button>
                                                        </div>
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-tighter ${inDrawer ? "text-primary" : "text-[var(--color-text-dim)]"}`}>Dokumenti</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => updateModulePlacement(module.id, inDrawer ? "hidden" : "drawer")}
                                                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${inDrawer ? "bg-primary" : "bg-[var(--color-border-strong)]"}`}
                                                            >
                                                                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${inDrawer ? "translate-x-4" : "translate-x-0"}`} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-center gap-0.5 border-l border-[var(--color-border)] pl-2 sm:pl-3">
                                                        <button
                                                            type="button"
                                                            disabled={(inMenu && configuredMenu.indexOf(module.id) === 0) || (inDrawer && configuredDrawer.indexOf(module.id) === 0) || (!inMenu && !inDrawer)}
                                                            onClick={() => reorderModule(module.id, "up", inMenu)}
                                                            className="p-0.5 sm:p-1 rounded-lg hover:bg-primary/10 text-[var(--color-text-dim)] hover:text-primary transition-all disabled:opacity-20 cursor-pointer"
                                                        >
                                                            <ChevronUpIcon className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={(inMenu && configuredMenu.indexOf(module.id) === configuredMenu.length - 1) || (inDrawer && configuredDrawer.indexOf(module.id) === configuredDrawer.length - 1) || (!inMenu && !inDrawer)}
                                                            onClick={() => reorderModule(module.id, "down", inMenu)}
                                                            className="p-0.5 sm:p-1 rounded-lg hover:bg-primary/10 text-[var(--color-text-dim)] hover:text-primary transition-all disabled:opacity-20 cursor-pointer"
                                                        >
                                                            <ChevronDownIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </SectionBlock>

                    <div className="flex justify-end pt-4">
                        <button
                            disabled={saving}
                            type="submit"
                            className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-xl shadow-glow-primary transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                        >
                            {saving ? "Čuvanje..." : "Sačuvaj Promjene"}
                            {!saving && <CheckCircleIcon className="h-5 w-5" />}
                        </button>
                    </div>
                </form>
            )}
        </AppLayout>
    );
}
