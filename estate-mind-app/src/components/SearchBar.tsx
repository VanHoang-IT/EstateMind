"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { Category } from "@/types/property";
import { categoryService } from "@/services/categoryService";

function getPriceInBillions(value: string | null): string {
  if (!value) return "";

  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "";
  }

  return String(amount / 1_000_000_000);
}

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [district, setDistrict] = useState(searchParams.get("district") || "");
  const [minPrice, setMinPrice] = useState(
    getPriceInBillions(searchParams.get("minPrice")),
  );
  const [maxPrice, setMaxPrice] = useState(
    getPriceInBillions(searchParams.get("maxPrice")),
  );
  const [bedrooms, setBedrooms] = useState(searchParams.get("bedrooms") || "");
  const [categoryId, setCategoryId] = useState(
    searchParams.get("categoryId") || "",
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(
    Boolean(
      searchParams.get("minPrice") ||
      searchParams.get("maxPrice") ||
      searchParams.get("bedrooms") ||
      searchParams.get("categoryId"),
    ),
  );
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    categoryService
      .getCategories()
      .then((result) => {
        if (!ignore) {
          setCategories(result);
        }
      })
      .catch(() => {
        if (!ignore) {
          setCategories([]);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const minPriceInBillions = Number(minPrice);
    const maxPriceInBillions = Number(maxPrice);

    if (
      minPrice &&
      maxPrice &&
      Number.isFinite(minPriceInBillions) &&
      Number.isFinite(maxPriceInBillions) &&
      minPriceInBillions > maxPriceInBillions
    ) {
      setFormError("Giá từ không được lớn hơn giá đến.");
      setShowAdvanced(true);
      return;
    }

    const params = new URLSearchParams();

    params.set("page", "1");

    const normalizedSearch = search.trim();
    const normalizedDistrict = district.trim();

    if (normalizedSearch) {
      params.set("search", normalizedSearch);
    }

    if (normalizedDistrict) {
      params.set("district", normalizedDistrict);
    }

    if (minPrice && minPriceInBillions > 0) {
      params.set(
        "minPrice",
        String(Math.round(minPriceInBillions * 1_000_000_000)),
      );
    }

    if (maxPrice && maxPriceInBillions > 0) {
      params.set(
        "maxPrice",
        String(Math.round(maxPriceInBillions * 1_000_000_000)),
      );
    }

    if (bedrooms) {
      params.set("bedrooms", bedrooms);
    }

    if (categoryId) {
      params.set("categoryId", categoryId);
    }

    router.push(`/?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSearch}
      className="mb-6 rounded-md border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex flex-col items-center gap-4 md:flex-row">
        <div className="relative w-full md:flex-grow">
          <input
            type="text"
            placeholder="Nhập địa điểm, tên dự án, căn hộ..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm text-gray-800 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        </div>

        <div className="w-full md:w-52">
          <select
            value={district}
            onChange={(event) => setDistrict(event.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          >
            <option value="">Tất cả Quận/Huyện</option>
            <option value="Quận 1">Quận 1</option>
            <option value="Quận 3">Quận 3</option>
            <option value="Quận 4">Quận 4</option>
            <option value="Quận 5">Quận 5</option>
            <option value="Quận 6">Quận 6</option>
            <option value="Quận 7">Quận 7</option>
            <option value="Quận 8">Quận 8</option>
            <option value="Quận 10">Quận 10</option>
            <option value="Quận 11">Quận 11</option>
            <option value="Quận 12">Quận 12</option>
            <option value="Quận Bình Thạnh">Quận Bình Thạnh</option>
            <option value="Quận Bình Tân">Quận Bình Tân</option>
            <option value="Quận Gò Vấp">Quận Gò Vấp</option>
            <option value="Quận Phú Nhuận">Quận Phú Nhuận</option>
            <option value="Quận Tân Bình">Quận Tân Bình</option>
            <option value="Quận Tân Phú">Quận Tân Phú</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced((current) => !current)}
          className="w-full whitespace-nowrap rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-500 dark:border-slate-700 dark:text-slate-300 dark:hover:text-red-400 md:w-auto"
        >
          {showAdvanced ? "Thu gọn ▲" : "Lọc nâng cao ▼"}
        </button>

        <button
          type="submit"
          className="w-full rounded-md bg-red-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 md:w-auto"
        >
          Tìm kiếm
        </button>
      </div>

      {showAdvanced && (
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 dark:border-slate-800 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs text-gray-500 dark:text-slate-400">
              Giá từ (tỷ)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder="VD: 1"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500 dark:text-slate-400">
              Giá đến (tỷ)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder="VD: 5"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500 dark:text-slate-400">
              Số phòng ngủ
            </label>
            <select
              value={bedrooms}
              onChange={(event) => setBedrooms(event.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="">Bất kỳ</option>
              {[1, 2, 3, 4, 5].map((number) => (
                <option key={number} value={number}>
                  {number} phòng
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500 dark:text-slate-400">
              Loại hình
            </label>
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="">Tất cả</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {formError && (
            <p className="col-span-2 text-sm text-red-600 dark:text-red-400 md:col-span-4">
              {formError}
            </p>
          )}
        </div>
      )}
    </form>
  );
}
