import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "~/types/user";
import type { Company } from "~/types/company";
import { fetchApi } from "~/utils/api";
import { invalidateMeCache } from "~/api/config";

const STORAGE_KEYS = {
    token: "auth_token",
    user: "auth_user",
    company: "selected_company",
} as const;

type AuthContextValue = {
    user: User | null;
    selectedCompany: Company | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    loginAction: (token: string, user: User) => void;
    logoutAction: () => void;
    updateUserAction: (user: User) => void;
    updateSelectedCompany: (company: Company) => void;
    refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Refs to avoid stale closures in refreshUser
    const selectedCompanyRef = useRef(selectedCompany);
    selectedCompanyRef.current = selectedCompany;

    // Hydrate from localStorage on mount
    useEffect(() => {
        const savedToken = localStorage.getItem(STORAGE_KEYS.token);
        const savedUser = localStorage.getItem(STORAGE_KEYS.user);
        const savedCompany = localStorage.getItem(STORAGE_KEYS.company);

        if (savedToken && savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                setToken(savedToken);
                setUser(parsedUser);

                const companies: Company[] = parsedUser.companies ?? [];
                const parsedCompany: Company | null = savedCompany ? JSON.parse(savedCompany) : null;
                // Prefer the fresh copy from the user payload; fall back to first company
                // if the stored one no longer belongs to the user.
                const resolved =
                    (parsedCompany && companies.find((c) => c.id === parsedCompany.id)) ??
                    parsedCompany ??
                    companies[0] ??
                    null;

                if (resolved) {
                    localStorage.setItem(STORAGE_KEYS.company, JSON.stringify(resolved));
                    setSelectedCompany(resolved);
                }
            } catch {
                localStorage.removeItem(STORAGE_KEYS.token);
                localStorage.removeItem(STORAGE_KEYS.user);
                localStorage.removeItem(STORAGE_KEYS.company);
            }
        }
        setLoading(false);
    }, []);

    const loginAction = useCallback((newToken: string, newUser: User) => {
        localStorage.setItem(STORAGE_KEYS.token, newToken);
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);

        // Auto-select first company
        if (newUser.companies?.length > 0) {
            const first = newUser.companies[0];
            localStorage.setItem(STORAGE_KEYS.company, JSON.stringify(first));
            setSelectedCompany(first);
        }
    }, []);

    const logoutAction = useCallback(() => {
        localStorage.removeItem(STORAGE_KEYS.token);
        localStorage.removeItem(STORAGE_KEYS.user);
        localStorage.removeItem(STORAGE_KEYS.company);
        setToken(null);
        setUser(null);
        setSelectedCompany(null);
    }, []);

    const updateSelectedCompany = useCallback((company: Company) => {
        localStorage.setItem(STORAGE_KEYS.company, JSON.stringify(company));
        setSelectedCompany(company);
    }, []);

    const updateUserAction = useCallback((updatedUser: User) => {
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(updatedUser));
        setUser(updatedUser);

        // Keep selected company in sync with fresh data
        const current = selectedCompanyRef.current;
        if (current && updatedUser.companies) {
            const fresh = updatedUser.companies.find((c) => c.id === current.id);
            if (fresh) {
                localStorage.setItem(STORAGE_KEYS.company, JSON.stringify(fresh));
                setSelectedCompany(fresh);
            }
        }
    }, []);

    /**
     * Fetch fresh user + companies from /{companySlug}/me endpoint.
     * Uses ref for selectedCompany to keep callback reference stable.
     */
    const refreshUser = useCallback(async () => {
        const company = selectedCompanyRef.current;
        if (!token || !company) return;
        try {
            const res = await fetchApi<{ data: { user: User } }>(`/${company.slug}/me`, { token });

            if (res?.data?.user) {
                const updatedUser = res.data.user;
                localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(updatedUser));
                setUser(updatedUser);

                // The user may have switched company while the request was in flight —
                // never write a stale company back to state/localStorage.
                if (selectedCompanyRef.current?.id !== company.id) return;

                const fresh = updatedUser.companies?.find((c: Company) => c.id === company.id);
                if (fresh) {
                    localStorage.setItem(STORAGE_KEYS.company, JSON.stringify(fresh));
                    setSelectedCompany(fresh);
                    invalidateMeCache(company.slug);
                }
            }
        } catch (e) {
            console.error("Failed to refresh user data", e);
        }
    }, [token]); // Only token as dep — selectedCompany accessed via ref

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            selectedCompany,
            token,
            isAuthenticated: !!token,
            loading,
            loginAction,
            logoutAction,
            updateUserAction,
            updateSelectedCompany,
            refreshUser,
        }),
        [
            user,
            selectedCompany,
            token,
            loading,
            loginAction,
            logoutAction,
            updateUserAction,
            updateSelectedCompany,
            refreshUser,
        ]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
