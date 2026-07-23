import { Review, ReviewInput } from "@/types/review";
import { API_URL, authFetch, throwIfNotOk } from "@/lib/api";

export const reviewService = {
  async getReviewsByProperty(propertyId: number | string): Promise<Review[]> {
    const res = await fetch(`${API_URL}/properties/${propertyId}/reviews`, { cache: "no-store" });
    await throwIfNotOk(res);
    return res.json();
  },

  async createReview(input: ReviewInput): Promise<Review> {
    const res = await authFetch("/secure/reviews", {
      method: "POST",
      body: JSON.stringify(input),
    });
    await throwIfNotOk(res);
    return res.json();
  },

  async deleteReview(id: number | string): Promise<void> {
    const res = await authFetch(`/secure/reviews/${id}`, { method: "DELETE" });
    await throwIfNotOk(res);
  },
};
