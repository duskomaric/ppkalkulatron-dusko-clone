import { useState, useCallback, useEffect } from "react";
import { getClients } from "~/api/clients";
import { getArticles } from "~/api/articles";
import { getCurrencies } from "~/api/config";
import { getMe } from "~/api/config";
import type { Client } from "~/types/client";
import type { Article } from "~/types/article";
import type { SelectOption, Currency, CompanySettings } from "~/types/config";
import type { ToastType } from "~/components/ui/Toast";

interface DocumentReferenceData {
  clients: Client[];
  articles: Article[];
  currencies: Currency[];
  languages: SelectOption[];
  templates: SelectOption[];
  frequencies: SelectOption[];
  paymentTypes: SelectOption[];
  companySettings: CompanySettings | null;
  defaultCurrency: Currency | undefined;
}

/**
 * Fetches shared reference data needed by all document pages (invoices, quotes, proformas).
 * Avoids duplicating the same fetch + setState logic in each route file.
 */
export function useDocumentReferenceData(
  companySlug: string | undefined,
  token: string | null,
  isAuthenticated: boolean,
  showToast: (msg: string, type?: ToastType) => void,
): DocumentReferenceData & { fetchReferenceData: () => Promise<void> } {
  const [clients, setClients] = useState<Client[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [languages, setLanguages] = useState<SelectOption[]>([]);
  const [templates, setTemplates] = useState<SelectOption[]>([]);
  const [frequencies, setFrequencies] = useState<SelectOption[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<SelectOption[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [defaultCurrency, setDefaultCurrency] = useState<Currency | undefined>(undefined);

  const fetchReferenceData = useCallback(async () => {
    if (!companySlug || !token) return;
    try {
      const [clientsRes, articlesRes, currenciesRes, meRes] = await Promise.all([
        getClients(companySlug, token, 1),
        getArticles(companySlug, token, 1),
        getCurrencies(companySlug, token),
        getMe(token, companySlug),
      ]);
      setClients(clientsRes.data);
      setArticles(articlesRes.data);
      setCurrencies(currenciesRes.data);
      setLanguages(meRes.data.languages);
      setTemplates(meRes.data.templates);
      setFrequencies(meRes.data.frequencies);
      setPaymentTypes(meRes.data.payment_types || []);
      setCompanySettings(meRes.data.company_settings || null);
      const defCurr = currenciesRes.data.find((c: Currency) => c.is_default) || currenciesRes.data[0];
      setDefaultCurrency(defCurr);
    } catch (error: any) {
      showToast(error.message || "Greška pri učitavanju podataka", "error");
    }
  }, [companySlug, token]);

  useEffect(() => {
    if (isAuthenticated && companySlug) {
      fetchReferenceData();
    }
  }, [isAuthenticated, companySlug, fetchReferenceData]);

  return {
    clients, articles, currencies,
    languages, templates, frequencies, paymentTypes,
    companySettings, defaultCurrency, fetchReferenceData,
  };
}
