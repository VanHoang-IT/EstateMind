import { User, LoginInput, RegisterInput } from "@/types/user";
import { API_URL, authFetch, throwIfNotOk } from "@/lib/api";

export const userService = {
  async login(input: LoginInput): Promise<{ token: string }> {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    });
    // /login trả string thô ("Sai thông tin đăng nhập") khi lỗi, không phải JSON
    await throwIfNotOk(res);
    return res.json();
  },

  async register(input: RegisterInput): Promise<User> {
    const formData = new FormData();
    formData.set("username", input.username);
    formData.set("password", input.password);
    if (input.firstName) formData.set("firstName", input.firstName);
    if (input.lastName) formData.set("lastName", input.lastName);
    if (input.phone) formData.set("phone", input.phone);
    if (input.email) formData.set("email", input.email);
    formData.set("avatar", input.avatar); // bắt buộc — backend yêu cầu avatar
    formData.set("role", input.role); // "CUSTOMER" hoặc "SELLER"

    const res = await fetch(`${API_URL}/users`, {
      method: "POST",
      body: formData,
      cache: "no-store",
    });
    await throwIfNotOk(res);
    return res.json();
  },

  async getProfile(): Promise<User> {
    const res = await authFetch("/secure/profile");
    await throwIfNotOk(res);
    return res.json();
  },
};
