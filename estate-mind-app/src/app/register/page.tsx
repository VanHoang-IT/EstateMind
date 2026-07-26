"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });
  const [role, setRole] = useState<"CUSTOMER" | "SELLER">("CUSTOMER");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!avatar) {
      setError("Vui lòng chọn ảnh đại diện (bắt buộc).");
      return;
    }

    setLoading(true);
    try {
      await register({ ...form, avatar, role });
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-md shadow-sm p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6 text-center">Đăng ký tài khoản</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Họ</label>
              <input
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Tên</label>
              <input
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Bạn đăng ký với vai trò</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("CUSTOMER")}
                className={`border rounded-md py-2 text-sm font-medium transition-colors ${
                  role === "CUSTOMER"
                    ? "border-red-500 bg-red-50 text-red-600"
                    : "border-gray-300 text-gray-600 hover:border-gray-400"
                }`}
              >
                Người mua/thuê
              </button>
              <button
                type="button"
                onClick={() => setRole("SELLER")}
                className={`border rounded-md py-2 text-sm font-medium transition-colors ${
                  role === "SELLER"
                    ? "border-red-500 bg-red-50 text-red-600"
                    : "border-gray-300 text-gray-600 hover:border-gray-400"
                }`}
              >
                Người bán/môi giới
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Tên đăng nhập</label>
            <input
              value={form.username}
              onChange={(e) => update("username", e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Mật khẩu</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Số điện thoại</label>
            <input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Ảnh đại diện *</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatar(e.target.files?.[0] || null)}
              required
              className="w-full text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-4">
          Đã có tài khoản?{" "}
          <Link href="/login" className="text-red-500 font-medium hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
