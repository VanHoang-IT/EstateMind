export interface PropertyImage {
  id: number;
  imageUrl: string;
  isPrimary?: boolean;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Seller {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  avatar?: string;
}

export interface Property {
  id: number;
  title: string;
  description?: string;
  address: string;
  price: number;
  area?: number;
  status?: string;
  district?: string;
  bedrooms?: number;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
  updatedAt?: string;

  mainImage?: string;

  categoryId?: Category;
  sellerId?: Seller;
  propertyImagesSet?: PropertyImage[];
}

export interface PropertyInput {
  title: string;
  description?: string;
  address: string;
  price: number;
  area?: number;
  status?: string;
  district?: string;
  bedrooms?: number;
  latitude?: number;
  longitude?: number;
  categoryId: number;
}

// Tham số lọc/tìm kiếm — khớp tên param PropertyRepositoryImpl chấp nhận.
export interface PropertyFilters {
  search?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  categoryId?: number;
  status?: string;
  sellerId?: number;
  bedrooms?: number;
  page?: number;
  size?: number;
}
