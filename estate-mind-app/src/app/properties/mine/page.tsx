"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { propertyService } from "@/services/propertyService";
import { Property } from "@/types/property";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "AVAILABLE", label: "Đang bán" },
  { value: "RENT", label: "Cho thuê" },
  { value: "SOLD", label: "Đã bán" },
];

function statusBadge(status?: string) {
  switch (status) {
    case "PENDING":
      return (
        <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
          Chờ duyệt
        </span>
      );
    case "AVAILABLE":
      return (
        <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-950/50 dark:text-green-300">
          Đang bán
        </span>
      );
    case "RENT":
      return (
        <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
          Cho thuê
        </span>
      );
    case "SOLD":
      return (
        <span className="inline-flex rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-700 dark:bg-slate-700 dark:text-slate-300">
          Đã bán
        </span>
      );
    default:
      return null;
  }
}

function formatPrice(price: number): string {
  if (price >= 1_000_000_000) {
    const billions = price / 1_000_000_000;
    return `${Number.isInteger(billions) ? billions : billions.toFixed(1)} tỷ`;
  }
  if (price >= 1_000_000) {
    return `${Math.round(price / 1_000_000)} triệu`;
  }
  return `${price.toLocaleString("vi-VN")} đ`;
}

export default function MyPropertiesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [properties, setProperties] = useState<Property[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
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
          ...(statusFilter ? { status: statusFilter } : {}),
          page: 1,
          size: 50,
        });
        setProperties(data.items ?? []);
        setError(null);
      } catch {
        setError("Không thể tải danh sách tin đã đăng.");
      } finally {
        setLoading(false);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [authLoading, user, statusFilter]);

  if (authLoading || !user || user.userRole !== "ROLE_SELLER") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-500 dark:text-slate-400">
        Đang tải...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-slate-950 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tin đã đăng
          </h1>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <Link
              href="/"
              className="text-sm font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
            >
              ← Về trang chủ
            </Link>
          </div>
        </div>

        {loading && (
          <div className="flex min-h-40 items-center justify-center text-gray-500 dark:text-slate-400">
            Đang tải danh sách...
          </div>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            {error}
          </div>
        )}

        {!loading && !error && properties.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Không có tin nào.
          </div>
        )}

        {!loading && !error && properties.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <div
                key={property.id}
                className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
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
                  <div className="mb-2">{statusBadge(property.status)}</div>

                  <Link href={`/properties/${property.id}`}>
                    <h2 className="line-clamp-2 font-semibold text-gray-900 hover:text-red-600 dark:text-white dark:hover:text-red-400">
                      {property.title}
                    </h2>
                  </Link>

                  <p className="mt-1 line-clamp-1 text-sm text-gray-500 dark:text-slate-400">
                    {property.address}
                  </p>

                  <p className="mt-2 font-bold text-red-600 dark:text-red-400">
                    {formatPrice(Number(property.price))}
                  </p>

                  {property.status === "PENDING" && (
                    <div className="mt-3">
                      <Link
                        href={`/properties/${property.id}/edit`}
                        className="inline-flex rounded-md border border-red-500 px-3 py-1.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-950/30"
                      >
                        Chỉnh sửa
                      </Link>
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
