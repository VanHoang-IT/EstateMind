import { Property } from "@/types/property";
import { PageResponse } from "@/types/api";
import { API_URL, throwIfNotOk } from "@/lib/api";

export const searchService = {
  async semanticSearch(
    query: string,
    limit = 12,
  ): Promise<PageResponse<Property>> {
    const params = new URLSearchParams();

    params.set("q", query.trim());
    params.set("limit", String(limit));

    const res = await fetch(`${API_URL}/properties/search?${params.toString()}`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    await throwIfNotOk(res);

    return res.json();
  },
};