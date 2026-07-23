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

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;

  let data: PageResponse<Property> | null = null;
  let error: string | null = null;

  try {
    data = await propertyService.getProperties({
      search: params.search,
      district: params.district,
      minPrice: params.minPrice ? Number(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
      bedrooms: params.bedrooms ? Number(params.bedrooms) : undefined,
      categoryId: params.categoryId ? Number(params.categoryId) : undefined,
      page: params.page ? Number(params.page) : 1,
      size: 8,
    });
  } catch (e) {
    error = e instanceof Error ? e.message : "Lỗi không xác định khi kết nối server.";
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Phần tin tức nổi bật */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12 bg-white p-4 border border-gray-100 rounded-md shadow-sm">
          <div className="lg:col-span-6 cursor-pointer group">
            <div className="h-[250px] bg-gray-200 rounded-md overflow-hidden mb-3">
              <img
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80"
                alt="News"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <h2 className="text-xl font-bold text-gray-800 group-hover:text-red-600 mb-2">
              BĐS Đà Nẵng 2026: Thị Trường Nhiều Cơ Hội
            </h2>
            <p className="text-xs text-gray-500">⏱ 1 tuần trước</p>
          </div>
          <div className="lg:col-span-3 flex flex-col justify-between space-y-4">
            {[
              "Tin tức số 1 về bất động sản nổi bật...",
              "Dự án căn hộ cao cấp sắp mở bán...",
              "Phân tích thị trường nhà đất cuối năm...",
              "Xu hướng đầu tư căn hộ thông minh...",
            ].map((t, i) => (
              <div key={i} className="cursor-pointer group border-b border-gray-100 pb-2 last:border-0">
                <h3 className="text-sm font-medium text-gray-700 group-hover:text-red-600 line-clamp-2">{t}</h3>
              </div>
            ))}
          </div>
          <div className="lg:col-span-3 flex flex-col gap-4">
            <div className="h-32 bg-blue-50 rounded-md flex items-center justify-center border border-gray-200">
              <span className="text-blue-800 font-bold text-center px-4">Banner 1</span>
            </div>
            <div className="h-32 bg-red-50 rounded-md flex items-center justify-center border border-gray-200">
              <span className="text-red-600 font-bold text-center px-4">Banner 2</span>
            </div>
          </div>
        </section>

        {/* Khu vực danh sách bất động sản và Bộ lọc */}
        <section>
          <SearchBar />

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Bất động sản dành cho bạn</h2>
            {data && (
              <span className="text-sm text-gray-500">{data.totalElements} tin đăng</span>
            )}
          </div>

          <PropertyGrid data={data} error={error} />
        </section>
      </main>
    </div>
  );
}
