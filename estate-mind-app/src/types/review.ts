import { Seller } from "./property";

export interface Review {
  id: number;
  content: string;
  rating: number;
  visible?: boolean;
  createdAt?: string;
  userId?: Seller;
}

export interface ReviewInput {
  content: string;
  rating: number;
  propertyId: number;
}
