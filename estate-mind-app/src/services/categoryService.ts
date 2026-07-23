import { Category } from "@/types/property";
import { API_URL, throwIfNotOk } from "@/lib/api";

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_URL}/categories`, { cache: "no-store" });
    await throwIfNotOk(res);
    return res.json();
  },
};
