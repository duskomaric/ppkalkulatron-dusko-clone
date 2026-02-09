import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router";
import { useAuth } from "~/hooks/useAuth";
import {
  CalculatorIcon,
  CogIcon,
  UserIcon,
  ChevronUpIcon,
  ChevronRightIcon,
  BoxesIcon,
  CreditCardIcon,
  CurrencyEuroIcon,
  Building2Icon,
  FileTextIcon
} from "~/components/ui/icons";
import { Drawer } from "./Drawer";
import type { Company } from "~/types/company";
import { getThemeByPath } from "~/utils/theme";
import { NAV_ITEMS } from "~/config/navigation";
import { getPageTitle, APP_CONFIG } from "~/config/app";

export interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  selectedCompany: Company | null;
  onCompanyChange: (company: Company) => void;
  actions?: React.ReactNode;
}

export function AppLayout({
  children,
  title,
  selectedCompany,
  onCompanyChange,
  actions
}: AppLayoutProps) {
  const { user, token, logoutAction, loading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeDrawer, setActiveDrawer] = useState<"company" | "user" | "settings" | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Get dynamic color based on path from central utility
  const currentRGB = getThemeByPath(location.pathname);

  // Refresh user data (companies + subscription) once when settings drawer opens
  const settingsRefreshedRef = React.useRef(false);
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
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Route protection
  useEffect(() => {
    if (!loading && !token) {
      navigate("/");
    }
  }, [loading, token, navigate]);

  // Document Title
  useEffect(() => {
    if (title) {
      document.title = getPageTitle(title);
    }
  }, [title]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    logoutAction();
    navigate("/");
  };

  // Subscription logic
  const getSubscriptionInfo = () => {
    if (!selectedCompany?.subscription_ends_at) {
      return { isLifetime: true, daysLeft: null, label: "Lifetime" };
    }
    const endDate = new Date(selectedCompany.subscription_ends_at);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      isLifetime: false,
      daysLeft,
      label: endDate.toLocaleDateString("bs-BA", { day: "2-digit", month: "2-digit", year: "numeric" }),
    };
  };

  const subInfo = getSubscriptionInfo();
  const hasSubNotification = !subInfo.isLifetime && subInfo.daysLeft !== null && subInfo.daysLeft < 30;

  if (loading || !token) return null;

  return (
    <div
      className="min-h-screen flex flex-col pb-32 md:pb-8 overflow-hidden relative"
      style={{
        "--primary-base": currentRGB,
        "--color-primary": `rgb(${currentRGB})`,
        "--color-primary-hover": `color-mix(in srgb, rgb(${currentRGB}), white 20%)`,
        "--shadow-glow-primary": `0 0 20px 2px rgba(${currentRGB}, 0.4)`
      } as React.CSSProperties}
    >
      {/* Background Effects */}
      <div className="glow-ball glow-ball-primary top-[-100px] left-[-100px]"></div>
      <div className="glow-ball glow-ball-secondary bottom-[-50px] right-[-50px]"></div>
      <div className="glow-ball bg-primary/10 w-[400px] h-[400px] top-[40%] left-[20%] blur-[120px] pointer-events-none absolute"></div>

      {/* Header */}
      <header className="sticky top-0 z-40 h-[60px] flex items-center bg-[var(--color-bg)]/20 backdrop-blur-lg border-b border-[var(--color-border)]">
        <div className="max-w-[1200px] w-full mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link
              to="/invoices"
              className="h-9 w-9 bg-primary rounded-xl flex items-center justify-center text-white shadow-glow-primary cursor-pointer transition-all duration-500"
            >
              <CalculatorIcon className="h-5 w-5" />
            </Link>

            {/* Desktop nav - hidden on mobile */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${isActive ? "bg-primary/20 text-primary" : "text-[var(--color-text-dim)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-hover)]"}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {selectedCompany && (
              <button
                onClick={() => setActiveDrawer("company")}
                className="cursor-pointer flex items-center gap-2 px-2.5 py-1.5 hover:bg-[var(--color-surface-hover)] rounded-xl transition-all border border-transparent"
              >
                <span className="text-xs font-bold text-[var(--color-text-main)] truncate max-w-[120px] sm:max-w-none">
                  {selectedCompany.name}
                </span>
                <svg className="h-3.5 w-3.5 text-[var(--color-text-dim)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 9l-7 7-7-7" strokeWidth="2.5" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveDrawer("settings")}
              className="relative cursor-pointer h-9 w-9 flex items-center justify-center text-[var(--color-text-dim)] hover:text-primary hover:bg-[var(--color-surface-hover)] rounded-xl transition-all"
            >
              <CogIcon className="h-5 w-5" />
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
        {children}
      </main>

      {/* Bottom Navigation - mobile only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-5 flex justify-center pointer-events-auto">
        <nav className="bg-[var(--color-glass)] backdrop-blur-2xl border border-[var(--color-border-strong)] rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/20 px-5 sm:px-8 py-2.5 sm:py-3.5 flex items-center justify-around gap-2 sm:gap-6 w-full max-w-md sm:max-w-lg">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.id}
                to={item.path}
                title={item.title}
                className={`cursor-pointer group flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'scale-110 sm:scale-125 -translate-y-1' : 'hover:scale-110'}`}
              >
                <div className={`relative p-2.5 sm:p-3 rounded-2xl transition-all duration-300 ${isActive ? 'bg-primary/25 shadow-glow-primary ring-1 ring-primary/40' : 'bg-[var(--color-surface)] group-hover:bg-[var(--color-surface-hover)]'}`}>
                  <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${isActive ? 'text-primary' : 'text-[var(--color-text-dim)] group-hover:text-[var(--color-text-main)]'}`} />
                  {isActive && <span className="absolute inset-0 rounded-2xl bg-primary/20 animate-pulse-slow pointer-events-none" />}
                </div>
                <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mt-1 hidden sm:block ${isActive ? 'text-primary' : 'text-[var(--color-text-dim)] group-hover:text-[var(--color-text-main)]'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Back to Top */}
      <button
        onClick={scrollToTop}
        className={`fixed right-6 bottom-32 md:bottom-8 z-[60] h-10 w-10 bg-primary rounded-full flex items-center justify-center text-white shadow-glow-primary transition-all duration-300 transform ${showBackToTop ? "scale-100 opacity-100 translate-y-0" : "scale-0 opacity-0 translate-y-10"
          } hover:scale-110 active:scale-95`}
        aria-label="Back to top"
      >
        <ChevronUpIcon className="h-5 w-5" />
      </button>

      {/* Drawers */}
      <Drawer title="Izmjena kompanije" isOpen={activeDrawer === "company"} onClose={() => setActiveDrawer(null)}>
        <div className="space-y-2">
          {user?.companies.map((company) => (
            <button
              key={company.id}
              onClick={() => {
                onCompanyChange(company);
                setActiveDrawer(null);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedCompany?.id === company.id ? "border-primary bg-primary/10 ring-1 ring-primary/20" : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]"
                }`}
            >
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center font-black text-xs shadow-glow-primary shrink-0 ${selectedCompany?.id === company.id ? "bg-primary text-white" : "bg-[var(--color-border)] text-[var(--color-text-dim)]"}`}>
                {company.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="text-left min-w-0">
                <p className="text-sm font-black text-[var(--color-text-main)] leading-none mb-1 truncate">{company.name}</p>
                <p className="text-[10px] font-black text-[var(--color-text-dim)] uppercase tracking-widest">VAT: {company.vat_number}</p>
              </div>
            </button>
          ))}
        </div>
      </Drawer>

      <Drawer title="Moj nalog" isOpen={activeDrawer === 'user'} onClose={() => setActiveDrawer(null)}>
        <div className="flex items-center gap-4 p-4 bg-[var(--color-surface)] rounded-2xl mb-4 border border-[var(--color-border)] relative overflow-hidden">
          <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center text-white font-black text-lg shadow-glow-primary shrink-0 z-10">
            {user?.first_name[0]}{user?.last_name[0]}
          </div>
          <div className="z-10">
            <p className="font-black text-base text-[var(--color-text-main)] leading-tight italic tracking-tight">{user?.first_name} {user?.last_name}</p>
            <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider mt-0.5">{user?.email}</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <button
            onClick={() => {
              setActiveDrawer(null);
              navigate("/profile");
            }}
            className="w-full text-left p-3.5 text-xs font-black uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-hover)] rounded-xl transition-all flex items-center gap-3 border border-transparent hover:border-[var(--color-border)] group cursor-pointer"
          >
            <div className="h-7 w-7 bg-[var(--color-border)] rounded-lg flex items-center justify-center text-[var(--color-text-dim)] group-hover:text-primary transition-colors">
              <UserIcon className="h-4 w-4" />
            </div>
            Moj Profil
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-left p-3.5 text-xs font-black uppercase tracking-widest text-red-400/80 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all flex items-center gap-3 border border-transparent hover:border-red-400/20 group cursor-pointer"
          >
            <div className="h-7 w-7 bg-red-400/10 rounded-lg flex items-center justify-center text-red-400 transition-colors">
              <ChevronRightIcon className="h-4 w-4" />
            </div>
            Odjavi se
          </button>
        </div>
      </Drawer>

      <Drawer title="Podešavanja" isOpen={activeDrawer === 'settings'} onClose={() => setActiveDrawer(null)}>
        <div className="flex flex-col gap-3">
          {/* Subscription / License Status - horizontal bar dizajn */}
          <div className={`relative overflow-hidden rounded-xl transition-all flex items-center gap-3 px-4 py-3 ${
            hasSubNotification
              ? 'bg-gradient-to-r from-red-500/15 via-red-500/10 to-transparent border-l-4 border-red-500'
              : subInfo.isLifetime
                ? 'bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent border-l-4 border-emerald-500'
                : 'bg-[var(--color-surface)] border-l-4 border-[var(--color-border)]'
          }`}>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              hasSubNotification
                ? 'bg-red-500/25 text-red-400'
                : subInfo.isLifetime
                  ? 'bg-emerald-500/25 text-emerald-400'
                  : 'bg-primary/15 text-primary'
            }`}>
              <BoxesIcon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)]">Licenca</span>
              <p className={`text-sm font-bold truncate ${
                hasSubNotification
                  ? 'text-red-400'
                  : subInfo.isLifetime
                    ? 'text-emerald-400'
                    : 'text-[var(--color-text-main)]'
              }`}>
                {subInfo.isLifetime
                  ? "Lifetime Plan"
                  : hasSubNotification
                    ? `Ističe za ${subInfo.daysLeft} dana`
                    : `Važi do ${subInfo.label}`
                }
              </p>
            </div>
            {subInfo.isLifetime && (
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md shrink-0">
                ∞
              </span>
            )}
            {hasSubNotification && (
              <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse shrink-0" />
            )}
          </div>

          {/* Settings Navigation */}
          <button
            onClick={() => {
              setActiveDrawer(null);
              navigate("/settings/company");
            }}
            className="group relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 transition-all hover:border-primary/30 flex items-center gap-4 overflow-hidden cursor-pointer shadow-glow-primary/5"
          >
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <Building2Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-sm font-bold text-[var(--color-text-main)] group-hover:text-primary transition-colors">Profil kompanije</h3>
              <p className="text-[10px] text-[var(--color-text-dim)] leading-tight">Podaci o firmi, adresa i JIB/PIB</p>
            </div>
            <ChevronRightIcon className="h-4 w-4 text-[var(--color-text-muted)] group-hover:text-primary transition-colors" />
          </button>

          <button
            onClick={() => {
              setActiveDrawer(null);
              navigate("/settings/general");
            }}
            className="group relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 transition-all hover:border-primary/30 flex items-center gap-4 overflow-hidden cursor-pointer"
          >
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <CogIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-sm font-bold text-[var(--color-text-main)] group-hover:text-primary transition-colors">Generalno</h3>
              <p className="text-[10px] text-[var(--color-text-dim)] leading-tight">Postavke kompanije i faktura</p>
            </div>
            <ChevronRightIcon className="h-4 w-4 text-[var(--color-text-muted)] group-hover:text-primary transition-colors" />
          </button>

          <button
            onClick={() => {
              setActiveDrawer(null);
              navigate("/settings/bank-accounts");
            }}
            className="group relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 transition-all hover:border-primary/30 flex items-center gap-4 overflow-hidden cursor-pointer"
          >
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <CreditCardIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-sm font-bold text-[var(--color-text-main)] group-hover:text-primary transition-colors">Bankovni Računi</h3>
              <p className="text-[10px] text-[var(--color-text-dim)] leading-tight">Upravljanje računima za isplatu</p>
            </div>
            <ChevronRightIcon className="h-4 w-4 text-[var(--color-text-muted)] group-hover:text-primary transition-colors" />
          </button>

          <button
            onClick={() => {
              setActiveDrawer(null);
              navigate("/settings/currencies");
            }}
            className="group relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 transition-all hover:border-primary/30 flex items-center gap-4 overflow-hidden cursor-pointer"
          >
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <CurrencyEuroIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-sm font-bold text-[var(--color-text-main)] group-hover:text-primary transition-colors">Valute</h3>
              <p className="text-[10px] text-[var(--color-text-dim)] leading-tight">Konfiguracija valuta i formata</p>
            </div>
            <ChevronRightIcon className="h-4 w-4 text-[var(--color-text-muted)] group-hover:text-primary transition-colors" />
          </button>

          <button
            onClick={() => {
              setActiveDrawer(null);
              navigate("/settings/fiscal");
            }}
            className="group relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 transition-all hover:border-primary/30 flex items-center gap-4 overflow-hidden cursor-pointer"
          >
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <FileTextIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-sm font-bold text-[var(--color-text-main)] group-hover:text-primary transition-colors">Fiskalizacija</h3>
              <p className="text-[10px] text-[var(--color-text-dim)] leading-tight">OFS ESIR – cloud ili lokalni uređaj</p>
            </div>
            <ChevronRightIcon className="h-4 w-4 text-[var(--color-text-muted)] group-hover:text-primary transition-colors" />
          </button>
        </div>
      </Drawer>
    </div>
  );
}
