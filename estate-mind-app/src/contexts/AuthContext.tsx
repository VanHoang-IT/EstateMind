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
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const load = token
      ? userService
          .getProfile()
          .then(setUser)
          .catch(() => {
            clearToken();
            setUser(null);
          })
      : Promise.resolve();
    load.finally(() => setLoading(false));
  }, []);

  async function login(input: LoginInput) {
    const { token } = await userService.login(input);
    setToken(token);
    const profile = await userService.getProfile();
    setUser(profile);
  }

  async function register(input: RegisterInput) {
    await userService.register(input);
    await login({ username: input.username, password: input.password });
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  async function refreshUser() {
    const profile = await userService.getProfile();
    setUser(profile);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
    >
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
