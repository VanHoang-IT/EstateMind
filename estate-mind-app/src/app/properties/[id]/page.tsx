import Image from "next/image";
import Link from "next/link";

import { propertyService } from "@/services/propertyService";
import { Property } from "@/types/property";
import PropertyMap from "@/components/PropertyMap";
import PropertyReviews from "@/components/PropertyReviews";
import FavoriteButton from "@/components/FavoriteButton";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80";

function formatPrice(price?: number): string {
  if (price == null || price <= 0) {
    return "Thỏa thuận";
  }

  if (price >= 1_000_000_000) {
    return `${(price / 1_000_000_000).toLocaleString("vi-VN", {
      maximumFractionDigits: 2,
    })} tỷ`;
  }

  if (price >= 1_000_000) {
    return `${(price / 1_000_000).toLocaleString("vi-VN", {
      maximumFractionDigits: 2,
    })} triệu`;
  }

  return `${price.toLocaleString("vi-VN")} đồng`;
}

function formatArea(area?: number): string {
  if (area == null || area <= 0) {
    return "Chưa cập nhật";
  }

  return `${area.toLocaleString("vi-VN", {
    maximumFractionDigits: 2,
  })} m²`;
}

function formatStatus(status?: string): string {
  switch (status?.toUpperCase()) {
    case "AVAILABLE":
      return "Đang bán";
    case "PENDING":
      return "Chờ duyệt";
    case "SOLD":
      return "Đã bán";
    case "RENTED":
      return "Đã cho thuê";
    case "HIDDEN":
      return "Đã ẩn";
    default:
      return status || "Chưa cập nhật";
  }
}

