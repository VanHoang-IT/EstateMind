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

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function NewPropertyPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<PropertyInput>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    categoryService
      .getCategories()
      .then((data) => {
        if (active) {
          setCategories(data);
        }
      })
      .catch(() => {
        if (active) {
          setCategories([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  function update<K extends keyof PropertyInput>(
    key: K,
    value: PropertyInput[K]
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
  }

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    setError(null);

    const file = event.target.files?.[0];

    if (!file) {
      setImageFile(null);
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageFile(null);
      event.target.value = "";

      setError(
        "Ảnh không hợp lệ. Vui lòng chọn ảnh JPG, PNG hoặc WEBP."
      );
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setImageFile(null);
      event.target.value = "";

      setError("Dung lượng ảnh không được vượt quá 5 MB.");
      return;
    }

    setImageFile(file);
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError(null);

    if (!form.categoryId) {
      setError("Vui lòng chọn loại hình bất động sản.");
      return;
    }

    if (!form.title.trim()) {
      setError("Vui lòng nhập tiêu đề.");
      return;
    }

    if (!form.address.trim()) {
      setError("Vui lòng nhập địa chỉ.");
      return;
    }

    if (!form.price || form.price <= 0) {
      setError("Giá bất động sản phải lớn hơn 0.");
      return;
    }

    if (!imageFile) {
      setError("Vui lòng chọn ảnh đại diện cho bất động sản.");
      return;
    }

    setSubmitting(true);

    try {
      // Bước 1: tạo Property để lấy property ID.
      const created =
        await propertyService.createProperty({
          ...form,
          title: form.title.trim(),
          address: form.address.trim(),
          description: form.description?.trim(),
          district: form.district?.trim(),
        });

      // Bước 2: upload ảnh cho Property vừa tạo.
      await propertyService.uploadPropertyImage(
        created.id,
        imageFile
      );

      // Bước 3: chuyển đến trang chi tiết.
      router.push(`/properties/${created.id}`);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Đăng tin thất bại."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-400">
        Đang tải...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Đăng tin bất động sản
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-md p-6 space-y-4"
      >
        <div>
          <label
            htmlFor="property-title"
            className="block text-sm text-gray-600 mb-1"
          >
            Tiêu đề *
          </label>

          <input
            id="property-title"
            type="text"
            value={form.title}
            onChange={(event) =>
              update("title", event.target.value)
            }
            required
            maxLength={255}
            disabled={submitting}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-red-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label
            htmlFor="property-category"
            className="block text-sm text-gray-600 mb-1"
          >
            Loại hình *
          </label>

          <select
            id="property-category"
            value={form.categoryId || ""}
            onChange={(event) =>
              update(
                "categoryId",
                event.target.value
                  ? Number(event.target.value)
                  : 0
              )
            }
            required
            disabled={submitting}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-red-500 disabled:bg-gray-100"
          >
            <option value="">-- Chọn loại hình --</option>

            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="property-price"
              className="block text-sm text-gray-600 mb-1"
            >
              Giá (tỷ) *
            </label>

            <input
              id="property-price"
              type="number"
              step="0.01"
              min="0.01"
              value={form.price || ""}
              onChange={(event) =>
                update(
                  "price",
                  event.target.value
                    ? Number(event.target.value)
                    : 0
                )
              }
              required
              disabled={submitting}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-red-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="property-area"
              className="block text-sm text-gray-600 mb-1"
            >
              Diện tích (m²)
            </label>

            <input
              id="property-area"
              type="number"
              step="0.01"
              min="0"
              value={form.area ?? ""}
              onChange={(event) =>
                update(
                  "area",
                  event.target.value
                    ? Number(event.target.value)
                    : undefined
                )
              }
              disabled={submitting}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-red-500 disabled:bg-gray-100"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="property-address"
            className="block text-sm text-gray-600 mb-1"
          >
            Địa chỉ *
          </label>

          <input
            id="property-address"
            type="text"
            value={form.address}
            onChange={(event) =>
              update("address", event.target.value)
            }
            required
            disabled={submitting}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-red-500 disabled:bg-gray-100"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="property-district"
              className="block text-sm text-gray-600 mb-1"
            >
              Quận/Huyện
            </label>

            <input
              id="property-district"
              type="text"
              value={form.district || ""}
              onChange={(event) =>
                update("district", event.target.value)
              }
              disabled={submitting}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-red-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="property-bedrooms"
              className="block text-sm text-gray-600 mb-1"
            >
              Số phòng ngủ
            </label>

            <input
              id="property-bedrooms"
              type="number"
              min="0"
              step="1"
              value={form.bedrooms ?? ""}
              onChange={(event) =>
                update(
                  "bedrooms",
                  event.target.value
                    ? Number(event.target.value)
                    : undefined
                )
              }
              disabled={submitting}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-red-500 disabled:bg-gray-100"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="property-description"
            className="block text-sm text-gray-600 mb-1"
          >
            Mô tả
          </label>

          <textarea
            id="property-description"
            rows={5}
            value={form.description || ""}
            onChange={(event) =>
              update("description", event.target.value)
            }
            disabled={submitting}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-red-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label
            htmlFor="property-image"
            className="block text-sm text-gray-600 mb-1"
          >
            Ảnh đại diện *
          </label>

          <input
            id="property-image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            required
            disabled={submitting}
            className="block w-full text-sm text-gray-600 border border-gray-300 rounded-md file:mr-4 file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200 disabled:opacity-50"
          />

          <p className="mt-1 text-xs text-gray-400">
            Chấp nhận JPG, PNG hoặc WEBP. Dung lượng tối đa 5 MB.
          </p>

          {imageFile && (
            <p className="mt-1 text-xs text-green-600">
              Đã chọn: {imageFile.name}
            </p>
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="text-sm text-red-600"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting
            ? "Đang tạo tin và tải ảnh..."
            : "Đăng tin"}
        </button>
      </form>
    </div>
  );
}