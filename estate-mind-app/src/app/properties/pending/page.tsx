"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { propertyService } from "@/services/propertyService";
import { Property } from "@/types/property";

export default function PendingPropertiesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [properties, setProperties] = useState<Property[]>([]);
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
      try {
        const data = await propertyService.getProperties({
          sellerId: user.id,
          status: "PENDING",
          page: 1,
          size: 50,
        });
        setProperties(data.items ?? []);
        setError(null);
      } catch {
        setError("Không thể tải danh sách tin chờ duyệt.");
      } finally {
        setLoading(false);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [authLoading, user]);

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
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tin chờ duyệt
          </h1>

          <Link
            href="/"
            className="text-sm font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
          >
            ← Về trang chủ
          </Link>
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
            Bạn không có tin nào đang chờ duyệt.
          </div>
        )}

        {!loading && !error && properties.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <Link
                key={property.id}
                href={`/properties/${property.id}`}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                {property.mainImage && (
                  <img
                    src={property.mainImage}
                    alt={property.title}
                    className="h-40 w-full object-cover"
                  />
                )}

                <div className="p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                      Chờ duyệt
                    </span>
                  </div>

                  <h2 className="line-clamp-2 font-semibold text-gray-900 dark:text-white">
                    {property.title}
                  </h2>

                  <p className="mt-1 line-clamp-1 text-sm text-gray-500 dark:text-slate-400">
                    {property.address}
                  </p>

                  <p className="mt-2 font-bold text-red-600 dark:text-red-400">
                    {Number(property.price).toLocaleString("vi-VN")} đ
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
