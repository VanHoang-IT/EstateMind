"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import {
  ArrowLeft,
  BedDouble,
  Building2,
  CalendarDays,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Ruler,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

import { adminPropertyService } from "@/services/adminPropertyService";
import { Property } from "@/types/property";
import { formatPrice } from "@/lib/format";

import PropertyCarousel from "@/components/property/PropertyCarousel";
import PropertyMap from "@/components/PropertyMap";

function formatDate(value?: string | null) {
  if (!value) {
    return "Chưa có dữ liệu";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getModerationStyles(status?: string) {
  switch (status?.toUpperCase()) {
    case "APPROVED":
      return {
        label: "Đã duyệt",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };

    case "REJECTED":
      return {
        label: "Đã từ chối",
        className: "border-red-200 bg-red-50 text-red-700",
      };

    case "PENDING":
    default:
      return {
        label: "Chờ duyệt",
        className: "border-amber-200 bg-amber-50 text-amber-700",
      };
  }
}

function getPropertyStatusLabel(status?: string | null) {
  switch (status?.toUpperCase()) {
    case "AVAILABLE":
      return "Đang hiển thị";
    case "SOLD":
      return "Đã bán";
    case "RENTED":
      return "Đã cho thuê";
    case "INACTIVE":
      return "Không hoạt động";
    case "HIDDEN":
      return "Đã ẩn";
    case "DRAFT":
      return "Bản nháp";
    default:
      return status || "Chưa có dữ liệu";
  }
}

export default function AdminPropertyDetailPage() {
  const params = useParams();

  const rawId = params.id;

  const propertyId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [property, setProperty] = useState<Property | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [actionBusy, setActionBusy] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);

  const [rejectReason, setRejectReason] = useState("");

  const [rejectError, setRejectError] = useState<string | null>(null);

  /*
   * =====================================================
   * LOAD PROPERTY
   * =====================================================
   */
  useEffect(() => {
    if (!propertyId) {
      return;
    }

    let ignore = false;

    adminPropertyService
      .getPropertyById(propertyId)
      .then((result) => {
        if (ignore) {
          return;
        }

        setProperty(result);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (ignore) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Không thể tải thông tin tin đăng.",
        );
      })
      .finally(() => {
        if (ignore) {
          return;
        }

        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [propertyId]);

  /*
   * =====================================================
   * APPROVE PROPERTY
   * =====================================================
   */
  async function handleApprove() {
    if (!property || actionBusy) {
      return;
    }

    const confirmed = window.confirm("Bạn có chắc muốn duyệt tin đăng này?");

    if (!confirmed) {
      return;
    }

    setActionBusy(true);
    setError(null);

    try {
      const result = await adminPropertyService.approveProperty(property.id);

      setProperty((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          moderationStatus: result.moderationStatus,
          rejectionReason: "",
        };
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể duyệt tin đăng.",
      );
    } finally {
      setActionBusy(false);
    }
  }

  /*
   * =====================================================
   * OPEN REJECT MODAL
   * =====================================================
   */
  function openRejectModal() {
    if (actionBusy) {
      return;
    }

    setRejectReason("");
    setRejectError(null);
    setRejectOpen(true);
  }

  /*
   * =====================================================
   * CLOSE REJECT MODAL
   * =====================================================
   */
  function closeRejectModal() {
    if (actionBusy) {
      return;
    }

    setRejectOpen(false);
    setRejectReason("");
    setRejectError(null);
  }

  /*
   * =====================================================
   * REJECT PROPERTY
   * =====================================================
   */
  async function handleReject() {
    if (!property || actionBusy) {
      return;
    }

    const reason = rejectReason.trim();

    if (!reason) {
      setRejectError("Vui lòng nhập lý do từ chối tin đăng.");
      return;
    }

    setActionBusy(true);
    setRejectError(null);
    setError(null);

    try {
      const result = await adminPropertyService.rejectProperty(
        property.id,
        reason,
      );

      setProperty((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          moderationStatus: result.moderationStatus,
          rejectionReason: result.rejectionReason,
        };
      });

      setRejectOpen(false);
      setRejectReason("");
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Không thể từ chối tin đăng.";

      setRejectError(message);
    } finally {
      setActionBusy(false);
    }
  }

  /*
   * =====================================================
   * LOADING
   * =====================================================
   */
  if (loading) {
    return (
      <div
        className="
          grid
          min-h-[60vh]
          place-items-center
        "
      >
        <div
          className="
            flex
            flex-col
            items-center
            gap-3
          "
        >
          <div
            className="
              h-9
              w-9
              animate-spin
              rounded-full
              border-2
              border-[#dce4df]
              border-t-brand
            "
          />

          <p
            className="
              text-sm
              text-[#7a857f]
            "
          >
            Đang tải tin đăng...
          </p>
        </div>
      </div>
    );
  }

  /*
   * =====================================================
   * LOAD ERROR
   * =====================================================
   */
  if (error && !property) {
    return (
      <div
        className="
          mx-auto
          max-w-4xl
          px-5
          py-10
        "
      >
        <Link
          href="/admin/properties"
          className="
            inline-flex
            items-center
            gap-2
            text-sm
            font-semibold
            text-brand
          "
        >
          <ArrowLeft size={17} />
          Quay lại danh sách tin đăng
        </Link>

        <div
          className="
            mt-6
            rounded-2xl
            border
            border-red-200
            bg-red-50
            p-6
          "
        >
          <h1
            className="
              text-lg
              font-bold
              text-red-800
            "
          >
            Không thể tải tin đăng
          </h1>

          <p
            className="
              mt-2
              break-words
              text-sm
              leading-6
              text-red-700
            "
          >
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!property) {
    return null;
  }

  /*
   * =====================================================
   * PROPERTY IMAGES
   * =====================================================
   */
  const propertyImages = property.propertyImagesSet
    ? [...property.propertyImagesSet]
        .sort(
          (a, b) => Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary)),
        )
        .map((image) => image.imageUrl)
    : [];

  const images = Array.from(
    new Set(
      [property.mainImage, ...propertyImages].filter(
        (image): image is string =>
          typeof image === "string" && image.trim().length > 0,
      ),
    ),
  );

  /*
   * =====================================================
   * SELLER
   * =====================================================
   */
  const seller = property.sellerId;

  const sellerName =
    [seller?.firstName, seller?.lastName].filter(Boolean).join(" ").trim() ||
    seller?.username ||
    "Người bán chưa xác định";

  const moderation = getModerationStyles(property.moderationStatus);

  return (
    <>
      <div
        className="
          min-h-screen
          bg-[#f7f8f7]
        "
      >
        <div
          className="
            mx-auto
            max-w-[1180px]
            px-5
            py-8
            sm:px-6
            lg:py-10
          "
        >
          {/* BACK */}
          <Link
            href="/admin/properties"
            className="
              inline-flex
              items-center
              gap-2
              text-sm
              font-semibold
              text-[#627068]
              transition
              hover:text-brand
            "
          >
            <ArrowLeft size={17} />
            Quay lại danh sách tin đăng
          </Link>

          {/* HEADER */}
          <div
            className="
              mt-6
              flex
              flex-col
              gap-5
              lg:flex-row
              lg:items-start
              lg:justify-between
            "
          >
            <div
              className="
                min-w-0
                max-w-3xl
              "
            >
              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  gap-2
                "
              >
                {/* MODERATION STATUS */}
                <span
                  className={`
                    inline-flex
                    items-center
                    rounded-full
                    border
                    px-3
                    py-1
                    text-xs
                    font-bold
                    ${moderation.className}
                  `}
                >
                  {moderation.label}
                </span>

                {/* PROPERTY STATUS */}
                {property.status && (
                  <span
                    className="
                      inline-flex
                      items-center
                      rounded-full
                      border
                      border-[#dce4df]
                      bg-white
                      px-3
                      py-1
                      text-xs
                      font-semibold
                      text-[#647169]
                    "
                  >
                    {getPropertyStatusLabel(property.status)}
                  </span>
                )}

                <span
                  className="
                    text-xs
                    text-[#909992]
                  "
                >
                  Tin đăng #{property.id}
                </span>
              </div>

              {/* TITLE */}
              <h1
                className="
                  mt-4
                  text-3xl
                  font-bold
                  tracking-[-0.04em]
                  text-[#202523]
                  sm:text-4xl
                "
              >
                {property.title}
              </h1>

              {/* ADDRESS */}
              <div
                className="
                  mt-3
                  flex
                  items-start
                  gap-2
                  text-sm
                  text-[#68756e]
                "
              >
                <MapPin
                  size={17}
                  className="
                    mt-0.5
                    shrink-0
                    text-brand
                  "
                />

                <span>
                  {property.address || "Chưa có thông tin vị trí"}

                  {property.district ? `, ${property.district}` : ""}
                </span>
              </div>
            </div>

            {/* MODERATION ACTIONS */}
            <div
              className="
                flex
                shrink-0
                flex-wrap
                gap-3
              "
            >
              {property.moderationStatus !== "APPROVED" && (
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={actionBusy}
                  className="
                    inline-flex
                    h-11
                    items-center
                    justify-center
                    gap-2
                    rounded-lg
                    bg-brand
                    px-5
                    text-sm
                    font-semibold
                    text-white
                    transition
                    hover:bg-brand-hover
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  <CheckCircle2 size={18} />

                  {actionBusy ? "Đang xử lý..." : "Duyệt tin"}
                </button>
              )}

              {property.moderationStatus !== "REJECTED" && (
                <button
                  type="button"
                  onClick={openRejectModal}
                  disabled={actionBusy}
                  className="
                    inline-flex
                    h-11
                    items-center
                    justify-center
                    gap-2
                    rounded-lg
                    border
                    border-red-200
                    bg-white
                    px-5
                    text-sm
                    font-semibold
                    text-red-600
                    transition
                    hover:bg-red-50
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  <XCircle size={18} />
                  Từ chối
                </button>
              )}
            </div>
          </div>

          {/* ACTION ERROR */}
          {error && (
            <div
              className="
                mt-5
                rounded-xl
                border
                border-red-200
                bg-red-50
                px-4
                py-3
                text-sm
                text-red-700
              "
            >
              {error}
            </div>
          )}

          {/* REJECTION REASON */}
          {property.moderationStatus === "REJECTED" &&
            property.rejectionReason && (
              <div
                className="
                  mt-6
                  rounded-xl
                  border
                  border-red-200
                  bg-red-50
                  p-4
                "
              >
                <p
                  className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-[0.08em]
                    text-red-700
                  "
                >
                  Lý do từ chối
                </p>

                <p
                  className="
                    mt-2
                    text-sm
                    leading-6
                    text-red-800
                  "
                >
                  {property.rejectionReason}
                </p>
              </div>
            )}

          <div className="mt-7">
            <PropertyCarousel images={images} title={property.title} />
          </div>

          {/* MAIN CONTENT */}
          <div
            className="
              mt-8
              grid
              gap-7
              lg:grid-cols-[minmax(0,1fr)_340px]
            "
          >
            {/* LEFT COLUMN */}
            <div className="space-y-7">
              {/* PRICE + SPECS */}
              <section
                className="
                  rounded-2xl
                  border
                  border-border
                  bg-white
                  p-6
                "
              >
                <p
                  className="
                    text-3xl
                    font-bold
                    tracking-[-0.04em]
                    text-brand
                  "
                >
                  {formatPrice(property.price, property.categoryId?.id)}
                </p>

                <div
                  className="
                    mt-5
                    flex
                    flex-wrap
                    gap-2
                  "
                >
                  {/* BEDROOMS */}
                  {property.bedrooms != null && (
                    <span
                      className="
                        inline-flex
                        items-center
                        gap-2
                        rounded-lg
                        bg-[#f1f5f2]
                        px-3
                        py-2
                        text-sm
                        font-medium
                        text-[#516058]
                      "
                    >
                      <BedDouble size={17} className="text-brand" />
                      {property.bedrooms} phòng ngủ
                    </span>
                  )}

                  {/* AREA */}
                  {property.area != null && (
                    <span
                      className="
                        inline-flex
                        items-center
                        gap-2
                        rounded-lg
                        bg-[#f1f5f2]
                        px-3
                        py-2
                        text-sm
                        font-medium
                        text-[#516058]
                      "
                    >
                      <Ruler size={17} className="text-brand" />
                      {property.area.toLocaleString("vi-VN")} m²
                    </span>
                  )}

                  {/* CATEGORY */}
                  {property.categoryId?.name && (
                    <span
                      className="
                        inline-flex
                        items-center
                        gap-2
                        rounded-lg
                        bg-[#f1f5f2]
                        px-3
                        py-2
                        text-sm
                        font-medium
                        text-[#516058]
                      "
                    >
                      <Building2 size={17} className="text-brand" />

                      {property.categoryId.name}
                    </span>
                  )}
                </div>
              </section>

              {/* DESCRIPTION */}
              <section
                className="
                  rounded-2xl
                  border
                  border-border
                  bg-white
                  p-6
                "
              >
                <h2
                  className="
                    text-xl
                    font-bold
                    text-[#242b27]
                  "
                >
                  Mô tả
                </h2>

                <p
                  className="
                    mt-4
                    whitespace-pre-line
                    text-sm
                    leading-7
                    text-[#66736c]
                  "
                >
                  {property.description || "Chưa có mô tả."}
                </p>
              </section>

              {/* ===================================================
                  GOOGLE MAPS
                  =================================================== */}
              <section
                className="
                  rounded-2xl
                  border
                  border-border
                  bg-white
                  p-6
                "
              >
                <div
                  className="
                    mb-5
                    flex
                    flex-col
                    gap-1
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      gap-2
                    "
                  >
                    <MapPin size={20} className="text-brand" />

                    <h2
                      className="
                        text-xl
                        font-bold
                        text-[#242b27]
                      "
                    >
                      Vị trí bất động sản
                    </h2>
                  </div>

                  <p
                    className="
                      text-sm
                      leading-6
                      text-[#748078]
                    "
                  >
                    Kiểm tra vị trí địa lý được cung cấp cho tin đăng này.
                  </p>
                </div>

                {/* GOOGLE MAP */}
                <PropertyMap
                  latitude={property.latitude}
                  longitude={property.longitude}
                  title={property.title}
                />

                {/* COORDINATES */}
                {(property.latitude != null || property.longitude != null) && (
                  <div
                    className="
                      mt-4
                      flex
                      flex-wrap
                      gap-x-8
                      gap-y-2
                      rounded-xl
                      bg-[#f5f7f6]
                      px-4
                      py-3
                      text-xs
                      text-[#69756e]
                    "
                  >
                    <span>
                      <strong
                        className="
                          font-semibold
                          text-[#3e4a43]
                        "
                      >
                        Vĩ độ:
                      </strong>{" "}
                      {property.latitude ?? "Chưa có dữ liệu"}
                    </span>

                    <span>
                      <strong
                        className="
                          font-semibold
                          text-[#3e4a43]
                        "
                      >
                        Kinh độ:
                      </strong>{" "}
                      {property.longitude ?? "Chưa có dữ liệu"}
                    </span>
                  </div>
                )}

                {/* ADDRESS UNDER MAP */}
                <div
                  className="
                    mt-4
                    flex
                    items-start
                    gap-2
                    text-sm
                    leading-6
                    text-[#65726b]
                  "
                >
                  <MapPin
                    size={16}
                    className="
                      mt-1
                      shrink-0
                      text-brand
                    "
                  />

                  <span>
                    {property.address || "Chưa có địa chỉ"}

                    {property.district ? `, ${property.district}` : ""}
                  </span>
                </div>
              </section>

              {/* LISTING META */}
              <section
                className="
                  rounded-2xl
                  border
                  border-border
                  bg-white
                  p-6
                "
              >
                <h2
                  className="
                    text-xl
                    font-bold
                    text-[#242b27]
                  "
                >
                  Thông tin tin đăng
                </h2>

                <div
                  className="
                    mt-5
                    grid
                    gap-5
                    sm:grid-cols-2
                  "
                >
                  {/* CREATED */}
                  <div>
                    <p
                      className="
                        text-xs
                        font-semibold
                        uppercase
                        tracking-[0.07em]
                        text-[#8a958f]
                      "
                    >
                      Ngày tạo
                    </p>

                    <p
                      className="
                        mt-1.5
                        flex
                        items-center
                        gap-2
                        text-sm
                        text-[#4f5c55]
                      "
                    >
                      <CalendarDays size={16} className="text-brand" />

                      {formatDate(property.createdAt)}
                    </p>
                  </div>

                  {/* UPDATED */}
                  <div>
                    <p
                      className="
                        text-xs
                        font-semibold
                        uppercase
                        tracking-[0.07em]
                        text-[#8a958f]
                      "
                    >
                      Cập nhật lần cuối
                    </p>

                    <p
                      className="
                        mt-1.5
                        flex
                        items-center
                        gap-2
                        text-sm
                        text-[#4f5c55]
                      "
                    >
                      <CalendarDays size={16} className="text-brand" />

                      {formatDate(property.updatedAt)}
                    </p>
                  </div>

                  {/* PROPERTY ID */}
                  <div>
                    <p
                      className="
                        text-xs
                        font-semibold
                        uppercase
                        tracking-[0.07em]
                        text-[#8a958f]
                      "
                    >
                      Mã bất động sản
                    </p>

                    <p
                      className="
                        mt-1.5
                        text-sm
                        font-semibold
                        text-[#4f5c55]
                      "
                    >
                      #{property.id}
                    </p>
                  </div>

                  {/* STATUS */}
                  <div>
                    <p
                      className="
                        text-xs
                        font-semibold
                        uppercase
                        tracking-[0.07em]
                        text-[#8a958f]
                      "
                    >
                      Trạng thái bất động sản
                    </p>

                    <p
                      className="
                        mt-1.5
                        text-sm
                        font-semibold
                        text-[#4f5c55]
                      "
                    >
                      {getPropertyStatusLabel(property.status)}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* =====================================================
                SELLER COLUMN
                ===================================================== */}
            <aside
              className="
                h-fit
                rounded-2xl
                border
                border-border
                bg-white
                p-6
                lg:sticky
                lg:top-24
              "
            >
              <h2
                className="
                  text-lg
                  font-bold
                  text-[#242b27]
                "
              >
                Thông tin người bán
              </h2>

              <div
                className="
                  mt-5
                  flex
                  items-center
                  gap-3
                "
              >
                <div
                  className="
                    grid
                    h-12
                    w-12
                    shrink-0
                    place-items-center
                    rounded-full
                    bg-brand-soft
                    text-brand
                  "
                >
                  <UserRound size={21} />
                </div>

                <div className="min-w-0">
                  <p
                    className="
                      truncate
                      text-sm
                      font-bold
                      text-[#303933]
                    "
                  >
                    {sellerName}
                  </p>

                  {seller?.username && (
                    <p
                      className="
                        mt-0.5
                        truncate
                        text-xs
                        text-[#849089]
                      "
                    >
                      @{seller.username}
                    </p>
                  )}
                </div>
              </div>

              {/* SELLER CONTACT */}
              <div
                className="
                  mt-5
                  space-y-3
                "
              >
                {seller?.email && (
                  <div
                    className="
                      flex
                      items-start
                      gap-2
                      text-sm
                      text-[#66736c]
                    "
                  >
                    <Mail
                      size={16}
                      className="
                        mt-0.5
                        shrink-0
                        text-brand
                      "
                    />

                    <span
                      className="
                        break-all
                      "
                    >
                      {seller.email}
                    </span>
                  </div>
                )}

                {seller?.phone && (
                  <div
                    className="
                      flex
                      items-center
                      gap-2
                      text-sm
                      text-[#66736c]
                    "
                  >
                    <Phone
                      size={16}
                      className="
                        shrink-0
                        text-brand
                      "
                    />

                    {seller.phone}
                  </div>
                )}
              </div>

              {/* SELLER ID */}
              <div
                className="
                  mt-6
                  border-t
                  border-border
                  pt-5
                "
              >
                <p
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-[0.07em]
                    text-[#8a958f]
                  "
                >
                  Mã người bán
                </p>

                <p
                  className="
                    mt-1
                    text-sm
                    font-semibold
                    text-[#3e4a43]
                  "
                >
                  {seller?.id ?? "Chưa có dữ liệu"}
                </p>
              </div>

              {/* MODERATION */}
              <div
                className="
                  mt-5
                  border-t
                  border-border
                  pt-5
                "
              >
                <p
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-[0.07em]
                    text-[#8a958f]
                  "
                >
                  Trạng thái kiểm duyệt
                </p>

                <span
                  className={`
                    mt-2
                    inline-flex
                    rounded-full
                    border
                    px-3
                    py-1
                    text-xs
                    font-bold
                    ${moderation.className}
                  `}
                >
                  {moderation.label}
                </span>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* =========================================================
          REJECT MODAL
          ========================================================= */}
      {rejectOpen && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-black/45
            px-4
            backdrop-blur-[2px]
          "
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeRejectModal();
            }
          }}
        >
          <div
            className="
              w-full
              max-w-lg
              overflow-hidden
              rounded-2xl
              bg-white
              shadow-[0_24px_80px_rgba(0,0,0,0.22)]
            "
          >
            {/* MODAL HEADER */}
            <div
              className="
                flex
                items-start
                justify-between
                gap-4
                border-b
                border-border
                px-6
                py-5
              "
            >
              <div>
                <h2
                  className="
                    text-xl
                    font-bold
                    text-[#202523]
                  "
                >
                  Từ chối tin đăng
                </h2>

                <p
                  className="
                    mt-1
                    text-sm
                    leading-6
                    text-[#748078]
                  "
                >
                  Vui lòng nhập lý do tin đăng này không thể được duyệt.
                </p>
              </div>

              <button
                type="button"
                onClick={closeRejectModal}
                disabled={actionBusy}
                aria-label="Đóng"
                className="
                  grid
                  h-9
                  w-9
                  shrink-0
                  place-items-center
                  rounded-lg
                  text-[#68756e]
                  transition
                  hover:bg-[#f1f4f2]
                  hover:text-[#263029]
                  disabled:opacity-50
                "
              >
                <X size={19} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div
              className="
                px-6
                py-5
              "
            >
              <label
                htmlFor="reject-reason"
                className="
                  block
                  text-sm
                  font-semibold
                  text-[#38443d]
                "
              >
                Lý do từ chối
              </label>

              <textarea
                id="reject-reason"
                rows={5}
                value={rejectReason}
                disabled={actionBusy}
                onChange={(event) => {
                  setRejectReason(event.target.value);

                  if (rejectError) {
                    setRejectError(null);
                  }
                }}
                placeholder="Ví dụ: Tin đăng có thông tin chưa đầy đủ hoặc không chính xác..."
                className="
                  mt-2
                  w-full
                  resize-none
                  rounded-xl
                  border
                  border-[#d7dfda]
                  px-4
                  py-3
                  text-sm
                  leading-6
                  text-[#303933]
                  outline-none
                  transition
                  placeholder:text-[#9ba49f]
                  focus:border-brand
                  focus:ring-2
                  focus:ring-brand/10
                  disabled:bg-[#f5f7f6]
                "
              />

              {rejectError && (
                <p
                  className="
                    mt-2
                    text-sm
                    text-red-600
                  "
                >
                  {rejectError}
                </p>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div
              className="
                flex
                justify-end
                gap-3
                border-t
                border-border
                bg-[#fafbfa]
                px-6
                py-4
              "
            >
              <button
                type="button"
                onClick={closeRejectModal}
                disabled={actionBusy}
                className="
                  inline-flex
                  h-10
                  items-center
                  justify-center
                  rounded-lg
                  border
                  border-[#d8dfdb]
                  bg-white
                  px-4
                  text-sm
                  font-semibold
                  text-[#526059]
                  transition
                  hover:bg-[#f3f5f4]
                  disabled:opacity-50
                "
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleReject}
                disabled={actionBusy || !rejectReason.trim()}
                className="
                  inline-flex
                  h-10
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  bg-red-600
                  px-4
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-red-700
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <XCircle size={17} />

                {actionBusy ? "Đang xử lý..." : "Từ chối tin đăng"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
