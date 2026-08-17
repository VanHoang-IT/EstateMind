export type ListingStatus = "AVAILABLE" | "RENT" | "SOLD";

export type ModerationStatus = "PENDING" | "APPROVED" | "REJECTED";

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

  attributes?: string;

  price: number;

  area?: number;

  status?: ListingStatus;

  moderationStatus?: ModerationStatus;

  rejectionReason?: string;

  district?: string;

  bedrooms?: number;
  amenities?: string;
  latitude?: number;

  longitude?: number;

  createdAt?: string;

  updatedAt?: string;

  mainImage?: string;

  url?: string;

  urlCrawl?: string;

  crawlDate?: string;

  legalVerified?: boolean;

  categoryId?: Category;

  sellerId?: Seller;

  propertyImagesSet?: PropertyImage[];

  predictedPrice?: number;

  mindScore?: number;

  scoredAt?: string;
}

export interface PropertyInput {
  title: string;

  description?: string;

  address: string;

  price: number;

  area?: number;

  status?: "AVAILABLE" | "RENT";

  district?: string;

  bedrooms?: number;

  latitude?: number;

  longitude?: number;

  categoryId: number;
}

export interface PropertyFilters {
  search?: string;

  district?: string;

  minPrice?: number;
  propertyTypeId?: number;
  maxPrice?: number;
  categoryId?: number;
  status?: ListingStatus;
  moderationStatus?: ModerationStatus;

  sellerId?: number;

  bedrooms?: number;

  page?: number;

  size?: number;
}
