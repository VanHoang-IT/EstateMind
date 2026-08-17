"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { PageResponse } from "@/types/api";
import { Property } from "@/types/property";
import PropertyCard from "@/components/PropertyCard";
import Pagination from "@/components/Pagination";

interface Props {
  data: PageResponse<Property> | null;
  error?: string | null;
}

export default function PropertyGrid({ data, error }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());

    params.set("page", String(page));

    router.push(`/projects?${params.toString()}`);
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center">
        <p className="font-semibold text-red-700">
          Không thể tải danh sách bất động sản.
        </p>

        <p className="mt-1 text-sm text-red-600/80">{error}</p>
      </div>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#ced8d2] bg-white px-6 py-16 text-center">
        <p className="font-medium text-[#59665f]">
          Không có bất động sản nào phù hợp với bộ lọc.
        </p>

        <p className="mt-1 text-sm text-[#87918b]">
          Hãy thử thay đổi khoảng giá, khu vực hoặc loại bất động sản.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {items.map((property, index) => (
          <PropertyCard
            key={property.id}
            property={property}
            priority={index < 3}
          />
        ))}
      </div>

      {data && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          onPageChange={goToPage}
        />
      )}
    </>
  );
}
