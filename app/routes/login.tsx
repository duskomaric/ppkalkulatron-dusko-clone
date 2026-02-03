import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { login } from "~/api/auth";
import { useAuth } from "~/hooks/useAuth";
import { CalculatorIcon, ChevronRightIcon, MailIcon, LockIcon } from "~/components/ui/icons";
import { getThemeByPath } from "~/utils/theme";
import { Toast, type ToastType } from "~/components/ui/Toast";
import { Input } from "~/components/ui/Input";
import { getPageTitle, APP_CONFIG } from "~/config/app";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isShaking, setIsShaking] = useState(false);

    // Toast state
    const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
        message: "",
        type: "error",
        isVisible: false,
    });

    const navigate = useNavigate();
    const location = useLocation();
    const { loginAction, isAuthenticated, loading } = useAuth();

    // Get dynamic color based on path (/)
    const currentRGB = getThemeByPath(location.pathname);

    // Set document title
    useEffect(() => {
        document.title = getPageTitle("Login");
    }, []);

    // Redirect if already logged in
    useEffect(() => {
        if (!loading && isAuthenticated) {
            navigate("/invoices");
        }
    }, [isAuthenticated, loading, navigate]);

    const showToast = (message: string, type: ToastType) => {
        setToast({ message, type, isVisible: true });
    };

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const data = await login(email, password);
            loginAction(data.token, data.user);
            navigate("/invoices");
        } catch (err: any) {
            showToast(err.message || "Proverite vezu sa serverom", "error");
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen bg-[#0B0B0F] flex flex-col lg:flex-row relative overflow-hidden font-sans"
            style={{
                "--primary-base": currentRGB,
                "--color-primary": `rgb(${currentRGB})`,
                "--color-primary-hover": `color-mix(in srgb, rgb(${currentRGB}), white 20%)`,
                "--shadow-glow-primary": `0 0 20px 2px rgba(${currentRGB}, 0.4)`
            } as React.CSSProperties}
        >
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />

            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="glow-ball glow-ball-primary top-[-120px] left-[-120px] opacity-40"></div>
                <div className="glow-ball glow-ball-secondary bottom-[-80px] right-[-80px] opacity-20"></div>
                <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full"></div>
            </div>

            {/* LEFT SIDE: Brand Icon */}
            <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center z-10">
                <div className="relative">
                    <div className="absolute inset-[-40px] bg-primary/20 blur-[120px] rounded-full animate-pulse-slow"></div>
                    <div className={`relative transform transition-all duration-1000 ease-out ${isShaking ? "shake-it" : "-rotate-12 hover:rotate-0 hover:scale-105"}`}>
                        <div className="h-56 w-56 bg-[#0F0F13]/80 backdrop-blur-3xl border border-white/10 rounded-[48px] flex items-center justify-center shadow-[0_40px_100px_-24px_rgba(0,0,0,0.8)] relative overflow-hidden group">
                            {/* Inner Gloss */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>

                            <CalculatorIcon
                                className="h-28 w-28 text-primary drop-shadow-[0_0_20px_rgba(var(--primary-base),0.6)] transition-all duration-700"
                            />

                            {/* Decorative details */}
                            <div className="absolute top-8 left-8 w-2 h-2 rounded-full bg-white/10"></div>
                            <div className="absolute bottom-8 right-8 w-2 h-2 rounded-full bg-white/10"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: Form */}
            <div className="flex-grow lg:w-1/2 flex items-center justify-center px-4 sm:px-12 lg:px-24 z-10 py-12">
                <div className="w-full max-w-md">
                    <div className="text-center mb-10">
                        <div className={`lg:hidden mx-auto h-20 w-20 bg-[#0F0F13] border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl mb-8 transition-all duration-1000 ease-out ${isShaking ? "shake-it" : "-rotate-6 hover:rotate-0"}`}>
                            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-3xl opacity-50"></div>
                            <CalculatorIcon className="h-10 w-10 text-primary relative z-10" />
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter mb-2 italic">
                            Prijavite se<span className="text-primary">.</span>
                        </h1>
                        <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px]">{APP_CONFIG.name}</p>
                        <div className="flex items-center justify-center gap-2 mt-1">
                            <div className="h-1 w-8 bg-white/10 rounded-full"></div>
                            <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-[10px]">Verzija {APP_CONFIG.version}</p>
                            <div className="h-1 w-8 bg-white/10 rounded-full"></div>
                        </div>
                    </div>

                    <div className="bg-[#0F0F13]/60 backdrop-blur-3xl rounded-[40px] border border-white/10 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.6)] p-8 sm:p-12 relative overflow-hidden">
                        {/* Box Decoration */}
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <CalculatorIcon className="h-32 w-32 text-white" />
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                            <Input
                                label="E-mail adresa"
                                type="email"
                                required
                                icon={MailIcon}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="vaš@email.com"
                            />

                            <div className="space-y-2">
                                <Input
                                    label="Lozinka"
                                    type="password"
                                    required
                                    icon={LockIcon}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                                <div className="flex justify-end pt-1">
                                    <button type="button" className="cursor-pointer text-[10px] font-black uppercase tracking-widest text-primary/80 hover:text-white transition-all hover:tracking-[0.25em]">
                                        Zaboravili ste lozinku?
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`group cursor-pointer w-full py-5 rounded-[22px] font-black text-white text-[13px] uppercase tracking-[0.25em] bg-primary relative overflow-hidden transition-all duration-500 mt-6 flex items-center justify-center ${isLoading
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:-translate-y-1 active:scale-95 shadow-[0_20px_40px_-12px_rgba(var(--primary-base),0.4)]"
                                    }`}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                                {isLoading ? (
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>Prijavite se</span>
                                        <ChevronRightIcon
                                            className="h-5 w-5 ml-3 transition-transform duration-500 group-hover:translate-x-3"
                                        />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
