export interface PropertyImage {
  id: number;
  imageUrl: string;
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
  url?: string;
  bedrooms?: number;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
  updatedAt?: string;
  
  propertyImagesSet?: PropertyImage[];
}