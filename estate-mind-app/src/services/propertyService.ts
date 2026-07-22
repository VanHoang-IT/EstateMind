import { Property } from "@/types/property";

const API_URL = "http://localhost:8080/EstateMind/api"; 

export const propertyService = {
  async getProperties(
    page: number = 1, 
    size: number = 8, 
    search: string = "", 
    district: string = ""
  ): Promise<Property[]> {
    try {
      // BỎ logic trừ 1 đi, truyền thẳng số page (1, 2, 3...) lên Backend
      let url = `${API_URL}/properties?page=${page}&size=${size}`;
      
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (district) url += `&district=${encodeURIComponent(district)}`;
      
      const response = await fetch(url, {
        cache: "no-store", 
      });
      
      if (!response.ok) {
        throw new Error("Không thể kết nối với server Spring Boot");
      }
      
      return await response.json();
    } catch (error) {
      console.error("Lỗi fetch properties:", error);
      return [];
    }
  }
};