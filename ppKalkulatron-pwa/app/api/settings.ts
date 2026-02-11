import { fetchApi } from "~/utils/api";
import type { CompanySettings, BankAccount, Currency } from "~/types/config";
export { getCurrencies } from "./config";

// --- Company Settings ---

export async function updateCompanySettings(companySlug: string, token: string, settings: Partial<CompanySettings>) {
    return fetchApi<{ data: { settings: CompanySettings } }>(`/${companySlug}/settings`, {
        method: "PATCH",
        body: JSON.stringify({ settings }),
        token,
    });
}

// --- Fiscal (OFS ESIR) ---

export async function testFiscalAttention(companySlug: string, token: string) {
    return fetchApi<{ success: boolean; message: string }>(`/${companySlug}/fiscal/test-attention`, { token });
}

export async function testFiscalSettings(companySlug: string, token: string) {
    return fetchApi<{ success: boolean; message: string; data?: { printer_name?: string; lpfr_url?: string } }>(
        `/${companySlug}/fiscal/test-settings`,
        { token }
    );
}

export async function testFiscalStatus(companySlug: string, token: string) {
    return fetchApi<{ success: boolean; message: string; data?: any }>(
        `/${companySlug}/fiscal/test-status`,
        { token }
    );
}

// --- Bank Accounts ---

export async function getBankAccounts(companySlug: string, token: string, page = 1) {
    return fetchApi<{ data: BankAccount[]; meta: any }>(`/${companySlug}/bank-accounts?page=${page}`, { token });
}

export async function createBankAccount(companySlug: string, token: string, data: Partial<BankAccount>) {
    return fetchApi<{ data: BankAccount }>(`/${companySlug}/bank-accounts`, {
        method: "POST",
        body: JSON.stringify(data),
        token,
    });
}

export async function updateBankAccount(companySlug: string, token: string, id: number, data: Partial<BankAccount>) {
    return fetchApi<{ data: BankAccount }>(`/${companySlug}/bank-accounts/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        token,
    });
}

export async function deleteBankAccount(companySlug: string, token: string, id: number) {
    return fetchApi(`/${companySlug}/bank-accounts/${id}`, {
        method: "DELETE",
        token,
    });
}

// --- Currencies ---

export async function createCurrency(companySlug: string, token: string, data: Partial<Currency>) {
    return fetchApi<{ data: Currency }>(`/${companySlug}/currencies`, {
        method: "POST",
        body: JSON.stringify(data),
        token,
    });
}

export async function updateCurrency(companySlug: string, token: string, id: number, data: Partial<Currency>) {
    return fetchApi<{ data: Currency }>(`/${companySlug}/currencies/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        token,
    });
}

export async function deleteCurrency(companySlug: string, token: string, id: number) {
    return fetchApi(`/${companySlug}/currencies/${id}`, {
        method: "DELETE",
        token,
    });
}
