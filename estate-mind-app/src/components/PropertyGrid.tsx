"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PageResponse } from "@/types/api";
import { Property } from "@/types/property";
import PropertyCard from "./PropertyCard";
import Pagination from "./Pagination";

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
    router.push(`/?${params.toString()}`);
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md py-10 text-center">
        <p className="text-red-600 font-medium mb-1">Không thể tải danh sách bất động sản.</p>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-md border border-dashed border-gray-300 py-16 text-center">
        <p className="text-gray-500">Không tìm thấy bất động sản nào phù hợp.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>

      {data && (
        <Pagination page={data.page} totalPages={data.totalPages} onPageChange={goToPage} />
      )}
    </>
  );
}
