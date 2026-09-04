import { authFetch, throwIfNotOk } from "@/lib/api";

export interface Company {
  id: number;
  name: string;
  businessLicenseNumber?: string | null;
  taxCode?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  isVerified?: boolean | null;
}

export interface CreateCompanyInput {
  name: string;
  businessLicenseNumber?: string;
  taxCode?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface TaxLookupData {
  id: string;
  name: string;
  internationalName: string;
  shortName: string;
  address: string;
  status: string;
}

export interface TaxLookupResponse {
  code: string;
  desc: string;
  data: TaxLookupData | null;
}

export const companyService = {
  async lookupByTaxCode(taxCode: string): Promise<TaxLookupResponse> {
    const res = await fetch(`/api/tax-lookup/${taxCode}`, {
      cache: "no-store",
    });
    return res.json();
  },

  async createCompany(input: CreateCompanyInput): Promise<Company> {
    const res = await authFetch("/secure/companies", {
      method: "POST",
      body: JSON.stringify(input),
    });
    await throwIfNotOk(res);
    return res.json();
  },
};
