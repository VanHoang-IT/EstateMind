"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { propertyService } from "@/services/propertyService";
import { ModerationStatus, Property } from "@/types/property";
import { formatPrice } from "@/lib/format";

const STATUS_OPTIONS: {
  value: ModerationStatus | "";
  label: string;
}[] = [
  { value: "", label: "Tất cả" },
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Đã từ chối" },
];

function statusBadge(status?: ModerationStatus) {
  switch (status) {
    case "PENDING":
      return (
        <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
          Chờ duyệt
        </span>
      );

    case "APPROVED":
      return (
        <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
          Đã duyệt
        </span>
      );

    case "REJECTED":
      return (
        <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
          Đã từ chối
        </span>
      );

    default:
      return null;
  }
}

export default function MyPropertiesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [properties, setProperties] = useState<Property[]>([]);
  const [statusFilter, setStatusFilter] = useState<ModerationStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.userRole !== "ROLE_SELLER")) {
      const timer = setTimeout(() => router.replace("/"), 0);
      return () => clearTimeout(timer);
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || !user || user.userRole !== "ROLE_SELLER") {
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);

      try {
        const data = await propertyService.getProperties({
          sellerId: user.id,
          ...(statusFilter ? { moderationStatus: statusFilter } : {}),
          page: 1,
          size: 50,
        });

        setProperties(data.items ?? []);
        setError(null);
      } catch {
        setError("Không thể tải danh sách tin đăng.");
      } finally {
        setLoading(false);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [authLoading, user, statusFilter]);

  if (authLoading || !user || user.userRole !== "ROLE_SELLER") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-500">
        Đang tải...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Tin đăng của tôi</h1>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as ModerationStatus | "")
              }
              aria-label="Lọc tin đăng theo trạng thái"
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:outline-none"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <Link
              href="/"
              className="text-sm font-medium text-red-500 hover:text-red-600"
            >
              ← Về Trang chủ
            </Link>
          </div>
        </div>

        {loading && (
          <div className="flex min-h-40 items-center justify-center text-gray-500">
            Đang tải danh sách tin đăng...
          </div>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {!loading && !error && properties.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
            Chưa có tin đăng nào.
          </div>
        )}

        {!loading && !error && properties.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <div
                key={property.id}
                className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <Link href={`/properties/${property.id}`}>
                  {property.mainImage && (
                    <img
                      src={property.mainImage}
                      alt={property.title}
                      className="h-40 w-full object-cover"
                    />
                  )}
                </Link>

                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-2">
                    {statusBadge(property.moderationStatus)}
                  </div>

                  <Link href={`/properties/${property.id}`}>
                    <h2 className="line-clamp-2 font-semibold text-gray-900 hover:text-red-600">
                      {property.title}
                    </h2>
                  </Link>

                  <p className="mt-1 line-clamp-1 text-sm text-gray-500">
                    {property.address || "Chưa cập nhật địa chỉ"}
                  </p>

                  <p className="mt-2 font-bold text-red-600">
                    {formatPrice(Number(property.price))}
                  </p>

                  {property.moderationStatus === "PENDING" && (
                    <div className="mt-3">
                      <Link
                        href={`/properties/${property.id}/edit`}
                        className="inline-flex rounded-md border border-red-500 px-3 py-1.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50"
                      >
                        Chỉnh sửa
                      </Link>
                    </div>
                  )}

                  {property.moderationStatus === "REJECTED" &&
                    property.rejectionReason && (
                      <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
                        <span className="font-semibold">Lý do từ chối: </span>
                        {property.rejectionReason}
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
