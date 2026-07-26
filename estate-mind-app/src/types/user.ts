export interface User {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  userRole?: string;
}

export interface RegisterInput {
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  avatar: File; // backend bắt buộc phải có avatar khi đăng ký (xem ApiUserController)
  role: "CUSTOMER" | "SELLER"; // backend tự tạo customer_profile / seller_profile tương ứng
}

export interface LoginInput {
  username: string;
  password: string;
}
