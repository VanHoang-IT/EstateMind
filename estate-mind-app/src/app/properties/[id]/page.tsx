import Image from "next/image";
import { notFound } from "next/navigation";
import { propertyService } from "@/services/propertyService";
import PropertyMap from "@/components/PropertyMap";
import PropertyReviews from "@/components/PropertyReviews";
import FavoriteButton from "@/components/FavoriteButton";

interface Props {
  params: Promise<{ id: string }>;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80";

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;

  let property;
  try {
    property = await propertyService.getPropertyById(id);
  } catch {
    notFound();
  }

  const images =
    property.propertyImagesSet && property.propertyImagesSet.length > 0
      ? property.propertyImagesSet.map((img) => img.imageUrl)
      : [FALLBACK_IMAGE];

  return (
    <div className="min-h-screen bg-gray-50/30">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Gallery đơn giản: ảnh chính + dải ảnh nhỏ bên dưới */}
        <div className="relative h-[360px] w-full rounded-md overflow-hidden bg-gray-200 mb-3">
          <Image src={images[0]} alt={property.title} fill className="object-cover" priority />
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto mb-8">
            {images.slice(1).map((src, i) => (
              <div key={i} className="relative w-28 h-20 flex-shrink-0 rounded-md overflow-hidden bg-gray-200">
                <Image src={src} alt={`${property.title} - ${i + 2}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
              <FavoriteButton propertyId={property.id} />
            </div>

            <p className="text-gray-500 text-sm mb-4">
              {property.address}
              {property.district ? ` · ${property.district}` : ""}
            </p>

            <div className="flex flex-wrap gap-6 bg-white border border-gray-200 rounded-md p-4 mb-6">
              <div>
                <p className="text-xs text-gray-400 mb-1">Giá</p>
                <p className="text-xl font-bold text-red-600">
                  {property.price ? `${property.price.toLocaleString("vi-VN")} tỷ` : "Thỏa thuận"}
                </p>
              </div>
              {property.area && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Diện tích</p>
                  <p className="text-lg font-semibold text-gray-800">{property.area} m²</p>
                </div>
              )}
              {property.bedrooms != null && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Phòng ngủ</p>
                  <p className="text-lg font-semibold text-gray-800">{property.bedrooms}</p>
                </div>
              )}
              {property.categoryId && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Loại hình</p>
                  <p className="text-lg font-semibold text-gray-800">{property.categoryId.name}</p>
                </div>
              )}
            </div>

            {property.description && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-2">Mô tả chi tiết</h2>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{property.description}</p>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Vị trí</h2>
              <PropertyMap latitude={property.latitude} longitude={property.longitude} title={property.title} />
            </div>

            <PropertyReviews propertyId={property.id} />
          </div>

          {/* Thông tin liên hệ người bán */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-md p-4 sticky top-20">
              <h3 className="font-bold text-gray-900 mb-3">Người đăng tin</h3>
              <p className="font-medium text-gray-800">
                {property.sellerId?.firstName || property.sellerId?.username || "Ẩn danh"}
              </p>
              {property.sellerId?.phone && (
                <a
                  href={`tel:${property.sellerId.phone}`}
                  className="mt-3 block text-center bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-md transition-colors"
                >
                  📞 {property.sellerId.phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
