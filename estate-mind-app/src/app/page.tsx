import Image from "next/image";

import { propertyService } from "@/services/propertyService";
import SearchBar from "@/components/SearchBar";
import PropertyGrid from "@/components/PropertyGrid";

import { PageResponse } from "@/types/api";
import { Property } from "@/types/property";

interface Props {
  searchParams: Promise<{
    search?: string;
    district?: string;
    minPrice?: string;
    maxPrice?: string;
    bedrooms?: string;
    categoryId?: string;
    page?: string;
  }>;
}

function parsePositiveNumber(value?: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : undefined;
}

function parsePositiveInteger(value?: string): number | undefined {
  const parsedValue = parsePositiveNumber(value);

  return parsedValue != null && Number.isInteger(parsedValue)
    ? parsedValue
    : undefined;
}

export default async function Home({ searchParams }: Props) {
  const resolvedParams = await searchParams;

  const currentSearch = resolvedParams.search?.trim() || "";
  const currentDistrict = resolvedParams.district?.trim() || "";

  const currentPage = parsePositiveInteger(resolvedParams.page) ?? 1;
  const currentMinPrice = parsePositiveNumber(resolvedParams.minPrice);
  const currentMaxPrice = parsePositiveNumber(resolvedParams.maxPrice);
  const currentBedrooms = parsePositiveInteger(resolvedParams.bedrooms);
  const currentCategoryId = parsePositiveInteger(resolvedParams.categoryId);

  let propertyData: PageResponse<Property> | null = null;
  let propertyError: string | null = null;

  try {
    propertyData = await propertyService.getProperties({
      page: currentPage,
      size: 8,
      search: currentSearch,
      district: currentDistrict,
      minPrice: currentMinPrice,
      maxPrice: currentMaxPrice,
      bedrooms: currentBedrooms,
      categoryId: currentCategoryId,
      status: "AVAILABLE",
    });
  } catch {
    propertyError = "Dữ liệu hiện không khả dụng. Vui lòng thử lại sau.";
  }

  const searchBarKey = [
    currentSearch,
    currentDistrict,
    currentMinPrice ?? "",
    currentMaxPrice ?? "",
    currentBedrooms ?? "",
    currentCategoryId ?? "",
  ].join("|");

  const hasActiveFilters = Boolean(
    currentSearch ||
    currentDistrict ||
    currentMinPrice ||
    currentMaxPrice ||
    currentBedrooms ||
    currentCategoryId,
  );

  return (
    <div className="min-h-screen bg-gray-50/30 dark:bg-slate-950">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-12 grid grid-cols-1 gap-6 rounded-md border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-12">
          <div className="group cursor-pointer lg:col-span-6">
            <div className="relative mb-3 h-[250px] overflow-hidden rounded-md bg-gray-200 dark:bg-slate-800">
              <Image
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80"
                alt="Tin tức bất động sản"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            <h2 className="mb-2 text-xl font-bold text-gray-800 group-hover:text-red-600 dark:text-slate-100 dark:group-hover:text-red-400">
              BĐS HCM 2026: Thị Trường Nhiều Cơ Hội
            </h2>

            <p className="text-xs text-gray-500 dark:text-slate-400">
              ⏱ 1 ngày trước
            </p>
          </div>

          <div className="flex flex-col justify-between space-y-4 lg:col-span-3">
            {[
              "Tin tức số 1 về bất động sản nổi bật...",
              "Dự án căn hộ cao cấp sắp mở bán...",
              "Phân tích thị trường nhà đất cuối năm...",
              "Xu hướng đầu tư căn hộ thông minh...",
            ].map((title, index) => (
              <div
                key={index}
                className="group cursor-pointer border-b border-gray-100 pb-2 last:border-0 dark:border-slate-800"
              >
                <h3 className="line-clamp-2 text-sm font-medium text-gray-700 group-hover:text-red-600 dark:text-slate-300 dark:group-hover:text-red-400">
                  {title}
                </h3>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4 lg:col-span-3">
            <div className="relative h-32 overflow-hidden rounded-md border border-gray-200 dark:border-slate-700">
              <Image
                src="https://res.cloudinary.com/dlwy7kulj/image/upload/v1784964201/1_eusobh.webp"
                alt="Banner 1"
                fill
                sizes="(max-width: 1024px) 100vw, 320px"
                className="object-cover"
              />
            </div>

            <div className="relative h-32 overflow-hidden rounded-md border border-gray-200 dark:border-slate-700">
              <Image
                src="https://res.cloudinary.com/dlwy7kulj/image/upload/v1784964200/2_lr3srj.webp"
                alt="Banner 2"
                fill
                sizes="(max-width: 1024px) 100vw, 320px"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        <section>
          <SearchBar key={searchBarKey} />

          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              {hasActiveFilters
                ? "Bất động sản phù hợp"
                : "Bất động sản dành cho bạn"}
            </h2>
          </div>

          <PropertyGrid data={propertyData} error={propertyError} />
        </section>
      </main>
    </div>
  );
}
