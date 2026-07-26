"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { propertyService } from "@/services/propertyService";
import { categoryService } from "@/services/categoryService";
import { Category, PropertyInput } from "@/types/property";

interface PropertyLocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (latitude: number, longitude: number) => void;
}

const PropertyLocationPicker = dynamic<PropertyLocationPickerProps>(
  () =>
    import("../../../components/PropertyLocationPicker").then(
      (module) => module.default,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[380px] items-center justify-center rounded-md border border-gray-300 text-sm text-gray-500">
        Đang tải bản đồ...
      </div>
    ),
  },
);

const emptyForm: PropertyInput = {
  title: "",
  description: "",
  address: "",
  price: 0,
  area: undefined,
  district: "",
  bedrooms: undefined,
  latitude: undefined,
  longitude: undefined,
  categoryId: 0,
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_PROPERTY_IMAGES = 8;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function NewPropertyPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<PropertyInput>(emptyForm);
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [propertyImages, setPropertyImages] = useState<File[]>([]);
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
    value: PropertyInput[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function validateImage(file: File): string | null {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return `Ảnh ${file.name} không hợp lệ. Chỉ chấp nhận JPG, PNG hoặc WEBP.`;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return `Ảnh ${file.name} vượt quá 5 MB.`;
    }

    return null;
  }

  function handleMainImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    setError(null);

    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setMainImage(null);
      return;
    }

    const validationError = validateImage(file);

    if (validationError) {
      event.target.value = "";
      setMainImage(null);
      setError(validationError);
      return;
    }

    setMainImage(file);
  }

  function handlePropertyImagesChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    setError(null);

    const files = Array.from(event.target.files ?? []);

    if (files.length > MAX_PROPERTY_IMAGES) {
      event.target.value = "";
      setPropertyImages([]);
      setError(`Chỉ được chọn tối đa ${MAX_PROPERTY_IMAGES} ảnh mô tả.`);
      return;
    }

    for (const file of files) {
      const validationError = validateImage(file);

      if (validationError) {
        event.target.value = "";
        setPropertyImages([]);
        setError(validationError);
        return;
      }
    }

    setPropertyImages(files);
  }

  function handleLocationChange(latitude: number, longitude: number) {
    setForm((current) => ({
      ...current,
      latitude,
      longitude,
    }));
  }

  function handleCurrentLocation() {
    setError(null);

    if (!navigator.geolocation) {
      setError("Trình duyệt không hỗ trợ lấy vị trí hiện tại.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleLocationChange(
          Number(position.coords.latitude.toFixed(7)),
          Number(position.coords.longitude.toFixed(7)),
        );
      },
      () => {
        setError(
          "Không thể lấy vị trí hiện tại. Hãy cấp quyền vị trí hoặc chọn trực tiếp trên bản đồ.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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

    if (!mainImage) {
      setError("Vui lòng chọn ảnh chính.");
      return;
    }

    if (form.latitude === undefined || form.longitude === undefined) {
      setError("Vui lòng chọn vị trí bất động sản trên bản đồ.");
      return;
    }

    setSubmitting(true);

    try {
      const created = await propertyService.createProperty(
        {
          ...form,
          title: form.title.trim(),
          description: form.description?.trim() || undefined,
          address: form.address.trim(),
          district: form.district?.trim() || undefined,
        },
        mainImage,
        propertyImages,
      );

      router.push(`/properties/${created.id}`);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Đăng tin thất bại.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-400">
        Đang tải...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Đăng tin bất động sản
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-md border border-gray-200 bg-white p-6"
      >
        <div>
          <label
            htmlFor="property-title"
            className="mb-1 block text-sm text-gray-600"
          >
            Tiêu đề *
          </label>

          <input
            id="property-title"
            type="text"
            value={form.title}
            onChange={(event) => update("title", event.target.value)}
            required
            maxLength={255}
            disabled={submitting}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none disabled:bg-gray-100"
          />
        </div>

        <div>
          <label
            htmlFor="property-category"
            className="mb-1 block text-sm text-gray-600"
          >
            Loại hình *
          </label>

          <select
            id="property-category"
            value={form.categoryId || ""}
            onChange={(event) =>
              update(
                "categoryId",
                event.target.value ? Number(event.target.value) : 0,
              )
            }
            required
            disabled={submitting}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none disabled:bg-gray-100"
          >
            <option value="">-- Chọn loại hình --</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="property-price"
              className="mb-1 block text-sm text-gray-600"
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
                  event.target.value ? Number(event.target.value) : 0,
                )
              }
              required
              disabled={submitting}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none disabled:bg-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="property-area"
              className="mb-1 block text-sm text-gray-600"
            >
              Diện tích (m²)
            </label>

            <input
              id="property-area"
              type="number"
              step="0.01"
              min="0.01"
              value={form.area ?? ""}
              onChange={(event) =>
                update(
                  "area",
                  event.target.value ? Number(event.target.value) : undefined,
                )
              }
              disabled={submitting}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none disabled:bg-gray-100"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="property-address"
            className="mb-1 block text-sm text-gray-600"
          >
            Địa chỉ *
          </label>

          <input
            id="property-address"
            type="text"
            value={form.address}
            onChange={(event) => update("address", event.target.value)}
            required
            disabled={submitting}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none disabled:bg-gray-100"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="property-district"
              className="mb-1 block text-sm text-gray-600"
            >
              Quận/Huyện
            </label>

            <input
              id="property-district"
              type="text"
              value={form.district || ""}
              onChange={(event) => update("district", event.target.value)}
              disabled={submitting}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none disabled:bg-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="property-bedrooms"
              className="mb-1 block text-sm text-gray-600"
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
                  event.target.value ? Number(event.target.value) : undefined,
                )
              }
              disabled={submitting}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none disabled:bg-gray-100"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="property-description"
            className="mb-1 block text-sm text-gray-600"
          >
            Mô tả
          </label>

          <textarea
            id="property-description"
            rows={5}
            value={form.description || ""}
            onChange={(event) => update("description", event.target.value)}
            disabled={submitting}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none disabled:bg-gray-100"
          />
        </div>

        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-medium text-gray-700">
                Vị trí trên bản đồ *
              </h2>
              <p className="text-xs text-gray-400">
                Nhấn lên bản đồ để tự điền latitude và longitude.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCurrentLocation}
              disabled={submitting}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Dùng vị trí hiện tại
            </button>
          </div>

          <PropertyLocationPicker
            latitude={form.latitude ?? null}
            longitude={form.longitude ?? null}
            onChange={handleLocationChange}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="property-latitude"
                className="mb-1 block text-sm text-gray-600"
              >
                Latitude
              </label>

              <input
                id="property-latitude"
                type="number"
                value={form.latitude ?? ""}
                readOnly
                className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="property-longitude"
                className="mb-1 block text-sm text-gray-600"
              >
                Longitude
              </label>

              <input
                id="property-longitude"
                type="number"
                value={form.longitude ?? ""}
                readOnly
                className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="property-main-image"
            className="mb-1 block text-sm text-gray-600"
          >
            Ảnh chính *
          </label>

          <input
            id="property-main-image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleMainImageChange}
            required
            disabled={submitting}
            className="block w-full rounded-md border border-gray-300 text-sm text-gray-600 file:mr-4 file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200 disabled:opacity-50"
          />

          {mainImage && (
            <p className="mt-1 text-xs text-green-600">
              Đã chọn: {mainImage.name}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="property-images"
            className="mb-1 block text-sm text-gray-600"
          >
            Ảnh mô tả
          </label>

          <input
            id="property-images"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handlePropertyImagesChange}
            disabled={submitting}
            className="block w-full rounded-md border border-gray-300 text-sm text-gray-600 file:mr-4 file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200 disabled:opacity-50"
          />

          <p className="mt-1 text-xs text-gray-400">
            Tối đa 8 ảnh, mỗi ảnh không quá 5 MB.
          </p>

          {propertyImages.length > 0 && (
            <p className="mt-1 text-xs text-green-600">
              Đã chọn {propertyImages.length} ảnh mô tả.
            </p>
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-red-500 py-2.5 font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Đang tạo tin và tải ảnh..." : "Đăng tin"}
        </button>
      </form>
    </div>
  );
}
