import ProjectFilters from "@/components/projects/ProjectFilters";
import PropertyGrid from "@/components/PropertyGrid";

import { propertyService } from "@/services/propertyService";
import { searchService } from "@/services/searchService";
import { PageResponse } from "@/types/api";
import { Property } from "@/types/property";

interface Props {
  searchParams: Promise<{
    ai?: string;
    search?: string;
    district?: string;
    minPrice?: string;
    maxPrice?: string;
    bedrooms?: string;
    categoryId?: string;
    propertyTypeId?: string;
    page?: string;
  }>;
}

function headingFor(propertyTypeId?: string) {
  if (propertyTypeId === "1") return "Nhà đất bán";
  if (propertyTypeId === "2") return "Nhà đất cho thuê";
  return "Khám phá bất động sản";
}

export default async function ProjectsPage({ searchParams }: Props) {
  const params = await searchParams;

  const aiQuery = params.ai?.trim();

  let data: PageResponse<Property> | null = null;
  let error: string | null = null;

  try {
    if (aiQuery) {
      data = await searchService.semanticSearch(aiQuery, 12);
    } else {
      data = await propertyService.getProperties({
        search: params.search,
        district: params.district,
        minPrice: params.minPrice ? Number(params.minPrice) : undefined,
        maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
        bedrooms: params.bedrooms ? Number(params.bedrooms) : undefined,
        categoryId: params.categoryId ? Number(params.categoryId) : undefined,
        propertyTypeId: params.propertyTypeId
          ? Number(params.propertyTypeId)
          : undefined,
        page: params.page ? Number(params.page) : 1,
        size: 6,
      });
    }
  } catch (e) {
    error =
      e instanceof Error
        ? e.message
        : "Không thể kết nối đến dịch vụ bất động sản.";
  }

  return (
    <div className="bg-[#f7f8f7]">
      <div className="mx-auto max-w-[1180px] px-5 py-12 sm:px-6 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[288px_minmax(0,1fr)]">
          <ProjectFilters />

          <section>
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-[-0.045em] text-[#202523]">
                  {aiQuery
                    ? "Kết quả tìm kiếm bằng AI"
                    : headingFor(params.propertyTypeId)}
                </h1>

                {aiQuery ? (
                  <p className="mt-2 max-w-xl text-sm text-[#66716b]">
                    Kết quả cho: <span className="font-medium">{aiQuery}</span>
                    {data
                      ? ` — ${data.totalElements.toLocaleString("vi-VN")} tin phù hợp nhất`
                      : ""}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-[#66716b]">
                    {data
                      ? `Hiện có ${data.totalElements.toLocaleString("vi-VN")} bất động sản`
                      : "Khám phá các bất động sản hiện có"}
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-[#d9e0dc] bg-white px-4 py-2.5 text-sm text-[#5d6962]">
                {aiQuery ? "Sắp xếp theo độ phù hợp" : "Tin đăng mới nhất"}
              </div>
            </div>

            <PropertyGrid data={data} error={error} />
          </section>
        </div>
      </div>
    </div>
  );
}
