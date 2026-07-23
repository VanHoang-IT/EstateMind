"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { propertyService } from "@/services/propertyService";
import { categoryService } from "@/services/categoryService";
import { Category, PropertyInput } from "@/types/property";

const emptyForm: PropertyInput = {
  title: "",
  description: "",
  address: "",
  price: 0,
  area: undefined,
  status: "AVAILABLE",
  district: "",
  bedrooms: undefined,
  categoryId: 0,
};

export default function NewPropertyPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<PropertyInput>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    categoryService.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  // Chờ AuthContext load xong rồi mới quyết định redirect, tránh flash chuyển
  // trang oan khi user thực ra đã đăng nhập nhưng context chưa kịp load profile.
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  function update<K extends keyof PropertyInput>(key: K, value: PropertyInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.categoryId) {
      setError("Vui lòng chọn loại hình bất động sản");
      return;
    }

    setSubmitting(true);
    try {
      const created = await propertyService.createProperty(form);
      router.push(`/properties/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Đăng tin thất bại");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !user) {
    return <div className="min-h-[50vh] flex items-center justify-center text-gray-400">Đang tải...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Đăng tin bất động sản</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-md p-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Tiêu đề *</label>
          <input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-red-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Loại hình *</label>
          <select
            value={form.categoryId || ""}
            onChange={(e) => update("categoryId", Number(e.target.value))}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-red-500"
          >
            <option value="">-- Chọn loại hình --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Giá (tỷ) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.price || ""}
              onChange={(e) => update("price", Number(e.target.value))}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Diện tích (m²)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.area || ""}
              onChange={(e) => update("area", Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Địa chỉ *</label>
          <input
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Quận/Huyện</label>
            <input
              value={form.district || ""}
              onChange={(e) => update("district", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Số phòng ngủ</label>
            <input
              type="number"
              min="0"
              value={form.bedrooms || ""}
              onChange={(e) => update("bedrooms", Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Mô tả</label>
          <textarea
            rows={5}
            value={form.description || ""}
            onChange={(e) => update("description", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-red-500"
          />
        </div>

        <p className="text-xs text-gray-400">
          * Upload ảnh cho tin đăng sẽ làm ở bước sau khi tin đã được tạo (cần property id trước).
        </p>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-md transition-colors disabled:opacity-50"
        >
          {submitting ? "Đang đăng..." : "Đăng tin"}
        </button>
      </form>
    </div>
  );
}
