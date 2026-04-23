import { useState, useEffect, useCallback, useRef } from "react";
import type { User } from "~/types/user";
import type { Company } from "~/types/company";
import { fetchApi } from "~/utils/api";
import { invalidateMeCache } from "~/api/config";

const STORAGE_KEYS = {
  token: "auth_token",
  user: "auth_user",
  company: "selected_company",
} as const;

export function useAuth() {
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

        if (savedCompany) {
          setSelectedCompany(JSON.parse(savedCompany));
        } else if (parsedUser.companies?.length > 0) {
          const first = parsedUser.companies[0];
          localStorage.setItem(STORAGE_KEYS.company, JSON.stringify(first));
          setSelectedCompany(first);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEYS.token);
        localStorage.removeItem(STORAGE_KEYS.user);
        localStorage.removeItem(STORAGE_KEYS.company);
      }
    }
    setLoading(false);
  }, []);

  const loginAction = (newToken: string, newUser: User) => {
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
  };

  const logoutAction = () => {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem(STORAGE_KEYS.company);
    setToken(null);
    setUser(null);
    setSelectedCompany(null);
  };

  const updateSelectedCompany = (company: Company) => {
    localStorage.setItem(STORAGE_KEYS.company, JSON.stringify(company));
    setSelectedCompany(company);
  };

  const updateUserAction = (updatedUser: User) => {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(updatedUser));
    setUser(updatedUser);

    // Keep selected company in sync with fresh data
    const current = selectedCompanyRef.current;
    if (current && updatedUser.companies) {
      const fresh = updatedUser.companies.find(c => c.id === current.id);
      if (fresh) {
        localStorage.setItem(STORAGE_KEYS.company, JSON.stringify(fresh));
        setSelectedCompany(fresh);
      }
    }
  };

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

  return {
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
  };
}
