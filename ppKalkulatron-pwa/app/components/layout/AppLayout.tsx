import { useState, useEffect, useMemo, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useNavigate, Link, useLocation } from "react-router";
import { useAuth } from "~/hooks/useAuth";
import { useYear } from "~/contexts/YearContext";
import { getMe } from "~/api/config";
import {
  CalculatorIcon,
  CogIcon,
  UserIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  HashIcon,
  GripIcon,
} from "~/components/ui/icons";
import { Drawer } from "./Drawer";
import { BottomNavigation } from "./BottomNavigation";
import { SettingsDrawer } from "./SettingsDrawer";
import { UserDrawer } from "./UserDrawer";
import { CompanyDrawer } from "./CompanyDrawer";
import { DocumentsDrawer } from "./DocumentsDrawer";
import type { Company } from "~/types/company";
import { getThemeByPath } from "~/utils/theme";
import { NAV_ITEMS } from "~/config/navigation";
import { getPageTitle, APP_CONFIG } from "~/config/app";

export interface AppLayoutProps {
  children: ReactNode;
  title: string;
  selectedCompany: Company | null;
  onCompanyChange: (company: Company) => void;
  actions?: ReactNode;
}

export function AppLayout({
  children,
  title,
  selectedCompany,
  onCompanyChange,
  actions
}: AppLayoutProps) {
  const { user, token, logoutAction, loading, refreshUser } = useAuth();
  const { selectedYear, setSelectedYear, availableYears, setAvailableYears, yearDrawerOpen, closeYearDrawer } = useYear();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeDrawer, setActiveDrawer] = useState<"company" | "user" | "settings" | "documents" | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const companyCount = user?.companies?.length ?? 0;
  const canSwitchCompany = companyCount > 1;
  const isCompanyInactive = Boolean(selectedCompany && !selectedCompany.is_active);

  const companySettings = selectedCompany?.company_settings ?? (user as any)?.company_settings ?? {};

  const enabledModules = useMemo(() => {
    if (!selectedCompany || !selectedCompany.is_active) return [];
    const modules = selectedCompany?.enabled_modules;
    return Array.isArray(modules) ? modules : [];
  }, [selectedCompany]);

  const { visibleNavItems, drawerNavItems } = useMemo(() => {
    const allVisible = NAV_ITEMS.filter((item) => enabledModules.includes(item.id));

    // Aggressive check for configured IDs
    const menuModuleIds = Array.isArray(companySettings.menu_modules)
      ? companySettings.menu_modules
      : (typeof companySettings.menu_modules === 'string' ? JSON.parse(companySettings.menu_modules) : null);

    const drawerModuleIds = Array.isArray(companySettings.drawer_modules)
      ? companySettings.drawer_modules
      : (typeof companySettings.drawer_modules === 'string' ? JSON.parse(companySettings.drawer_modules) : null);

    let mainMenu: any[] = [];
    let drawerMenu: any[] = [];

    if (Array.isArray(menuModuleIds) || Array.isArray(drawerModuleIds)) {
      // Respect user configuration
      const configuredMenuIds = Array.isArray(menuModuleIds) ? menuModuleIds : [];
      const configuredDrawerIds = Array.isArray(drawerModuleIds) ? drawerModuleIds : [];

      // Filter and order menu items
      mainMenu = configuredMenuIds
        .map(id => allVisible.find(item => item.id === id))
        .filter(Boolean) as any[];

      // Filter and order drawer items
      drawerMenu = configuredDrawerIds
        .map(id => allVisible.find(item => item.id === id))
        .filter(Boolean) as any[];

      // Final constraint: main menu max 4 before adding "Documents"
      if (mainMenu.length > 4) {
        const extra = mainMenu.splice(4);
        drawerMenu = [...extra, ...drawerMenu];
      }
    } else {
      // Default: first 4 in menu, rest in drawer if > 5 total
      if (allVisible.length > 5) {
        mainMenu = allVisible.slice(0, 4);
        drawerMenu = allVisible.slice(4);
      } else {
        mainMenu = [...allVisible];
        drawerMenu = [];
      }
    }

    // Add Documents item if drawer items exist
    if (drawerMenu.length > 0) {
      const docsItem = {
        id: 'documents' as any,
        icon: GripIcon,
        label: 'Dokumenti',
        title: 'Dokumenti',
        isDrawerTrigger: true,
      };

      // Place it first: [DOCS, item, item, item, item]
      mainMenu.unshift(docsItem);
    }

    return { visibleNavItems: mainMenu, drawerNavItems: drawerMenu };
  }, [enabledModules, companySettings.menu_modules, companySettings.drawer_modules]);

  const homePath = useMemo(() => {
    const enabled = NAV_ITEMS.filter((item) => enabledModules.includes(item.id));
    if (enabled.some(i => i.id === 'invoices')) return "/invoices";
    return enabled[0]?.path ?? "/profile";
  }, [enabledModules]);
  const currentRGB = getThemeByPath(location.pathname);

  const settingsRefreshedRef = useRef(false);
  useEffect(() => {
    if (activeDrawer === "settings" && !settingsRefreshedRef.current) {
      settingsRefreshedRef.current = true;
      refreshUser();
    }
    if (activeDrawer !== "settings") {
      settingsRefreshedRef.current = false;
    }
  }, [activeDrawer, refreshUser]);

  useEffect(() => {
    if (!selectedCompany || !token) return;
    const currentYear = new Date().getFullYear();
    getMe(token, selectedCompany.slug).then((res) => {
      const years = res.data.available_years ?? [currentYear];
      setAvailableYears(years.length ? years : [currentYear]);
      setSelectedYear(currentYear);
    }).catch(() => { });
  }, [selectedCompany?.slug, token, setAvailableYears, setSelectedYear]);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!loading && !token) navigate("/");
  }, [loading, token, navigate]);

  useEffect(() => {
    if (loading || !token) return;
    const isModuleRoute = NAV_ITEMS.some((item) => item.path === location.pathname);
    if (!isModuleRoute) return;

    const allVisible = NAV_ITEMS.filter((item) => enabledModules.includes(item.id));
    const isVisible = allVisible.some((item) => item.path === location.pathname);
    if (!isVisible) navigate(homePath);
  }, [loading, token, location.pathname, enabledModules, homePath, navigate]);

  useEffect(() => {
    if (title) document.title = getPageTitle(title);
  }, [title]);

  const handleLogout = () => {
    logoutAction();
    navigate("/");
  };

  const hasSubNotification = (() => {
    if (!selectedCompany?.subscription_ends_at) return false;
    const endDate = new Date(selectedCompany.subscription_ends_at);
    const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft < 30;
  })();

  if (loading || !token) return null;

  return (
    <div
      className="min-h-screen flex flex-col pb-32 lg:pb-8 relative"
      style={{
        "--primary-base": currentRGB,
        "--color-primary": `rgb(${currentRGB})`,
        "--color-primary-hover": `color-mix(in srgb, rgb(${currentRGB}), white 20%)`,
        "--shadow-glow-primary": `0 0 20px 2px rgba(${currentRGB}, 0.4)`,
        "--color-page-bg": `rgba(${currentRGB}, 0.05)`,
        "--color-page-bg-strong": `rgba(${currentRGB}, 0.1)`,
        "--color-page-bg-hover": `rgba(${currentRGB}, 0.15)`,
        "--color-page-border": `rgba(${currentRGB}, 0.4)`,
        "--color-page-border-subtle": `rgba(${currentRGB}, 0.3)`,
        backgroundImage: [
          `radial-gradient(ellipse 320px 320px at -80px -80px, rgba(${currentRGB}, 0.4), transparent 70%)`,
          `radial-gradient(ellipse 280px 280px at calc(100% + 30px) calc(100% + 30px), rgba(${currentRGB}, 0.35), transparent 70%)`,
          `radial-gradient(ellipse 450px 450px at 18% 42%, rgba(${currentRGB}, 0.2), transparent 65%)`,
        ].join(", "),
      } as CSSProperties}
    >
      {/* Header */}
      <header className="sticky top-0 z-40 h-[56px] flex items-center bg-[var(--color-bg)]/20 backdrop-blur-lg border-b border-[var(--color-border)]">
        <div className="max-w-[1200px] w-full mx-auto px-4 sm:px-6 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Link
              to={homePath}
              className="h-8 w-8 shrink-0 bg-primary rounded-xl flex items-center justify-center text-white shadow-glow-primary cursor-pointer transition-all duration-500"
            >
              <CalculatorIcon className="h-4 w-4" />
            </Link>

            {visibleNavItems.length > 0 && (
              <nav className="hidden lg:flex items-center gap-1.5 shrink-0">
                {visibleNavItems.map((item, index) => {
                  const isActive = !item.isDrawerTrigger && location.pathname === item.path;
                  const Icon = item.icon;
                  const itemContent = (
                    <>
                      <span className={`h-5 w-5 rounded-lg flex items-center justify-center transition-colors ${isActive ? "bg-primary/20 text-primary" : "bg-[var(--color-border)] text-[var(--color-text-dim)] group-hover:text-[var(--color-text-main)]"
                        }`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="leading-none">{item.title}</span>
                      {isActive && (
                        <span className="absolute -bottom-1 left-3 right-3 h-[2px] bg-primary/60 rounded-full" />
                      )}
                    </>
                  );

                  let element;
                  if (item.isDrawerTrigger) {
                    element = (
                      <button
                        key={item.id}
                        onClick={() => setActiveDrawer("documents")}
                        className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest cursor-pointer text-[var(--color-text-dim)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-hover)]`}
                      >
                        {itemContent}
                      </button>
                    );
                  } else {
                    element = (
                      <Link
                        key={item.id}
                        to={item.path}
                        className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest cursor-pointer ${isActive
                          ? "bg-primary/20 text-primary shadow-glow-primary ring-1 ring-primary/30"
                          : "text-[var(--color-text-dim)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-hover)]"
                          }`}
                      >
                        {itemContent}
                      </Link>
                    );
                  }

                  return (
                    <div key={item.id} className="flex items-center gap-1.5">
                      {element}
                      {item.isDrawerTrigger && index === 0 && visibleNavItems.length > 1 && (
                        <div className="h-5 w-[1px] bg-[var(--color-border)] mx-1 opacity-50" />
                      )}
                    </div>
                  );
                })}
              </nav>
            )}

            {selectedCompany && (
              canSwitchCompany ? (
                <button
                  onClick={() => setActiveDrawer("company")}
                  className="group cursor-pointer flex items-center gap-1 px-2 py-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 hover:bg-[var(--color-surface-hover)] transition-all min-w-0 max-w-[min(100%,180px)] sm:max-w-[220px] md:max-w-[260px]"
                >
                  <span className="min-w-0 flex flex-col items-start overflow-hidden w-full">
                    <span className="text-[8px] uppercase tracking-[0.2em] text-[var(--color-text-dim)] shrink-0">Kompanija</span>
                    <span className="text-xs font-black text-[var(--color-text-main)] truncate w-full text-left">
                      {selectedCompany.name}
                    </span>
                  </span>
                  <ChevronDownIcon className="h-4 w-4 text-[var(--color-text-dim)] group-hover:text-primary transition-colors shrink-0" />
                </button>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/40 min-w-0 max-w-[min(100%,180px)] sm:max-w-[220px] md:max-w-[260px]">
                  <span className="min-w-0 flex flex-col items-start overflow-hidden w-full">
                    <span className="text-[8px] uppercase tracking-[0.2em] text-[var(--color-text-dim)] shrink-0">Kompanija</span>
                    <span className="text-xs font-black text-[var(--color-text-main)] truncate w-full text-left">
                      {selectedCompany.name}
                    </span>
                  </span>
                </div>
              )
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => setActiveDrawer("settings")}
              className="relative cursor-pointer h-8 w-8 rounded-lg border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-dim)] hover:text-primary hover:border-primary/30 transition-all"
            >
              <CogIcon className="h-4 w-4" />
              {hasSubNotification && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-[var(--color-bg)] shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setActiveDrawer("user")}
              className="cursor-pointer h-9 w-9 bg-[var(--color-surface)] text-[var(--color-text-muted)] rounded-xl flex items-center justify-center font-bold text-xs border border-[var(--color-border)] hover:border-primary hover:text-primary transition-all"
            >
              <UserIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-[1200px] w-full mx-auto px-5 py-6 relative">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-[var(--color-text-main)] tracking-tight italic">
            {(APP_CONFIG.titles as any)[title.toLowerCase()] || title}
          </h1>
          {actions}
        </div>
        {selectedCompany && (
          <div className="mb-6 space-y-3">
            {isCompanyInactive && (
              <div className="flex items-center gap-3 rounded-xl border-l-4 border-[var(--color-error)] bg-red-50 p-4 shadow-sm">
                <div className="flex-shrink-0 text-[var(--color-error)]">
                  <HashIcon size={20} />
                </div>
                <div className="text-sm text-slate-800">
                  <span className="font-bold text-[var(--color-error)] uppercase tracking-tight text-xs block mb-0.5">
                    Status: Neaktivna
                  </span>
                  Upozorenje za <strong>{selectedCompany.name}</strong>. Licenca je vjerovatno istekla.
                </div>
              </div>
            )}
            {!isCompanyInactive && (NAV_ITEMS.filter((item) => enabledModules.includes(item.id))).length === 0 && (
              <div className="flex items-center gap-3 rounded-xl border-l-4 border-[var(--color-warning)] bg-amber-50 p-4 shadow-sm">
                <div className="flex-shrink-0 text-[var(--color-warning)]">
                  <HashIcon size={20} />
                </div>
                <div className="text-sm text-slate-800">
                  <span className="font-bold text-[var(--color-warning)] uppercase tracking-tight text-xs block mb-0.5">
                    Pristup ograničen
                  </span>
                  Nemate dodijeljene module za <strong>{selectedCompany.name}</strong>. Kontaktirajte admina.
                </div>
              </div>
            )}
          </div>
        )}
        {children}
      </main>

      <BottomNavigation
        items={visibleNavItems}
        onDrawerOpen={() => setActiveDrawer("documents")}
      />

      {/* Back to Top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed right-6 bottom-32 lg:bottom-8 z-[60] h-10 w-10 bg-primary rounded-full flex items-center justify-center text-white shadow-glow-primary transition-all duration-300 transform cursor-pointer ${showBackToTop ? "scale-100 opacity-100 translate-y-0" : "scale-0 opacity-0 translate-y-10"
          } hover:scale-110 active:scale-95`}
        aria-label="Back to top"
      >
        <ChevronUpIcon className="h-5 w-5" />
      </button>

      {/* Drawers */}
      <Drawer title="Odabir godine" isOpen={yearDrawerOpen} onClose={closeYearDrawer}>
        <div className="space-y-2">
          {availableYears.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => { setSelectedYear(y); closeYearDrawer(); }}
              className={`w-full flex items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${selectedYear === y ? "border-primary bg-primary/10 ring-1 ring-primary/20" : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]"}`}
            >
              <span className={`text-lg font-black ${selectedYear === y ? "text-primary" : "text-[var(--color-text-main)]"}`}>
                {y}
              </span>
            </button>
          ))}
        </div>
      </Drawer>

      <CompanyDrawer
        isOpen={activeDrawer === "company"}
        onClose={() => setActiveDrawer(null)}
        companies={user?.companies ?? []}
        selectedCompanyId={selectedCompany?.id ?? null}
        onSelect={onCompanyChange}
      />

      <UserDrawer
        isOpen={activeDrawer === "user"}
        onClose={() => setActiveDrawer(null)}
        user={user}
        onLogout={handleLogout}
      />

      <SettingsDrawer
        isOpen={activeDrawer === "settings"}
        onClose={() => setActiveDrawer(null)}
        selectedCompany={selectedCompany}
      />

      <DocumentsDrawer
        isOpen={activeDrawer === "documents"}
        onClose={() => setActiveDrawer(null)}
        items={drawerNavItems}
      />
    </div>
  );
}
