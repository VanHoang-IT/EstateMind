"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { useRouter } from "next/navigation";

import { Bookmark, Search } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";

import { favoriteService } from "@/services/favoriteService";

import { Property } from "@/types/property";

import PropertyCard from "@/components/PropertyCard";

interface FavoritesSnapshot {
  userKey: string;
  properties: Property[];
  error: string | null;
}

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();

  const router = useRouter();

  const [snapshot, setSnapshot] = useState<FavoritesSnapshot | null>(null);

  const userKey = user?.username ?? "";

  const canUseFavorites =
    user?.userRole === "ROLE_CUSTOMER" || user?.userRole === "ROLE_SELLER";

  /*
   * Bảo vệ route.
   *
   * Khách chưa đăng nhập -> /login
   * Admin / vai trò khác -> /
   */
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");

      return;
    }

    if (!canUseFavorites) {
      router.replace("/");
    }
  }, [authLoading, user, canUseFavorites, router]);

  /*
   * Tải danh sách bất động sản đã lưu.
   *
   * State chỉ update trong Promise callback,
   * tránh synchronous setState trong effect.
   */
  useEffect(() => {
    if (!userKey || !canUseFavorites) {
      return;
    }

    let ignore = false;

    favoriteService
      .getFavorites()
      .then((properties) => {
        if (ignore) {
          return;
        }

        setSnapshot({
          userKey,
          properties,
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (ignore) {
          return;
        }

        setSnapshot({
          userKey,
          properties: [],
          error:
            error instanceof Error
              ? error.message
              : "Không thể tải danh sách bất động sản đã lưu.",
        });
      });

    return () => {
      ignore = true;
    };
  }, [userKey, canUseFavorites]);

  const snapshotMatchesUser = snapshot?.userKey === userKey;

  const properties = snapshotMatchesUser ? snapshot.properties : [];

  const error = snapshotMatchesUser ? snapshot.error : null;

  const loading = canUseFavorites && Boolean(userKey) && !snapshotMatchesUser;

  /*
   * Trong khi AuthContext kiểm tra token
   * hoặc đang chuyển hướng.
   */
  if (authLoading || !user || !canUseFavorites) {
    return (
      <div
        className="
          flex
          min-h-[55vh]
          items-center
          justify-center
        "
      >
        <div
          className="
            h-8
            w-8
            animate-spin
            rounded-full
            border-2
            border-[#dce4df]
            border-t-brand
          "
        />
      </div>
    );
  }

  return (
    <main
      className="
        min-h-[70vh]
        bg-[#f8faf9]
      "
    >
      <div
        className="
          mx-auto
          max-w-[1180px]
          px-5
          py-10
          sm:px-6
          lg:py-12
        "
      >
        {/* HEADER */}
        <div
          className="
            mb-8
            flex
            flex-col
            gap-4
            sm:flex-row
            sm:items-end
            sm:justify-between
          "
        >
          <div>
            <div
              className="
                mb-2
                inline-flex
                items-center
                gap-2
                text-sm
                font-semibold
                text-brand
              "
            >
              <Bookmark size={17} />
              Bất động sản đã lưu
            </div>

            <h1
              className="
                text-3xl
                font-bold
                tracking-[-0.03em]
                text-[#202523]
                sm:text-[34px]
              "
            >
              Danh sách yêu thích của bạn
            </h1>

            <p
              className="
                mt-2
                max-w-xl
                text-sm
                leading-6
                text-[#748078]
              "
            >
              Lưu những bất động sản bạn quan tâm để dễ dàng xem lại bất cứ khi
              nào.
            </p>
          </div>

          {!loading && !error && properties.length > 0 && (
            <p
              className="
                  text-sm
                  font-medium
                  text-[#748078]
                "
            >
              {properties.length.toLocaleString("vi-VN")} bất động sản đã lưu
            </p>
          )}
        </div>

        {/* LOADING */}
        {loading && (
          <div
            className="
              grid
              min-h-[280px]
              place-items-center
              rounded-2xl
              border
              border-border
              bg-white
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
                  h-8
                  w-8
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
                Đang tải bất động sản đã lưu...
              </p>
            </div>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div
            className="
                rounded-2xl
                border
                border-red-200
                bg-red-50
                px-5
                py-4
              "
          >
            <p
              className="
                  text-sm
                  font-medium
                  text-red-700
                "
            >
              {error}
            </p>
          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && properties.length === 0 && (
          <div
            className="
                rounded-2xl
                border
                border-dashed
                border-[#d2dcd6]
                bg-white
                px-6
                py-16
                text-center
              "
          >
            <div
              className="
                  mx-auto
                  grid
                  h-14
                  w-14
                  place-items-center
                  rounded-full
                  bg-brand-soft
                  text-brand
                "
            >
              <Bookmark size={23} />
            </div>

            <h2
              className="
                  mt-5
                  text-lg
                  font-bold
                  text-[#252b28]
                "
            >
              Chưa có bất động sản nào được lưu
            </h2>

            <p
              className="
                  mx-auto
                  mt-2
                  max-w-md
                  text-sm
                  leading-6
                  text-[#7a857f]
                "
            >
              Khám phá các bất động sản và nhấn biểu tượng trái tim để lưu những
              tin đăng bạn quan tâm.
            </p>

            <Link
              href="/projects"
              className="
                  mt-6
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
                "
            >
              <Search size={17} />
              Khám phá bất động sản
            </Link>
          </div>
        )}

        {/* PROPERTY GRID */}
        {!loading && !error && properties.length > 0 && (
          <div
            className="
                grid
                grid-cols-1
                gap-5
                sm:grid-cols-2
                lg:grid-cols-3
                xl:grid-cols-4
              "
          >
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
