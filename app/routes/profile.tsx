import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/hooks/useAuth";
import { AppLayout } from "~/components/layout/AppLayout";
import { useTheme } from "~/components/ui/ThemeProvider";
import {
    UserIcon,
    CogIcon as SettingsIcon,
    MoonIcon,
    SunIcon,
    MonitorIcon,
    LogOutIcon,
    ChevronRightIcon,
    MailIcon,
    Building2Icon
} from "~/components/ui/icons";
import type { Company } from "~/types/company";

export default function ProfilePage() {
    const { user, logoutAction } = useAuth();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

    useEffect(() => {
        if (user && user.companies.length > 0 && !selectedCompany) {
            setSelectedCompany(user.companies[0]);
        }
    }, [user, selectedCompany]);

    const themes = [
        { id: "light", label: "Svijetla", icon: SunIcon },
        { id: "dark", label: "Tamna", icon: MoonIcon },
        { id: "system", label: "Sistemska", icon: MonitorIcon },
    ] as const;

    const handleLogout = () => {
        logoutAction();
        navigate("/");
    };

    return (
        <AppLayout
            title="Profil"
            selectedCompany={selectedCompany}
            onCompanyChange={setSelectedCompany}
        >
            <div className="space-y-6 pb-20">
                {/* User Info Card */}
                <div className="p-5 bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                        <UserIcon className="h-16 w-16 text-[var(--color-text-dim)]" />
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-glow-primary">
                            {user?.first_name.substring(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl font-black text-[var(--color-text-main)] tracking-tighter italic truncate">{user?.first_name} {user?.last_name}</h2>
                            <div className="flex items-center gap-1.5 text-[var(--color-text-dim)] mt-0.5">
                                <MailIcon className="h-3 w-3" />
                                <p className="text-[11px] font-bold tracking-tight truncate">{user?.email}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Theme Settings */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <SettingsIcon className="h-4 w-4 text-primary" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-dim)]">Postavke Teme</h3>
                    </div>

                    <div className="bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] p-1 flex items-center gap-1">
                        {themes.map((t) => {
                            const Icon = t.icon;
                            const isActive = theme === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setTheme(t.id)}
                                    className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl transition-all cursor-pointer ${isActive
                                        ? "bg-primary text-white shadow-glow-primary"
                                        : "text-[var(--color-text-dim)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-hover)]"
                                        }`}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">{t.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Account Actions */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <Building2Icon className="h-4 w-4 text-primary" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-dim)]">Račun</h3>
                    </div>

                    <div className="bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] overflow-hidden">
                        <button className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-surface-hover)] transition-all text-left cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-[var(--color-border)] rounded-lg flex items-center justify-center text-[var(--color-text-dim)]">
                                    <UserIcon className="h-4 w-4" />
                                </div>
                                <span className="text-[13px] font-bold text-[var(--color-text-muted)]">Uredi podatke</span>
                            </div>
                            <ChevronRightIcon className="h-4 w-4 text-[var(--color-text-dim)]" />
                        </button>
                        <div className="h-[1px] w-full bg-[var(--color-border)] mx-4" />
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-between p-4 hover:bg-red-500/10 transition-all text-left group cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                                    <LogOutIcon className="h-4 w-4" />
                                </div>
                                <span className="text-[13px] font-bold text-red-500">Odjavi se</span>
                            </div>
                            <ChevronRightIcon className="h-4 w-4 text-[var(--color-text-dim)]" />
                        </button>
                    </div>
                </div>

                {/* App Version Info */}
                <div className="text-center pt-4">
                    <p className="text-[8px] font-black text-[var(--color-text-dim)] uppercase tracking-[0.3em]">
                        Kalkulatron PWA v1.0.0
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
