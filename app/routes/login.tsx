import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { login } from "~/api/auth";
import { useAuth } from "~/hooks/useAuth";
import {CalculatorIcon, ChevronRightIcon, XIcon} from "~/components/ui/icons";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const { loginAction, isAuthenticated, loading } = useAuth();

    // Redirect if already logged in
    useEffect(() => {
        if (!loading && isAuthenticated) {
            navigate("/invoices");
        }
    }, [isAuthenticated, loading, navigate]);

    // Automatski sakrij grešku nakon 5 sekundi
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(""), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const [isShaking, setIsShaking] = useState(false);

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const data = await login(email, password);
            loginAction(data.token, data.user);
            navigate("/invoices");
        } catch (err: any) {
            setError(err.message || "Proverite vezu sa serverom");
            // OKIDAČ:
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500); // gasi nakon pola sekunde
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0B0F] flex flex-col lg:flex-row relative overflow-hidden font-sans">

            {/* --- ERROR TOAST --- */}
            <div className={`fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 transform 
    w-[calc(100%-2rem)] max-w-md md:w-auto
    ${error ? "translate-y-0 opacity-100" : "-translate-y-20 opacity-0 pointer-events-none"}`}
            >
                <div className="bg-red-500/15 backdrop-blur-2xl border border-red-500/20 p-4 md:px-6 md:py-4 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.2)] flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {/* Ikona - smanjena na mobilnom */}
                        <div
                            className="h-8 w-8 min-w-[2rem] bg-red-500 rounded-full flex items-center justify-center text-white">
                            <XIcon className="h-5 w-5" />
                        </div>

                        <div className="overflow-hidden">
                            <p className="text-white font-bold text-sm leading-none truncate">Greška</p>
                            <p className="text-red-400 text-xs mt-1 font-medium break-words line-clamp-2">
                                {error}
                            </p>
                        </div>
                    </div>

                    {/* Dugme za zatvaranje - veći touch target na mobilnom */}
                    <button
                        onClick={() => setError("")}
                        className="p-2 -mr-2 text-gray-500 hover:text-white transition-colors"
                        aria-label="Zatvori"
                    >
                        <XIcon className="h-5 w-5 md:h-4 md:w-4" />
                    </button>
                </div>
            </div>

            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="glow-ball glow-ball-primary top-[-120px] left-[-120px]"></div>
                <div className="glow-ball glow-ball-secondary bottom-[-80px] right-[-80px]"></div>
                {/*<div className="glow-ball bg-purple-600/10 w-[600px] h-[600px] top-[20%] left-[10%] blur-[140px]"></div>*/}
            </div>

            {/* LEFT SIDE: Brand Icon */}
            <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center z-10">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full animate-pulse-slow"></div>
                    <div className={`relative transform transition-all duration-700 ${isShaking ? "shake-it" : "-rotate-12 hover:rotate-0"}`}>
                        <div className="h-48 w-48 bg-[#16161E] border border-white/10 rounded-[40px] flex items-center justify-center shadow-2xl group-hover:shadow-primary/20 transition-all">
                            <CalculatorIcon
                                className="h-24 w-24 text-primary drop-shadow-[0_0_15px_rgba(var(--primary-base),0.5)] transition-all duration-700"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: Form */}
            <div className="flex-grow lg:w-1/2 flex items-center justify-center px-4 sm:px-12 lg:px-24 z-10 py-12">
                <div className="w-full max-w-md">
                    <div className="text-center mb-10">
                        <div className={`lg:hidden mx-auto h-16 w-16 bg-primary rounded-2xl flex items-center justify-center shadow-glow-primary mb-6 transition-all duration-300 ${isShaking ? "shake-it" : "-rotate-6 hover:rotate-0"}`}>
                            <CalculatorIcon className="h-10 w-10 text-white" />
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter mb-2 italic">
                            Prijavite se<span className="text-primary">.</span>
                        </h1>
                        <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px]">++Kalkulatron</p>
                    </div>

                    <div className="bg-[#16161E]/60 backdrop-blur-2xl rounded-[32px] border border-white/5 shadow-2xl p-8 sm:p-10 relative">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 ml-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-gray-700 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-300"
                                    placeholder="info@ppkalkulatron.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 ml-1">Lozinka</label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-gray-700 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-300"
                                    placeholder="••••••••"
                                />
                                <div className="flex justify-end pt-1">
                                    <button type="button" className="cursor-pointer text-xs font-black uppercase tracking-widest text-primary hover:text-white transition-colors">
                                        Zaboravljena lozinka?
                                    </button>
                                </div>
                            </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`group cursor-pointer w-full py-5 rounded-2xl font-black text-white text-sm uppercase tracking-[0.2em] bg-primary hover:bg-primary-hover transition-all duration-300 mt-4 flex items-center justify-center ${
                                        isLoading
                                            ? "opacity-50 cursor-not-allowed"
                                            : "hover:-translate-y-1 active:scale-95 shadow-glow-primary" // Ovdje koristimo tvoju varijablu
                                    }`}
                                >
                                {isLoading ? (
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>Prijavite se</span>
                                        <ChevronRightIcon
                                            className="h-5 w-5 ml-2 transition-transform duration-300 group-hover:translate-x-2"
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