function getSellerName(property: Property): string {
  const seller = property.sellerId;

  if (!seller) {
    return "Ẩn danh";
  }

  const fullName = [seller.firstName, seller.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || seller.username || "Ẩn danh";
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;

  let property: Property;

  try {
    property = await propertyService.getPropertyById(id);
  } catch (error) {
    // Chỉ ghi lỗi kỹ thuật trong terminal để kiểm tra,
    // không đưa nội dung HTML/XML của Tomcat ra giao diện.
    console.error(`Không thể tải Property có ID ${id}:`, error);

    return (
      <main className="min-h-[60vh] max-w-5xl mx-auto px-4 py-12">
        <div className="rounded-md border border-red-200 bg-red-50 p-6 dark:border-red-900/60 dark:bg-red-950/30">
          <h1 className="text-lg font-semibold text-red-700 dark:text-red-400">
            Không thể tải thông tin bất động sản
          </h1>

          <p className="mt-2 text-sm text-red-600 dark:text-red-300">
            Dữ liệu hiện không khả dụng. Vui lòng quay lại danh sách và thử lại
            sau.
          </p>

          <Link
            href="/"
            className="inline-block mt-4 text-sm font-medium text-red-600 hover:underline dark:text-red-400"
          >
            Quay lại danh sách bất động sản
          </Link>
        </div>
      </main>
    );
  }

  /*
   * Ưu tiên:
   * 1. mainImage
   * 2. Ảnh isPrimary
   * 3. Các ảnh còn lại
   * 4. Ảnh mặc định
   */
  const propertyImages = property.propertyImagesSet ?? [];

  const primaryPropertyImage = propertyImages.find(
    (image) => image.isPrimary,
  )?.imageUrl;

  const rawImageUrls = [
    property.mainImage,
    primaryPropertyImage,
    ...propertyImages.map((image) => image.imageUrl),
  ];

  const validImageUrls = rawImageUrls.filter(
    (url): url is string => typeof url === "string" && url.trim().length > 0,
  );

  // Không hiển thị trùng ảnh mainImage
  // nếu ảnh này cũng nằm trong propertyImagesSet.
  const images =
    validImageUrls.length > 0 ? [...new Set(validImageUrls)] : [FALLBACK_IMAGE];

  const sellerName = getSellerName(property);

  return (
    <div className="min-h-screen bg-gray-50/30 dark:bg-slate-950">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            ← Quay lại danh sách
          </Link>
        </div>

        {/* Ảnh chính */}
        <div className="relative h-[260px] sm:h-[360px] w-full rounded-md overflow-hidden bg-gray-200 mb-3">
          <Image
            src={images[0]}
            alt={property.title || "Ảnh bất động sản"}
            fill
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
            priority
          />
        </div>

        {/* Danh sách ảnh phụ */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
            {images.slice(1).map((src, index) => (
              <div
                key={`${src}-${index}`}
                className="relative w-28 h-20 flex-shrink-0 rounded-md overflow-hidden bg-gray-200"
              >
                <Image
                  src={src}
                  alt={`${property.title} - ảnh ${index + 2}`}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {property.title}
              </h1>

              <FavoriteButton propertyId={property.id} />
            </div>

            <p className="text-gray-500 text-sm mb-4">
              {property.address || "Chưa cập nhật địa chỉ"}

              {property.district ? ` · ${property.district}` : ""}
            </p>

            <div className="flex flex-wrap gap-6 bg-white border border-gray-200 rounded-md p-4 mb-6 dark:border-slate-800 dark:bg-slate-900">
              <div>
                <p className="text-xs text-gray-400 mb-1">Giá</p>

                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  {formatPrice(property.price)}
                </p>
              </div>

              {property.area != null && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Diện tích</p>

                  <p className="text-lg font-semibold text-gray-800 dark:text-slate-100">
                    {formatArea(property.area)}
                  </p>
                </div>
              )}

              {property.bedrooms != null && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Phòng ngủ</p>

                  <p className="text-lg font-semibold text-gray-800">
                    {property.bedrooms}
                  </p>
                </div>
              )}

              {property.categoryId && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Loại hình</p>

                  <p className="text-lg font-semibold text-gray-800">
                    {property.categoryId.name}
                  </p>
                </div>
              )}

              {property.status && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Trạng thái</p>

                  <p className="text-lg font-semibold text-gray-800 dark:text-slate-100">
                    {formatStatus(property.status)}
                  </p>
                </div>
              )}
            </div>

            {property.description ? (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  Mô tả chi tiết
                </h2>

                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {property.description}
                </p>
              </div>
            ) : (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  Mô tả chi tiết
                </h2>

                <p className="text-sm text-gray-400">
                  Tin đăng chưa có mô tả chi tiết.
                </p>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Vị trí</h2>

              <PropertyMap
                latitude={property.latitude}
                longitude={property.longitude}
                title={property.title}
              />
            </div>

            <PropertyReviews propertyId={property.id} />
          </section>

          {/* Thông tin người đăng */}
          <aside className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-md p-4 lg:sticky lg:top-20 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-bold text-gray-900 mb-4">Người đăng tin</h3>

              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 flex-shrink-0 overflow-hidden rounded-full bg-gray-100 border border-gray-200">
                  <Image
                    src={property.sellerId?.avatar || "/default-avatar.png"}
                    alt={`Avatar của ${sellerName}`}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>

                <div className="min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {sellerName}
                  </p>

                  {property.sellerId?.username && (
                    <p className="text-xs text-gray-400 truncate">
                      @{property.sellerId.username}
                    </p>
                  )}
                </div>
              </div>

              {property.sellerId?.phone ? (
                <a
                  href={`tel:${property.sellerId.phone}`}
                  className="mt-4 block text-center bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-md transition-colors"
                >
                  📞 {property.sellerId.phone}
                </a>
              ) : (
                <p className="mt-4 text-sm text-gray-400">
                  Người đăng chưa công khai số điện thoại.
                </p>
              )}

              {property.sellerId?.email && (
                <a
                  href={`mailto:${property.sellerId.email}`}
                  className="mt-2 block text-center border border-gray-300 hover:border-red-400 hover:text-red-600 text-gray-700 font-medium py-2.5 rounded-md transition-colors"
                >
                  Gửi email
                </a>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
