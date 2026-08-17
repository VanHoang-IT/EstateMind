import Image from "next/image";
import Link from "next/link";

import { ArrowRight, MapPin } from "lucide-react";

import { Property } from "@/types/property";

import { formatPrice } from "@/lib/format";

import PropertyModerationBadge from "@/components/admin/PropertyModerationBadge";

interface Props {
  properties: Property[];
}

function sellerName(property: Property) {
  const seller = property.sellerId;

  if (!seller) {
    return "Người bán chưa xác định";
  }

  return (
    [seller.firstName, seller.lastName].filter(Boolean).join(" ") ||
    seller.username ||
    "Người bán chưa xác định"
  );
}

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default function PropertyModerationTable({ properties }: Props) {
  if (properties.length === 0) {
    return (
      <div
        className="
          rounded-2xl
          border
          border-dashed
          border-[#cfd8d3]
          bg-white
          py-16
          text-center
          text-sm
          text-[#7b867f]
        "
      >
        Không tìm thấy tin đăng nào.
      </div>
    );
  }

  return (
    <div
      className="
        overflow-hidden
        rounded-2xl
        border
        border-[#e0e6e2]
        bg-white
        shadow-[0_10px_35px_rgba(25,50,38,0.04)]
      "
    >
      <div className="overflow-x-auto">
        <table
          className="
            w-full
            min-w-[850px]
            border-collapse
          "
        >
          <thead>
            <tr
              className="
                border-b
                border-border
                bg-[#f7f9f8]
                text-left
                text-[11px]
                font-bold
                uppercase
                tracking-[0.08em]
                text-[#6d7972]
              "
            >
              <th className="px-5 py-4">Bất động sản</th>

              <th className="px-5 py-4">Người bán</th>

              <th className="px-5 py-4">Ngày gửi</th>

              <th className="px-5 py-4">Trạng thái</th>

              <th
                className="
                  px-5
                  py-4
                  text-right
                "
              >
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody>
            {properties.map((property) => (
              <tr
                key={property.id}
                className="
                    border-b
                    border-[#edf0ee]
                    last:border-b-0
                    hover:bg-[#fbfcfb]
                  "
              >
                <td className="px-5 py-4">
                  <div
                    className="
                        flex
                        items-center
                        gap-4
                      "
                  >
                    <div
                      className="
                          relative
                          h-16
                          w-24
                          shrink-0
                          overflow-hidden
                          rounded-lg
                          bg-[#eef1ef]
                        "
                    >
                      {property.mainImage && (
                        <Image
                          src={property.mainImage}
                          alt={property.title}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p
                        className="
                            max-w-[270px]
                            truncate
                            font-semibold
                            text-[#26312b]
                          "
                      >
                        {property.title}
                      </p>

                      <p
                        className="
                            mt-1
                            text-sm
                            font-bold
                            text-brand
                          "
                      >
                        {formatPrice(property.price, property.categoryId?.id)}
                      </p>

                      <p
                        className="
                            mt-1
                            flex
                            max-w-[270px]
                            items-center
                            gap-1
                            truncate
                            text-xs
                            text-[#7b867f]
                          "
                      >
                        <MapPin size={13} />

                        {property.address || "Chưa cập nhật địa chỉ"}
                      </p>
                    </div>
                  </div>
                </td>

                <td
                  className="
                      px-5
                      py-4
                      text-sm
                      text-[#59655f]
                    "
                >
                  {sellerName(property)}
                </td>

                <td
                  className="
                      px-5
                      py-4
                      text-sm
                      text-[#6b766f]
                    "
                >
                  {formatDate(property.createdAt)}
                </td>

                <td className="px-5 py-4">
                  <PropertyModerationBadge status={property.moderationStatus} />
                </td>

                <td
                  className="
                      px-5
                      py-4
                      text-right
                    "
                >
                  <Link
                    href={`/admin/properties/${property.id}`}
                    className="
                        inline-flex
                        items-center
                        gap-1.5
                        rounded-lg
                        border
                        border-[#d5ddd8]
                        px-3
                        py-2
                        text-sm
                        font-semibold
                        text-[#536059]
                        transition
                        hover:border-brand
                        hover:text-brand
                      "
                  >
                    Xem xét
                    <ArrowRight size={15} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
