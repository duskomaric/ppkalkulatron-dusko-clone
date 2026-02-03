import {useNavigate} from "react-router";
import {useAuth} from "~/hooks/useAuth";
import {useEffect, useState, useCallback} from "react";
import {getInvoices} from "~/api/invoices";
import type {Invoice, StatusColor, InvoicesResponse} from "~/types/invoice";
import type {Company} from "~/types/company";
import {
    CogIcon,
    UserIcon,
    FileTextIcon,
    ContactRoundIcon,
    FileCheckIcon,
    BoxesIcon,
    FileSlidersIcon, ChevronRightIcon, ChevronLeftIcon, CalculatorIcon, HashIcon, Calendar1Icon, Clock1Icon,
} from "~/components/ui/icons";
import {ChevronUpIcon} from "~/components/ui/icons/ChevronUpIcon";

export default function InvoicesPage() {
    const {user, token, logoutAction, isAuthenticated, loading: authLoading} = useAuth();
    const navigate = useNavigate();

    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [pagination, setPagination] = useState<InvoicesResponse["meta"] | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [activeDrawer, setActiveDrawer] = useState<"company" | "user" | "settings" | null>(null);

    const [showBackToTop, setShowBackToTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Dugme se pojavljuje tek nakon što korisnik skrola 300px prema dole
            setShowBackToTop(window.scrollY > 300);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        if (user && user.companies.length > 0 && !selectedCompany) {
            setSelectedCompany(user.companies[0]);
        }
    }, [user, selectedCompany]);

    const fetchInvoices = useCallback(async (page: number = 1) => {
        if (!selectedCompany || !token) return;
        setLoading(true);
        try {
            const response = await getInvoices(selectedCompany.slug, token, page);
            setInvoices(response.data);
            setPagination(response.meta);
            setCurrentPage(page);
        } catch (error) {
            console.error("Greška pri dohvatanju računa:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedCompany, token]);

    // Refetch kad se promijeni kompanija ili stranica
    useEffect(() => {
        if (isAuthenticated && selectedCompany) {
            fetchInvoices(currentPage);
        }
    }, [isAuthenticated, selectedCompany, currentPage, fetchInvoices]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated, authLoading, navigate]);

    if (authLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0B0B0F]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const handleLogout = () => {
        logoutAction();
        navigate("/");
    };

    const statusColors: Record<StatusColor, string> = {
        green: "bg-green-500/10 text-green-400 border-green-500/20",
        gray: "bg-gray-500/10 text-gray-400 border-gray-500/20",
        red: "bg-red-500/10 text-red-400 border-red-500/20",
    };

    const Drawer = ({title, children, isOpen, onClose}: any) => {
        if (!isOpen) return null;
        return (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
                <div
                    className="relative w-full max-w-lg bg-[#16161E] rounded-t-[32px] sm:rounded-[24px] shadow-2xl overflow-hidden animate-slide-in-bottom border-t border-white/5">
                    <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">{title}</h2>
                        <button onClick={onClose}
                                className="h-10 w-10 flex items-center justify-center bg-white/5 rounded-full text-gray-400">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5"/>
                            </svg>
                        </button>
                    </div>
                    <div className="p-6">{children}</div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#0B0B0F] flex flex-col pb-32 overflow-hidden relative">
            {/* Glowing Balls */}
            <div className="glow-ball glow-ball-primary top-[-100px] left-[-100px]"></div>
            <div className="glow-ball glow-ball-secondary bottom-[-50px] right-[-50px]"></div>
            <div className="glow-ball bg-purple-600/10 w-[400px] h-[400px] top-[40%] left-[20%] blur-[120px]"></div>

            {/* Header */}
            <header className="sticky top-0 z-40 h-[64px] flex items-center">
                <div className="max-w-[1200px] w-full mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div
                            className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-glow-pimary cursor-pointer"
                            onClick={() => navigate("/invoices")}
                        >
                            <CalculatorIcon className="h-8 w-8" />
                        </div>

                        {selectedCompany && (
                            <button
                                onClick={() => setActiveDrawer("company")}
                                className="cursor-pointer flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-xl transition-all border border-transparent"
                            >
                                <span className="text-sm font-bold text-white">{selectedCompany.name}</span>
                                <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor"
                                     viewBox="0 0 24 24">
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
                            <CogIcon className="h-6 w-6 text-gray-400"/>
                        </button>
                        <button
                            onClick={() => setActiveDrawer("user")}
                            className="cursor-pointer h-10 w-10 bg-white/5 text-gray-300 rounded-xl flex items-center justify-center font-bold text-sm border border-white/10 hover:border-primary transition-all"
                        >
                            <UserIcon className="h-6 w-6 text-gray-400"/>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow max-w-[1200px] w-full mx-auto px-6 py-8 relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Invoices</h1>
                    </div>
                    <div
                        className="cursor-pointer h-10 w-10 bg-white/5 text-primary rounded-xl flex items-center justify-center font-bold text-sm border border-white/10 hover:border-primary transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14"/>
                            <path d="M12 5v14"/>
                        </svg>
                    </div>
                </div>

                <div className="space-y-4">
                    {invoices.map((inv) => (
                        <div
                            key={inv.id}
                            className="group cursor-pointer bg-[#16161E]/80 backdrop-blur-xl border border-white/5 rounded-xl transition-all duration-500 hover:bg-[#1C1C26] hover:border-primary/40 p-3.5 flex flex-col gap-3 relative overflow-hidden"
                            style={{
                                // Dinamička sjenka koja prati tvoju primary boju
                                boxShadow: '0 8px 30px rgba(var(--primary-base), 0.1)'
                            }}
                        >
                            {/* Gornji dio: Broj i Status */}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <HashIcon className="w-3.5 h-3.5 text-primary" />
                                    <span className="text-lg font-black text-white tracking-tighter italic leading-none">
                {inv.invoice_number}
            </span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border backdrop-blur-md ${statusColors[inv.status_color]}`}>
            {inv.status_label}
        </span>
                            </div>

                            {/* Srednji dio: Klijent - Bez margina, čisto poravnato */}
                            <div className="flex items-center gap-2">
                                <ContactRoundIcon className="w-3.5 h-3.5 text-gray-500" />
                                <span className="text-xs font-bold text-gray-400 tracking-tight truncate">
            {inv.client.name}
        </span>
                            </div>

                            {/* Separator */}
                            <div className="h-[1px] w-full bg-white/5" />

                            {/* Donji dio: Datumi i Iznos */}
                            <div className="flex justify-between items-end">
                                <div className="flex gap-5">
                                    {/* Datum - Poravnato uz ikonu, tekst ispod ikone */}
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5 text-gray-600">
                                            <Calendar1Icon className="w-3 h-3" />
                                            <span className="text-[8px] font-black uppercase">Datum</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-300">{inv.date}</p>
                                    </div>

                                    {/* Dospijeće */}
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5 text-gray-600">
                                            <Clock1Icon className="w-3 h-3" />
                                            <span className="text-[8px] font-black uppercase">Rok</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-red-400/80">{inv.due_date}</p>
                                    </div>
                                </div>

                                {/* Total - Desni fokus */}
                                <div className="text-right">
                                    <p className="text-xl font-black text-white tracking-tighter">
                                        {inv.total} <span className="text-primary text-[10px] italic">{inv.currency}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-center py-10">
                            <div
                                className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
                        </div>
                    )}

                    {!loading && invoices.length === 0 && (
                        <div className="py-20 text-center dark-card border-dashed">
                            <p className="text-gray-500 font-bold uppercase tracking-widest">No invoices found</p>
                        </div>
                    )}
                </div>

                {/* Paginacija */}
                {pagination && pagination.last_page > 1 && (
                    <div className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                        {/* Previous */}
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                            disabled={currentPage === 1 || loading}
                            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${currentPage === 1 || loading
                                ? "bg-white/5 text-gray-500 cursor-not-allowed border border-white/10"
                                : "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30"}`}>
                            <ChevronLeftIcon className="h-5 w-5"/>
                        </button>

                        {/* Brojevi stranica */}
                        {Array.from({length: pagination.last_page}, (_, i) => i + 1)
                            .filter((page) => page >= Math.max(1, currentPage - 2) && page <= Math.min(pagination.last_page, currentPage + 2))
                            .map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    disabled={loading}
                                    className={`
                    h-9 w-9 sm:h-10 sm:w-10 rounded-xl text-sm font-bold transition-all
                    ${page === currentPage
                                        ? "bg-primary text-white shadow-glow-pimary"
                                        : "bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10"}
                  `}
                                >
                                    {page}
                                </button>
                            ))}

                        {/* Next */}
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(p + 1, pagination.last_page))}
                            disabled={currentPage === pagination.last_page || loading}
                            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${currentPage === pagination.last_page || loading
                                ? "bg-white/5 text-gray-500 cursor-not-allowed border border-white/10"
                                : "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30"}`}>
                            <ChevronRightIcon className="h-5 w-5"/>
                        </button>
                    </div>
                )}
            </main>

            {/* Bottom Navigation */}
            <div
                className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-5 md:bottom-6 flex justify-center pointer-events-auto">
                <nav
                    className="bg-black/50 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/60 px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-around gap-3 sm:gap-6 w-full max-w-md sm:max-w-lg">
                    {/* Proformas */}
                    <button title="Proformas"
                            className="cursor-pointer group flex flex-col items-center gap-1 transition-all duration-300 hover:scale-110">
                        <div
                            className="relative p-3 sm:p-3.5 rounded-2xl bg-white/5 group-hover:bg-white/10 transition-all duration-300">
                            <FileCheckIcon className="h-7 w-7 sm:h-8 sm:w-8 text-gray-400 group-hover:text-gray-200"/>
                        </div>
                        <span
                            className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mt-1 text-gray-400 group-hover:text-gray-200 hidden sm:block">
              Proformas
            </span>
                    </button>

                    {/* Quotes */}
                    <button title="Quotes"
                            className="cursor-pointer group flex flex-col items-center gap-1 transition-all duration-300 hover:scale-110">
                        <div
                            className="relative p-3 sm:p-3.5 rounded-2xl bg-white/5 group-hover:bg-white/10 transition-all duration-300">
                            <FileSlidersIcon className="h-7 w-7 sm:h-8 sm:w-8 text-gray-400 group-hover:text-gray-200"/>
                        </div>
                        <span
                            className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mt-1 text-gray-400 group-hover:text-gray-200 hidden sm:block">
              Quotes
            </span>
                    </button>

                    {/* Invoices – ACTIVE */}
                    <button title="Invoices" className="cursor-pointer group flex flex-col items-center gap-1 transition-all duration-300 scale-110 sm:scale-125 -translate-y-1">
                        <div className="relative p-3 sm:p-3.5 rounded-2xl bg-primary/25 shadow-glow-primary ring-1 ring-primary/40 transition-all duration-300">
                            <FileTextIcon className="h-7 w-7 sm:h-8 sm:w-8 text-primary"/>
                            <span className="absolute inset-0 rounded-2xl bg-primary/20 animate-pulse-slow pointer-events-none"/>
                        </div>
                        <span
                            className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mt-1 text-primary hidden sm:block">
              Invoices
            </span>
                    </button>

                    {/* Clients */}
                    <button title="Clients"
                            className="cursor-pointer group flex flex-col items-center gap-1 transition-all duration-300 hover:scale-110">
                        <div
                            className="relative p-3 sm:p-3.5 rounded-2xl bg-white/5 group-hover:bg-white/10 transition-all duration-300">
                            <ContactRoundIcon
                                className="h-7 w-7 sm:h-8 sm:w-8 text-gray-400 group-hover:text-gray-200"/>
                        </div>
                        <span
                            className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mt-1 text-gray-400 group-hover:text-gray-200 hidden sm:block">
              Clients
            </span>
                    </button>

                    {/* Articles */}
                    <button title="Articles"
                            className="cursor-pointer group flex flex-col items-center gap-1 transition-all duration-300 hover:scale-110">
                        <div
                            className="relative p-3 sm:p-3.5 rounded-2xl bg-white/5 group-hover:bg-white/10 transition-all duration-300">
                            <BoxesIcon className="h-7 w-7 sm:h-8 sm:w-8 text-gray-400 group-hover:text-gray-200"/>
                        </div>
                        <span
                            className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mt-1 text-gray-400 group-hover:text-gray-200 hidden sm:block">
              Articles
            </span>
                    </button>
                </nav>
            </div>

            <button
                onClick={scrollToTop}
                className={`fixed right-6 bottom-32 z-[60] h-12 w-12 bg-primary rounded-full flex items-center justify-center text-white shadow-glow-pimary transition-all duration-300 transform ${
                    showBackToTop ? "scale-100 opacity-100 translate-y-0" : "scale-0 opacity-0 translate-y-10"
                } hover:scale-110 active:scale-95`}
                aria-label="Back to top"
            >
                <ChevronUpIcon className="h-6 w-6" />
            </button>

            {/* Draweri – ostaju isti */}
            <Drawer title="Switch Company" isOpen={activeDrawer === "company"} onClose={() => setActiveDrawer(null)}>
                <div className="space-y-3">
                    {user?.companies.map((company) => (
                        <button
                            key={company.id}
                            onClick={() => {
                                setSelectedCompany(company);
                                setActiveDrawer(null);
                            }}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                                selectedCompany?.id === company.id ? "border-primary bg-primary/10 ring-1 ring-primary/20" : "border-white/5 bg-white/5 hover:bg-white/10"
                            }`}
                        >
                            <div
                                className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold text-sm shadow-glow-pimary ${
                                    selectedCompany?.id === company.id ? "bg-primary text-white" : "bg-[#1C1C26] text-gray-500"
                                }`}
                            >
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

            {/* Drawer: User Menu */}
            <Drawer title="My Account" isOpen={activeDrawer === 'user'} onClose={() => setActiveDrawer(null)}>
                <div className="flex items-center gap-4 p-5 bg-white/5 rounded-2xl mb-6 border border-white/5">
                    <div
                        className="h-14 w-14 bg-primary rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-glow-pimary">
                        {user?.first_name[0]}{user?.last_name[0]}
                    </div>
                    <div>
                        <p className="font-bold text-lg text-white leading-tight">{user?.first_name} {user?.last_name}</p>
                        <p className="text-sm text-gray-500 font-medium">{user?.email}</p>
                    </div>
                </div>
                <div className="space-y-2">
                    <button
                        className="w-full text-left p-4 text-sm font-bold text-gray-300 hover:bg-white/5 rounded-2xl transition-all flex items-center gap-4 border border-transparent hover:border-white/5">
                        <div
                            className="h-8 w-8 bg-white/5 rounded-lg flex items-center justify-center text-gray-500 group-hover:text-primary">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                      strokeWidth="2.5"/>
                            </svg>
                        </div>
                        My Profile
                    </button>
                    <button onClick={handleLogout}
                            className="w-full text-left p-4 text-sm font-bold text-red-400 hover:bg-red-400/5 rounded-2xl transition-all flex items-center gap-4 border border-transparent hover:border-red-400/20">
                        <div className="h-8 w-8 bg-red-400/10 rounded-lg flex items-center justify-center text-red-400">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                    strokeWidth="2.5"/>
                            </svg>
                        </div>
                        Sign Out
                    </button>
                </div>
            </Drawer>

            {/* Drawer: Settings */}
            <Drawer title="Settings" isOpen={activeDrawer === 'settings'} onClose={() => setActiveDrawer(null)}>
                <div className="grid grid-cols-2 gap-4">
                    <button
                        className="p-6 bg-white/5 border border-white/5 rounded-[24px] text-center hover:border-primary/50 hover:bg-primary/5 transition-all group">
                        <div
                            className="h-12 w-12 bg-[#1C1C26] rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-500 group-hover:text-primary shadow-sm transition-all border border-white/5">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                    strokeWidth="2"/>
                            </svg>
                        </div>
                        <span
                            className="text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-white">General</span>
                    </button>
                    <button
                        className="p-6 bg-white/5 border border-white/5 rounded-[24px] text-center hover:border-primary/50 hover:bg-primary/5 transition-all group">
                        <div
                            className="h-12 w-12 bg-[#1C1C26] rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400 group-hover:text-primary shadow-sm transition-all border border-white/5">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                    strokeWidth="2"/>
                            </svg>
                        </div>
                        <span
                            className="text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-white">Billing</span>
                    </button>
                </div>
            </Drawer>
        </div>
    );
}