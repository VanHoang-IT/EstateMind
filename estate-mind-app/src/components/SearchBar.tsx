"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  ChevronDown,
  MapPin,
  Search,
  SendHorizontal,
  Sparkles,
  WalletCards,
} from "lucide-react";

import { Category } from "@/types/property";
import { categoryService } from "@/services/categoryService";

const SALE_TYPE_ID = 1;
const RENT_TYPE_ID = 2;
const MAX_SALE_CATEGORY_ID = 12;

const TYPE_TABS = [
  { value: "", label: "Tất cả" },
  { value: String(SALE_TYPE_ID), label: "Bán" },
  { value: String(RENT_TYPE_ID), label: "Cho thuê" },
];

interface RangeOption {
  value: string;
  label: string;
  min?: number;
  max?: number;
}

// Giá bán tính bằng tỷ, giá thuê tính bằng triệu/tháng -> hai bộ khoảng riêng.
const SALE_RANGES: RangeOption[] = [
  { value: "", label: "Tất cả mức giá" },
  { value: "0-2", label: "Dưới 2 tỷ", max: 2_000_000_000 },
  { value: "2-5", label: "2 - 5 tỷ", min: 2_000_000_000, max: 5_000_000_000 },
  {
    value: "5-10",
    label: "5 - 10 tỷ",
    min: 5_000_000_000,
    max: 10_000_000_000,
  },
  { value: "10+", label: "Từ 10 tỷ", min: 10_000_000_000 },
];

const RENT_RANGES: RangeOption[] = [
  { value: "", label: "Tất cả mức giá" },
  { value: "0-5", label: "Dưới 5 triệu", max: 5_000_000 },
  { value: "5-10", label: "5 - 10 triệu", min: 5_000_000, max: 10_000_000 },
  { value: "10-20", label: "10 - 20 triệu", min: 10_000_000, max: 20_000_000 },
  { value: "20+", label: "Từ 20 triệu", min: 20_000_000 },
];

function isRentCategoryId(id: number) {
  return id > MAX_SALE_CATEGORY_ID;
}

export default function SearchBar() {
  const router = useRouter();

  const [aiQuery, setAiQuery] = useState("");
  const [search, setSearch] = useState("");
  const [propertyTypeId, setPropertyTypeId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

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

  const isRent = propertyTypeId === String(RENT_TYPE_ID);

  const ranges = isRent ? RENT_RANGES : SALE_RANGES;

  const visibleCategories = useMemo(() => {
    if (!propertyTypeId) return categories;

    return categories.filter(
      (category) => isRentCategoryId(category.id) === isRent,
    );
  }, [categories, propertyTypeId, isRent]);

  function handleTypeChange(value: string) {
    setPropertyTypeId(value);
    // Đổi nhóm thì bỏ loại hình và mức giá cũ vì đơn vị tính khác nhau.
    setCategoryId("");
    setPriceRange("");
  }

  function handleCategoryChange(value: string) {
    setCategoryId(value);

    if (!value) return;

    const nextType = isRentCategoryId(Number(value))
      ? String(RENT_TYPE_ID)
      : String(SALE_TYPE_ID);

    if (nextType !== propertyTypeId) {
      setPropertyTypeId(nextType);
      setPriceRange("");
    }
  }

  function handleAiSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedQuery = aiQuery.trim();

    if (!normalizedQuery) {
      return;
    }

    const params = new URLSearchParams();

    params.set("ai", normalizedQuery);

    router.push(`/projects?${params.toString()}`);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams();
    const normalizedSearch = search.trim();

    if (normalizedSearch) {
      params.set("search", normalizedSearch);
    }

    if (propertyTypeId) {
      params.set("propertyTypeId", propertyTypeId);
    }

    if (categoryId) {
      params.set("categoryId", categoryId);
    }

    const selectedRange = ranges.find((range) => range.value === priceRange);

    if (selectedRange?.min != null) {
      params.set("minPrice", String(selectedRange.min));
    }

    if (selectedRange?.max != null) {
      params.set("maxPrice", String(selectedRange.max));
    }

    params.set("page", "1");

    router.push(`/projects?${params.toString()}`);
  }

  const selectClass =
    "h-12 w-full appearance-none rounded-lg border border-[#dbe2de] bg-white pl-10 pr-9 text-sm text-[#36423c] outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10";

  return (
    <div className="w-full">
      <form
        onSubmit={handleAiSearch}
        className="mx-auto flex w-full max-w-[720px] items-center gap-2 rounded-full bg-white p-2 shadow-[0_22px_65px_rgba(0,0,0,0.22)]"
      >
        <Sparkles size={18} className="ml-3 shrink-0 text-brand" />

        <input
          type="text"
          value={aiQuery}
          onChange={(event) => setAiQuery(event.target.value)}
          placeholder="Tìm nhà gần công viên, giá dưới 10 tỷ và có tiềm năng tăng giá cao..."
          aria-label="Tìm kiếm bất động sản bằng AI"
          className="h-11 min-w-0 flex-1 bg-transparent text-sm text-[#36423c] outline-none placeholder:text-[#9ba49f]"
        />

        <button
          type="submit"
          aria-label="Tìm kiếm bằng AI"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-white transition hover:bg-brand-hover"
        >
          <SendHorizontal size={18} />
        </button>
      </form>

      <div className="mx-auto my-6 flex w-full max-w-[720px] items-center gap-4">
        <span className="h-px flex-1 bg-white/30" />

        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/80">
          HOẶC TÌM KIẾM THEO BỘ LỌC
        </span>

        <span className="h-px flex-1 bg-white/30" />
      </div>

      <form
        onSubmit={handleSearch}
        className="w-full rounded-2xl bg-white p-4 text-left shadow-[0_22px_65px_rgba(0,0,0,0.22)]"
      >
        <div className="mb-4 inline-flex rounded-lg bg-[#f0f3f1] p-1">
          {TYPE_TABS.map((tab) => {
            const active = propertyTypeId === tab.value;

            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => handleTypeChange(tab.value)}
                className={`rounded-md px-5 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-white text-brand shadow-sm"
                    : "text-[#68736d] hover:text-brand"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 md:grid-cols-[1.35fr_1fr_1fr_150px]">
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#68736d]">
              Khu vực
            </label>

            <div className="relative">
              <MapPin
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#66736c]"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Thành phố, phường/xã..."
                aria-label="Khu vực"
                className="h-12 w-full rounded-lg border border-[#dbe2de] bg-white pl-10 pr-3 text-sm text-[#36423c] outline-none transition placeholder:text-[#9ba49f] focus:border-brand focus:ring-2 focus:ring-brand/10"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#68736d]">
              Loại bất động sản
            </label>

            <div className="relative">
              <Building2
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#66736c]"
              />

              <select
                value={categoryId}
                onChange={(event) => handleCategoryChange(event.target.value)}
                aria-label="Loại bất động sản"
                className={selectClass}
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

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#748078]"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#68736d]">
              Khoảng giá{isRent ? " (mỗi tháng)" : ""}
            </label>

            <div className="relative">
              <WalletCards
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#66736c]"
              />

              <select
                value={priceRange}
                onChange={(event) => setPriceRange(event.target.value)}
                aria-label="Khoảng giá"
                className={selectClass}
              >
                {ranges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#748078]"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-hover"
            >
              <Search size={18} />
              Tìm kiếm
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
