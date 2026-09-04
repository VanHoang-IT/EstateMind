import { authFetch, throwIfNotOk } from "@/lib/api";

export type VerificationRole = "ROLE_CUSTOMER" | "ROLE_SELLER";

export interface VerificationQueueItem {
  userId: number;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  role: VerificationRole;
  address?: string | null;
  identityNumber?: string | null;
  bio?: string | null;
  companyName?: string | null;
  companyTaxCode?: string | null;
  updatedAt?: string | null;
}

export const adminVerificationService = {
  async getQueue(role?: VerificationRole): Promise<VerificationQueueItem[]> {
    const query = role ? `?role=${role}` : "";
    const res = await authFetch(`/secure/admin/verifications${query}`, {
      cache: "no-store",
    });
    await throwIfNotOk(res);
    return res.json();
  },

  async approve(userId: number): Promise<void> {
    const res = await authFetch(
      `/secure/admin/verifications/${userId}/approve`,
      { method: "PATCH" },
    );
    await throwIfNotOk(res);
  },

  async reject(userId: number): Promise<void> {
    const res = await authFetch(
      `/secure/admin/verifications/${userId}/reject`,
      { method: "PATCH" },
    );
    await throwIfNotOk(res);
  },
};
