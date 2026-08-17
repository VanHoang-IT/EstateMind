"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";

import { categoryService } from "@/services/categoryService";
import { Category } from "@/types/property";

const SALE_TYPE_ID = 1;
const RENT_TYPE_ID = 2;
const MAX_SALE_CATEGORY_ID = 12;

// Loại hình không có phòng ngủ -> ẩn bộ lọc phòng ngủ.
const NO_BEDROOM_CATEGORY_IDS = new Set([7, 8, 9, 11, 12, 20, 21, 22, 23]);

const TYPE_TABS = [
  { value: "", label: "Tất cả" },
  { value: String(SALE_TYPE_ID), label: "Bán" },
  { value: String(RENT_TYPE_ID), label: "Cho thuê" },
];

function isRentCategoryId(id: number) {
  return id > MAX_SALE_CATEGORY_ID;
}

function priceUnit(propertyTypeId: string) {
  return propertyTypeId === String(RENT_TYPE_ID)
    ? { label: "triệu đồng / tháng", factor: 1_000_000, step: "0.5" }
    : { label: "tỷ đồng", factor: 1_000_000_000, step: "0.1" };
}

function fromVnd(value: string | null, factor: number) {
  if (!value) return "";

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return "";
  }

  return String(numberValue / factor);
}

export default function ProjectFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialType = searchParams.get("propertyTypeId") || "";
  const initialUnit = priceUnit(initialType);

  const [categories, setCategories] = useState<Category[]>([]);
  const [propertyTypeId, setPropertyTypeId] = useState(initialType);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [district, setDistrict] = useState(searchParams.get("district") || "");
  const [minPrice, setMinPrice] = useState(
    fromVnd(searchParams.get("minPrice"), initialUnit.factor),
  );
  const [maxPrice, setMaxPrice] = useState(
    fromVnd(searchParams.get("maxPrice"), initialUnit.factor),
  );
  const [bedrooms, setBedrooms] = useState(searchParams.get("bedrooms") || "");
  const [categoryId, setCategoryId] = useState(
    searchParams.get("categoryId") || "",
  );
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    categoryService
      .getCategories()
      .then((result) => {
        if (!ignore) setCategories(result);
      })
      .catch(() => {
        if (!ignore) setCategories([]);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const unit = priceUnit(propertyTypeId);

  const visibleCategories = useMemo(() => {
    if (!propertyTypeId) return categories;

    const wantRent = propertyTypeId === String(RENT_TYPE_ID);

    return categories.filter(
      (category) => isRentCategoryId(category.id) === wantRent,
    );
  }, [categories, propertyTypeId]);

  const showBedrooms =
    !categoryId || !NO_BEDROOM_CATEGORY_IDS.has(Number(categoryId));

  function handleTypeChange(value: string) {
    setPropertyTypeId(value);
    // Đổi nhóm thì bỏ category cũ (id không còn thuộc nhóm mới) và giá
    // vì đơn vị tính khác nhau (tỷ vs triệu/tháng).
    setCategoryId("");
    setMinPrice("");
    setMaxPrice("");
  }

  function handleCategoryChange(value: string) {
    setCategoryId(value);

    if (value) {
      const nextType = isRentCategoryId(Number(value))
        ? String(RENT_TYPE_ID)
        : String(SALE_TYPE_ID);

      if (nextType !== propertyTypeId) {
        setPropertyTypeId(nextType);
        setMinPrice("");
        setMaxPrice("");
      }
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const min = Number(minPrice);
    const max = Number(maxPrice);

    if (
      minPrice &&
      maxPrice &&
      Number.isFinite(min) &&
      Number.isFinite(max) &&
      min > max
    ) {
      setError("Giá tối thiểu không được lớn hơn giá tối đa.");
      return;
    }

    const params = new URLSearchParams();

    if (search.trim()) params.set("search", search.trim());
    if (district.trim()) params.set("district", district.trim());
    if (propertyTypeId) params.set("propertyTypeId", propertyTypeId);
    if (categoryId) params.set("categoryId", categoryId);

    if (minPrice && min > 0) {
      params.set("minPrice", String(Math.round(min * unit.factor)));
    }

    if (maxPrice && max > 0) {
      params.set("maxPrice", String(Math.round(max * unit.factor)));
    }

    if (bedrooms && showBedrooms) params.set("bedrooms", bedrooms);

    params.set("page", "1");

    router.push(`/projects?${params.toString()}`);
  }

  function handleReset() {
    setSearch("");
    setDistrict("");
    setPropertyTypeId("");
    setMinPrice("");
    setMaxPrice("");
    setBedrooms("");
    setCategoryId("");
    setError("");

    router.push("/projects");
  }

  const inputClass =
    "h-11 w-full rounded-lg border border-[#d7dfdb] bg-white px-3 text-sm text-[#34413a] outline-none transition placeholder:text-[#9aa39e] focus:border-brand focus:ring-2 focus:ring-brand/10";

  return (
    <aside className="h-fit rounded-xl border border-[#e2e7e4] bg-white p-6 shadow-[0_10px_35px_rgba(25,50,38,0.05)] lg:sticky lg:top-24">
      <div className="flex items-center gap-2">
        <SlidersHorizontal size={20} className="text-brand" />

        <h2 className="text-2xl font-bold tracking-[-0.03em] text-[#202523]">
          Bộ lọc
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="mt-7 space-y-6">
        <div>
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.09em] text-[#5d6862]">
            Nhu cầu
          </label>

          <div className="grid grid-cols-3 gap-2">
            {TYPE_TABS.map((tab) => {
              const active = propertyTypeId === tab.value;

              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => handleTypeChange(tab.value)}
                  className={`h-10 rounded-lg text-sm font-medium transition ${
                    active
                      ? "bg-brand text-white"
                      : "border border-[#d8e0dc] text-[#65716a] hover:border-brand hover:text-brand"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.09em] text-[#5d6862]">
            Tìm kiếm
          </label>

          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7d8881]"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tiêu đề hoặc địa chỉ"
              aria-label="Tìm theo tiêu đề hoặc địa chỉ"
              className={`${inputClass} pl-9`}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.09em] text-[#5d6862]">
            Khu vực
          </label>

          <input
            value={district}
            onChange={(event) => setDistrict(event.target.value)}
            placeholder="Ví dụ: Quận 1"
            aria-label="Khu vực"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.09em] text-[#5d6862]">
            Khoảng giá ({unit.label})
          </label>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <input
              type="number"
              min="0"
              step={unit.step}
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              placeholder="Tối thiểu"
              aria-label="Giá tối thiểu"
              className={inputClass}
            />

            <span className="text-[#929b96]">-</span>

            <input
              type="number"
              min="0"
              step={unit.step}
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder="Tối đa"
              aria-label="Giá tối đa"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.09em] text-[#5d6862]">
            Loại bất động sản
          </label>

          <select
            value={categoryId}
            onChange={(event) => handleCategoryChange(event.target.value)}
            aria-label="Loại bất động sản"
            className={inputClass}
          >
            <option value="">Tất cả loại hình</option>

            {visibleCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {propertyTypeId
                  ? category.name
                  : `${isRentCategoryId(category.id) ? "Thuê" : "Bán"} · ${category.name}`}
              </option>
            ))}
          </select>
        </div>

        {showBedrooms && (
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.09em] text-[#5d6862]">
              Phòng ngủ
            </label>

            <select
              value={bedrooms}
              onChange={(event) => setBedrooms(event.target.value)}
              aria-label="Số phòng ngủ"
              className={inputClass}
            >
              <option value="">Tất cả</option>
              <option value="1">Từ 1 phòng ngủ</option>
              <option value="2">Từ 2 phòng ngủ</option>
              <option value="3">Từ 3 phòng ngủ</option>
              <option value="4">Từ 4 phòng ngủ</option>
              <option value="5">Từ 5 phòng ngủ</option>
            </select>
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="h-11 w-full rounded-lg bg-brand text-sm font-semibold text-white transition hover:bg-brand-hover"
        >
          Áp dụng bộ lọc
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#d8e0dc] text-sm font-medium text-[#65716a] transition hover:border-brand hover:text-brand"
        >
          <RotateCcw size={15} />
          Đặt lại
        </button>
      </form>
    </aside>
  );
}
