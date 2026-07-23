"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Category } from "@/types/property";
import { categoryService } from "@/services/categoryService";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [district, setDistrict] = useState(searchParams.get("district") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [bedrooms, setBedrooms] = useState(searchParams.get("bedrooms") || "");
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") || "");
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    categoryService.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();

    params.set("page", "1");
    if (search) params.set("search", search);
    if (district) params.set("district", district);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (bedrooms) params.set("bedrooms", bedrooms);
    if (categoryId) params.set("categoryId", categoryId);

    router.push(`/?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="bg-white p-4 border border-gray-200 rounded-md shadow-sm mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="w-full md:flex-grow relative">
          <input
            type="text"
            placeholder="Nhập địa điểm, tên dự án, căn hộ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-red-500 text-gray-800"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        </div>

        <div className="w-full md:w-48">
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-red-500 bg-white text-gray-700"
          >
            <option value="">Tất cả Quận/Huyện</option>
            <option value="Sơn Trà">Sơn Trà</option>
            <option value="Hải Châu">Hải Châu</option>
            <option value="Ngũ Hành Sơn">Ngũ Hành Sơn</option>
            <option value="Liên Chiểu">Liên Chiểu</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="w-full md:w-auto text-sm text-gray-600 hover:text-red-500 font-medium px-3 py-2 border border-gray-300 rounded-md whitespace-nowrap"
        >
          {showAdvanced ? "Thu gọn ▲" : "Lọc nâng cao ▼"}
        </button>

        <button
          type="submit"
          className="w-full md:w-auto bg-red-500 hover:bg-red-600 text-white font-medium text-sm px-6 py-2 rounded-md transition-colors"
        >
          Tìm kiếm
        </button>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Giá từ (tỷ)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-red-500"
              placeholder="VD: 1"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Giá đến (tỷ)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-red-500"
              placeholder="VD: 5"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Số phòng ngủ</label>
            <select
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-red-500 bg-white"
            >
              <option value="">Bất kỳ</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}+ phòng
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Loại hình</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-red-500 bg-white"
            >
              <option value="">Tất cả</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </form>
  );
}
