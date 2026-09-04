import Image from "next/image";
import Link from "next/link";
import {
  BedDouble,
  Building2,
  ChevronRight,
  MapPin,
  Ruler,
  Tag,
} from "lucide-react";

import { propertyService } from "@/services/propertyService";
import { Property } from "@/types/property";
import { formatPrice, formatPricePerM2, isRentCategory } from "@/lib/format";
import PropertyMap from "@/components/PropertyMap";
import PropertyReviews from "@/components/PropertyReviews";
import FavoriteButton from "@/components/FavoriteButton";
import ValuationSummary from "@/components/property/ValuationSummary";
import AmenityList from "@/components/property/AmenityList";
import PropertySpecs from "@/components/property/PropertySpecs";
import PropertyCarousel from "@/components/property/PropertyCarousel";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80";

function formatArea(area?: number): string {
  if (area == null || area <= 0) {
    return "Chưa cập nhật";
  }

  return `${area.toLocaleString("vi-VN", {
    maximumFractionDigits: 2,
  })} m²`;
}

function formatStatus(status?: string, categoryId?: number): string {
  const isRent = isRentCategory(categoryId);

  switch (status?.toUpperCase()) {
    case "AVAILABLE":
      return isRent ? "Đang cho thuê" : "Đang bán";
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
    console.error(`Không thể tải bất động sản có ID ${id}:`, error);

    return (
      <main className="min-h-[60vh] max-w-5xl mx-auto px-4 py-12">
        <div className="rounded-md border border-red-200 bg-red-50 p-6">
          <h1 className="text-lg font-semibold text-red-700">
            Không thể tải thông tin bất động sản
          </h1>

          <p className="mt-2 text-sm text-red-600">
            Dữ liệu hiện không khả dụng. Vui lòng quay lại danh sách và thử lại
            sau.
          </p>

          <Link
            href="/"
            className="inline-block mt-4 text-sm font-medium text-red-600 hover:underline"
          >
            Quay lại danh sách bất động sản
          </Link>
        </div>
      </main>
    );
  }

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

  const images =
    validImageUrls.length > 0 ? [...new Set(validImageUrls)] : [FALLBACK_IMAGE];

  const sellerName = getSellerName(property);

  const categoryId = property.categoryId?.id;

  const isRent = isRentCategory(categoryId);

  const pricePerM2 = formatPricePerM2(
    property.price,
    property.area,
    categoryId,
  );

  return (
    <div className="min-h-screen bg-[#f7f8f7]">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="mb-5 flex items-center gap-1.5 text-sm text-[#8a938d]">
          <Link href="/" className="transition-colors hover:text-[#007a5a]">
            Trang chủ
          </Link>

          <ChevronRight size={14} />

          <Link
            href="/projects"
            className="transition-colors hover:text-[#007a5a]"
          >
            Bất động sản
          </Link>

          <ChevronRight size={14} />

          <span className="truncate font-medium text-[#3d4742]">
            {property.title}
          </span>
        </nav>

        <div className="mb-6 flex flex-col gap-4 border-b border-[#e2e7e4] pb-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-[-0.035em] text-[#202523] lg:text-[38px] lg:leading-[1.15]">
              {property.title}
            </h1>

            <div className="mt-3 flex items-start gap-1.5 text-sm text-[#66716b]">
              <MapPin size={16} className="mt-0.5 shrink-0" />

              <span>
                {property.address ||
                  property.district ||
                  "Chưa cập nhật địa chỉ"}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-4 lg:flex-col lg:items-end lg:gap-2">
            <div className="lg:text-right">
              <p className="text-3xl font-bold text-[#007a5a]">
                {formatPrice(property.price, categoryId)}
              </p>

              {pricePerM2 && (
                <p className="mt-1 text-sm text-[#8a938d]">{pricePerM2}</p>
              )}
            </div>

            <FavoriteButton propertyId={property.id} />
          </div>
        </div>

        <PropertyCarousel images={images} title={property.title} />

        <div className="mb-8 flex flex-wrap gap-2.5">
          {property.bedrooms != null && (
            <span className="inline-flex items-center gap-2 rounded-lg border border-[#e2e7e4] bg-white px-4 py-2.5 text-sm font-medium text-[#3d4742]">
              <BedDouble size={17} className="text-[#738078]" />
              {property.bedrooms} phòng ngủ
            </span>
          )}

          {property.area != null && (
            <span className="inline-flex items-center gap-2 rounded-lg border border-[#e2e7e4] bg-white px-4 py-2.5 text-sm font-medium text-[#3d4742]">
              <Ruler size={17} className="text-[#738078]" />
              {formatArea(property.area)}
            </span>
          )}

          {property.categoryId?.name && (
            <span className="inline-flex items-center gap-2 rounded-lg border border-[#e2e7e4] bg-white px-4 py-2.5 text-sm font-medium text-[#3d4742]">
              <Building2 size={17} className="text-[#738078]" />
              {property.categoryId.name}
            </span>
          )}

          {property.status && (
            <span className="inline-flex items-center gap-2 rounded-lg border border-[#e2e7e4] bg-white px-4 py-2.5 text-sm font-medium text-[#3d4742]">
              <Tag size={17} className="text-[#738078]" />
              {formatStatus(property.status, categoryId)}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <section className="lg:col-span-2">
            {!isRent && (
              <ValuationSummary
                price={property.price}
                predictedPrice={property.predictedPrice}
                mindScore={property.mindScore}
              />
            )}

            <div className="mb-8">
              <h2 className="mb-3 text-xl font-bold text-[#202523]">
                Mô tả chi tiết
              </h2>

              {property.description ? (
                <p className="whitespace-pre-line leading-relaxed text-[#4a544e]">
                  {property.description}
                </p>
              ) : (
                <p className="text-sm text-gray-400">
                  Tin đăng chưa có mô tả chi tiết.
                </p>
              )}
            </div>

            <PropertySpecs attributes={property.attributes} />

            <AmenityList amenities={property.amenities} />

            <div className="mb-8">
              <h2 className="mb-3 text-xl font-bold text-[#202523]">Vị trí</h2>

              <p className="mb-3 text-sm text-[#66716b]">
                {property.address || property.district || "Chưa cập nhật"}
              </p>

              <PropertyMap
                latitude={property.latitude}
                longitude={property.longitude}
                title={property.title}
              />
            </div>

            <PropertyReviews propertyId={property.id} />
          </section>

          <aside className="lg:col-span-1">
            <div className="rounded-xl border border-[#e2e7e4] bg-white p-5 lg:sticky lg:top-20">
              <h3 className="mb-4 font-bold text-[#202523]">Người đăng tin</h3>

              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                  <Image
                    src={property.sellerId?.avatar || "/default-avatar.png"}
                    alt={`Avatar của ${sellerName}`}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>

                <div className="min-w-0">
                  <p className="truncate font-medium text-[#3d4742]">
                    {sellerName}
                  </p>

                  {property.sellerId?.username && (
                    <p className="truncate text-xs text-[#9ba49f]">
                      @{property.sellerId.username}
                    </p>
                  )}
                </div>
              </div>

              {property.sellerId?.phone ? (
                <a
                  href={`tel:${property.sellerId.phone}`}
                  className="mt-4 block rounded-lg bg-[#007a5a] py-2.5 text-center font-semibold text-white transition-colors hover:bg-[#006648]"
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
                  className="mt-2 block rounded-lg border border-[#e2e7e4] py-2.5 text-center font-medium text-[#3d4742] transition-colors hover:border-[#007a5a] hover:text-[#007a5a]"
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
