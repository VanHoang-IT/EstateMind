"use client";

import Image from "next/image";
import Link from "next/link";

import MindScoreBadge from "@/components/property/MindScoreBadge";
import { BedDouble, Building2, Globe, MapPin, Ruler } from "lucide-react";

import FavoriteButton from "@/components/FavoriteButton";
import { formatPrice } from "@/lib/format";
import { Property } from "@/types/property";

interface PropertyCardProps {
  property: Property;
  priority?: boolean;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85";

function statusLabel(status?: string, categoryId?: number) {
  const isRent = categoryId != null && categoryId >= 13;

  switch (status) {
    case "AVAILABLE":
      return isRent ? "Đang cho thuê" : "Đang bán";
    case "SOLD":
      return "Đã bán";
    case "RENTED":
      return "Đã cho thuê";
    case "HIDDEN":
      return "Đã ẩn";
    case "INACTIVE":
      return "Không hoạt động";
    default:
      return status || "";
  }
}

export default function PropertyCard({
  property,
  priority = false,
}: PropertyCardProps) {
  const primaryImage =
    property.propertyImagesSet?.find((image) => image.isPrimary)?.imageUrl ||
    property.mainImage ||
    property.propertyImagesSet?.[0]?.imageUrl ||
    FALLBACK_IMAGE;

  const isCrawled = Boolean(property.urlCrawl);

  const categoryId = property.categoryId?.id;

  return (
    <article
      className="
        group
        relative
        flex
        h-full
        flex-col
        overflow-hidden
        rounded-xl
        border
        border-[#e2e7e4]
        bg-white
        shadow-[0_8px_28px_rgba(25,45,35,0.04)]
        transition
        duration-300
        hover:-translate-y-1
        hover:shadow-[0_18px_45px_rgba(25,45,35,0.09)]
      "
    >
      <Link
        href={`/properties/${property.id}`}
        className="
          flex
          h-full
          flex-col
        "
      >
        <div
          className="
            relative
            aspect-[16/10]
            overflow-hidden
            bg-[#eef1ef]
          "
        >
          <Image
            src={primaryImage}
            alt={property.title || "Ảnh bất động sản"}
            fill
            priority={priority}
            className="
              object-cover
              transition
              duration-500
              group-hover:scale-[1.035]
            "
            sizes="
              (max-width: 768px) 100vw,
              (max-width: 1200px) 50vw,
              33vw
            "
          />

          {property.status && (
            <span
              className="
                absolute
                left-3
                top-3
                z-10
                rounded-md
                bg-brand
                px-3
                py-1.5
                text-xs
                font-semibold
                text-white
                shadow-sm
              "
            >
              {statusLabel(property.status, categoryId)}
            </span>
          )}

          {isCrawled && (
            <span
              className="
                absolute
                bottom-3
                left-3
                z-10
                inline-flex
                items-center
                gap-1.5
                rounded-md
                bg-black/65
                px-2.5
                py-1.5
                text-[11px]
                font-medium
                text-white
                backdrop-blur-sm
              "
            >
              <Globe size={12} />
              Tin tham khảo
            </span>
          )}
        </div>

        <div
          className="
            flex
            flex-1
            flex-col
            p-5
          "
        >
          <div
            className="
              flex
              flex-wrap
              items-center
              justify-between
              gap-2
            "
          >
            <p
              className="
                text-[26px]
                font-bold
                tracking-[-0.035em]
                text-[#202523]
              "
            >
              {formatPrice(property.price, categoryId)}
            </p>

            <MindScoreBadge score={property.mindScore} />
          </div>

          <h3
            className="
              mt-2
              line-clamp-1
              text-base
              font-semibold
              text-[#2f3934]
            "
          >
            {property.title}
          </h3>

          <div
            className="
              mt-2
              flex
              min-w-0
              items-center
              gap-1.5
              text-sm
              text-[#6b766f]
            "
          >
            <MapPin
              size={15}
              className="
                shrink-0
                text-[#738078]
              "
            />

            <span className="truncate">
              {property.address || property.district || "Chưa cập nhật vị trí"}
            </span>
          </div>

          <div
            className="
              mt-5
              flex
              flex-wrap
              gap-2
            "
          >
            {property.bedrooms != null && (
              <span
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-md
                  bg-[#f0f3f1]
                  px-2.5
                  py-2
                  text-xs
                  font-medium
                  text-[#4f5b54]
                "
              >
                <BedDouble size={15} />
                {property.bedrooms} phòng ngủ
              </span>
            )}

            {property.area != null && (
              <span
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-md
                  bg-[#f0f3f1]
                  px-2.5
                  py-2
                  text-xs
                  font-medium
                  text-[#4f5b54]
                "
              >
                <Ruler size={15} />
                {property.area.toLocaleString("vi-VN")} m²
              </span>
            )}

            {property.categoryId?.name && (
              <span
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-md
                  bg-[#f0f3f1]
                  px-2.5
                  py-2
                  text-xs
                  font-medium
                  text-[#4f5b54]
                "
              >
                <Building2 size={15} />

                <span
                  className="
                    max-w-[110px]
                    truncate
                  "
                >
                  {property.categoryId.name}
                </span>
              </span>
            )}
          </div>
        </div>
      </Link>

      <div
        className="
          absolute
          right-3
          top-3
          z-20
        "
      >
        <FavoriteButton propertyId={property.id} />
      </div>
    </article>
  );
}
