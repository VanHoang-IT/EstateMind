"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, LoginInput, RegisterInput } from "@/types/user";
import { userService } from "@/services/userService";
import { getToken, setToken, clearToken } from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// LƯU Ý: token đang lưu ở localStorage cho đơn giản. Cách an toàn hơn (chống
// XSS đọc trộm token) là dùng cookie httpOnly — nhưng backend hiện trả JWT
// trong body JSON của /api/login (không set Set-Cookie), nên muốn dùng
// httpOnly cookie thật sự cần thêm 1 Next.js Route Handler làm proxy để tự
// set cookie phía server. Để đơn giản trong bản này, dùng localStorage trước;
// có thể nâng cấp sau nếu cần bảo mật cao hơn.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    userService
      .getProfile()
      .then(setUser)
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(input: LoginInput) {
    const { token } = await userService.login(input);
    setToken(token);
    const profile = await userService.getProfile();
    setUser(profile);
  }

  async function register(input: RegisterInput) {
    await userService.register(input);
    // Đăng ký xong tự đăng nhập luôn cho tiện
    await login({ username: input.username, password: input.password });
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth phải được dùng bên trong <AuthProvider>");
  }
  return ctx;
}
