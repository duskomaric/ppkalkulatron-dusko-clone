import { fetchApi } from "~/utils/api";
import type { Company } from "~/types/company";

export async function updateCompany(companyIdOrSlug: number | string, token: string, companyData: Partial<Company>): Promise<{ data: Company }> {
  return fetchApi<{ data: Company }>(`/companies/${companyIdOrSlug}`, {
    method: "PUT",
    token,
    body: JSON.stringify(companyData),
  });
}

export async function getCompany(companyIdOrSlug: number | string, token: string): Promise<{ data: Company }> {
  return fetchApi<{ data: Company }>(`/companies/${companyIdOrSlug}`, {
    method: "GET",
    token,
  });
}
