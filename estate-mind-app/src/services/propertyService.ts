import { Property, PropertyFilters, PropertyInput } from "@/types/property";
import { PageResponse } from "@/types/api";
import { API_URL, authFetch, throwIfNotOk } from "@/lib/api";

function buildQuery(filters: PropertyFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.district) params.set("district", filters.district);
  if (filters.minPrice != null) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice != null) params.set("maxPrice", String(filters.maxPrice));
  if (filters.categoryId != null) params.set("categoryId", String(filters.categoryId));
  if (filters.bedrooms != null) params.set("bedrooms", String(filters.bedrooms));
  params.set("page", String(filters.page ?? 1));
  params.set("size", String(filters.size ?? 8));
  return params.toString();
}

export const propertyService = {
  /**
   * Trả PageResponse<Property> đầy đủ (items + totalPages...) thay vì mảng
   * trần — khớp với PageResponseDTO backend trả về từ ngày sửa phân trang.
   * Nếu fetch lỗi, NÉM lỗi ra ngoài (không còn nuốt lỗi rồi trả mảng rỗng),
   * để UI biết mà hiển thị trạng thái lỗi thay vì im lặng hiện "không có tin".
   */
  async getProperties(filters: PropertyFilters = {}): Promise<PageResponse<Property>> {
    const query = buildQuery(filters);
    const res = await fetch(`${API_URL}/properties?${query}`, { cache: "no-store" });
    await throwIfNotOk(res);
    return res.json();
  },

  async getPropertyById(id: number | string): Promise<Property> {
    const res = await fetch(`${API_URL}/properties/${id}`, { cache: "no-store" });
    await throwIfNotOk(res);
    return res.json();
  },

  async createProperty(input: PropertyInput): Promise<Property> {
    const res = await authFetch("/secure/properties", {
      method: "POST",
      body: JSON.stringify(input),
    });
    await throwIfNotOk(res);
    return res.json();
  },

  async updateProperty(id: number | string, input: PropertyInput): Promise<Property> {
    const res = await authFetch(`/secure/properties/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
    await throwIfNotOk(res);
    return res.json();
  },

  async deleteProperty(id: number | string): Promise<void> {
    const res = await authFetch(`/secure/properties/${id}`, { method: "DELETE" });
    await throwIfNotOk(res);
  },
};
