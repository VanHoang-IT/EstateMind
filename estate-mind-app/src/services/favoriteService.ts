import { Property } from "@/types/property";
import { authFetch, throwIfNotOk } from "@/lib/api";

export const favoriteService = {
  async getFavorites(): Promise<Property[]> {
    const res = await authFetch("/secure/favorites");
    await throwIfNotOk(res);
    return res.json();
  },

  async isFavorited(propertyId: number | string): Promise<boolean> {
    const res = await authFetch(`/secure/favorites/${propertyId}/check`);
    await throwIfNotOk(res);
    const data = await res.json();
    return !!data.favorited;
  },

  async addFavorite(propertyId: number | string): Promise<void> {
    const res = await authFetch(`/secure/favorites/${propertyId}`, { method: "POST" });
    await throwIfNotOk(res);
  },

  async removeFavorite(propertyId: number | string): Promise<void> {
    const res = await authFetch(`/secure/favorites/${propertyId}`, { method: "DELETE" });
    await throwIfNotOk(res);
  },
};
