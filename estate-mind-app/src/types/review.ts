export interface ReviewUser {
  id: number;

  username?: string;

  firstName?: string;

  lastName?: string;

  email?: string;

  phone?: string;

  avatar?: string;

  userRole?: string;
}

export interface Review {
  id: number;

  content: string;

  rating: number;

  visible?: boolean;

  createdAt?: string;

  userId?: ReviewUser;
}

export interface ReviewInput {
  content: string;

  rating: number;

  propertyId: number;
}