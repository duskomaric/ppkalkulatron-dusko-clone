import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router";
import { useAuth } from "~/hooks/useAuth";
import { 
  CalculatorIcon, 
  CogIcon, 
  UserIcon, 
  FileTextIcon, 
  ContactRoundIcon, 
  FileCheckIcon, 
  BoxesIcon, 
  FileSlidersIcon,
  ChevronUpIcon,
  ChevronRightIcon
} from "~/components/ui/icons";
import { Drawer } from "./Drawer";
import type { Company } from "~/types/company";

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
  const { user, logoutAction, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeDrawer, setActiveDrawer] = useState<"company" | "user" | "settings" | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

    const pageColors: Record<string, string> = {
        "/invoices": "245, 158, 11",  // Amber
        "/clients": "34, 197, 94",    // Green
        "/proformas": "168, 85, 247", // Purple
        "/quotes": "14, 165, 233",    // Blue
        "/articles": "244, 63, 94",   // Rose
    };

    const currentRGB = pageColors[location.pathname] || "34, 197, 94";

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    logoutAction();
    navigate("/");
  };

  if (loading) return null;

  const navItems = [
    { id: 'proformas', icon: FileCheckIcon, label: 'Proformas', path: '/proformas', title: 'Proforme' },
    { id: 'quotes', icon: FileSlidersIcon, label: 'Quotes', path: '/quotes', title: 'Ponude' },
    { id: 'invoices', icon: FileTextIcon, label: 'Invoices', path: '/invoices', title: 'Računi' },
    { id: 'clients', icon: ContactRoundIcon, label: 'Clients', path: '/clients', title: 'Klijenti' },
    { id: 'articles', icon: BoxesIcon, label: 'Articles', path: '/articles', title: 'Artikli' },
  ];

  return (
      <div
          className="min-h-screen bg-[#0B0B0F] flex flex-col pb-32 overflow-hidden relative"
          style={{
              /* 1. Primarna baza koju koriste tvoji custom CSS efekti */
              "--primary-base": currentRGB,

              /* 2. Forsiramo Tailwindov --color-primary da koristi ovu bazu */
              "--color-primary": `rgb(${currentRGB})`,

              /* 3. Forsiramo hover i ostale izvedene varijable */
              "--color-primary-hover": `color-mix(in srgb, rgb(${currentRGB}), white 20%)`,

              /* 4. Ažuriramo sjenke */
              "--shadow-glow-primary": `0 0 20px 2px rgba(${currentRGB}, 0.4)`
          } as React.CSSProperties}
      >
      {/* Background Effects */}
      <div className="glow-ball glow-ball-primary top-[-100px] left-[-100px]"></div>
      <div className="glow-ball glow-ball-secondary bottom-[-50px] right-[-50px]"></div>
      <div className="glow-ball bg-primary/10 w-[400px] h-[400px] top-[40%] left-[20%] blur-[120px] pointer-events-none absolute"></div>

      {/* Header */}
      <header className="sticky top-0 z-40 h-[64px] flex items-center bg-[#0B0B0F]/20 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-[1200px] w-full mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link 
              to="/invoices"
              className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-glow-primary cursor-pointer transition-all duration-500"
            >
              <CalculatorIcon className="h-6 w-6" />
            </Link>

            {selectedCompany && (
              <button
                onClick={() => setActiveDrawer("company")}
                className="cursor-pointer flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-xl transition-all border border-transparent"
              >
                <span className="text-sm font-bold text-white truncate max-w-[150px] sm:max-w-none">
                  {selectedCompany.name}
                </span>
                <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 9l-7 7-7-7" strokeWidth="2"/>
                </svg>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveDrawer("settings")}
              className="cursor-pointer h-10 w-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              <CogIcon className="h-6 w-6" />
            </button>
            <button
              onClick={() => setActiveDrawer("user")}
              className="cursor-pointer h-10 w-10 bg-white/5 text-gray-300 rounded-xl flex items-center justify-center font-bold text-sm border border-white/10 hover:border-primary transition-all"
            >
              <UserIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-[1200px] w-full mx-auto px-6 py-8 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">{title}</h1>
          {actions}
        </div>
        {children}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-5 md:bottom-6 flex justify-center pointer-events-auto">
        <nav className="bg-black/50 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/60 px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-around gap-3 sm:gap-6 w-full max-w-md sm:max-w-lg">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.id}
                to={item.path}
                title={item.title}
                className={`cursor-pointer group flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'scale-110 sm:scale-125 -translate-y-1' : 'hover:scale-110'}`}
              >
                <div className={`relative p-3 sm:p-3.5 rounded-2xl transition-all duration-300 ${isActive ? 'bg-primary/25 shadow-glow-primary ring-1 ring-primary/40' : 'bg-white/5 group-hover:bg-white/10'}`}>
                  <Icon className={`h-7 w-7 sm:h-8 sm:w-8 ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-200'}`} />
                  {isActive && <span className="absolute inset-0 rounded-2xl bg-primary/20 animate-pulse-slow pointer-events-none" />}
                </div>
                <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mt-1 hidden sm:block ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-200'}`}>
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
        className={`fixed right-6 bottom-32 z-[60] h-12 w-12 bg-primary rounded-full flex items-center justify-center text-white shadow-glow-primary transition-all duration-300 transform ${
          showBackToTop ? "scale-100 opacity-100 translate-y-0" : "scale-0 opacity-0 translate-y-10"
        } hover:scale-110 active:scale-95`}
        aria-label="Back to top"
      >
        <ChevronUpIcon className="h-6 w-6" />
      </button>

      {/* Drawers */}
      <Drawer title="Switch Company" isOpen={activeDrawer === "company"} onClose={() => setActiveDrawer(null)}>
        <div className="space-y-3">
          {user?.companies.map((company) => (
            <button
              key={company.id}
              onClick={() => {
                onCompanyChange(company);
                setActiveDrawer(null);
              }}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                selectedCompany?.id === company.id ? "border-primary bg-primary/10 ring-1 ring-primary/20" : "border-white/5 bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold text-sm shadow-glow-primary ${selectedCompany?.id === company.id ? "bg-primary text-white" : "bg-[#1C1C26] text-gray-500"}`}>
                {company.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="text-left flex-1">
                <p className="text-base font-bold text-white leading-none mb-1">{company.name}</p>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">VAT: {company.vat_number}</p>
              </div>
            </button>
          ))}
        </div>
      </Drawer>

      <Drawer title="My Account" isOpen={activeDrawer === 'user'} onClose={() => setActiveDrawer(null)}>
        <div className="flex items-center gap-4 p-5 bg-white/5 rounded-2xl mb-6 border border-white/5">
          <div className="h-14 w-14 bg-primary rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-glow-primary">
            {user?.first_name[0]}{user?.last_name[0]}
          </div>
          <div>
            <p className="font-bold text-lg text-white leading-tight">{user?.first_name} {user?.last_name}</p>
            <p className="text-sm text-gray-500 font-medium">{user?.email}</p>
          </div>
        </div>
        <div className="space-y-2">
          <button className="w-full text-left p-4 text-sm font-bold text-gray-300 hover:bg-white/5 rounded-2xl transition-all flex items-center gap-4 border border-transparent hover:border-white/5">
            <div className="h-8 w-8 bg-white/5 rounded-lg flex items-center justify-center text-gray-500 group-hover:text-primary transition-colors">
              <UserIcon className="h-5 w-5" />
            </div>
            My Profile
          </button>
          <button 
            onClick={handleLogout}
            className="w-full text-left p-4 text-sm font-bold text-red-400 hover:bg-red-400/5 rounded-2xl transition-all flex items-center gap-4 border border-transparent hover:border-red-400/20"
          >
            <div className="h-8 w-8 bg-red-400/10 rounded-lg flex items-center justify-center text-red-400 transition-colors">
              <ChevronRightIcon className="h-5 w-5" />
            </div>
            Sign Out
          </button>
        </div>
      </Drawer>

      <Drawer title="Settings" isOpen={activeDrawer === 'settings'} onClose={() => setActiveDrawer(null)}>
        <div className="grid grid-cols-2 gap-4">
          <button className="p-6 bg-white/5 border border-white/5 rounded-[24px] text-center hover:border-primary/50 hover:bg-primary/5 transition-all group">
            <div className="h-12 w-12 bg-[#1C1C26] rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-500 group-hover:text-primary shadow-sm transition-all border border-white/5">
              <CogIcon className="h-6 w-6" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-white">General</span>
          </button>
          <button className="p-6 bg-white/5 border border-white/5 rounded-[24px] text-center hover:border-primary/50 hover:bg-primary/5 transition-all group">
            <div className="h-12 w-12 bg-[#1C1C26] rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-500 group-hover:text-primary shadow-sm transition-all border border-white/5">
              <BoxesIcon className="h-6 w-6" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-white">Billing</span>
          </button>
        </div>
      </Drawer>
    </div>
  );
}
