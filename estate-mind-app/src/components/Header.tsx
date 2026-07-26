"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import PropertyTypeMenu from "@/components/PropertyTypeMenu";

import {
  propertyTypeService,
  type PropertyType,
} from "@/services/propertyTypeService";

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);

  const parsedCategoryId = Number(searchParams.get("categoryId"));
  const selectedCategoryId =
    Number.isInteger(parsedCategoryId) && parsedCategoryId > 0
      ? parsedCategoryId
      : undefined;

  const canPostProperty =
    user?.userRole === "ROLE_SELLER" || user?.userRole === "ROLE_ADMIN";

  useEffect(() => {
    let ignore = false;

    propertyTypeService
      .getPropertyTypes()
      .then((result) => {
        if (!ignore) {
          setPropertyTypes(result);
        }
      })
      .catch(() => {
        if (!ignore) {
          setPropertyTypes([]);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  function handleLogout() {
    logout();
    router.push("/");
    router.refresh();
  }

  return (
    <header
      className="
        sticky top-0 z-50
        border-b border-gray-200
        bg-white shadow-sm
        transition-colors duration-200
        dark:border-slate-800
        dark:bg-slate-950
        dark:shadow-black/20
      "
    >
      <div
        className="
          mx-auto flex h-16 max-w-7xl
          items-center justify-between
          px-4 text-sm
          sm:px-6 lg:px-8
        "
      >
        {/* Logo và menu bên trái */}
        <div className="flex min-w-0 items-center gap-4 md:gap-8">
          <Link
            href="/"
            aria-label="Về trang chủ"
            className="
              flex flex-shrink-0 items-center gap-1
              text-xl font-bold text-red-500
              transition-opacity hover:opacity-90
              dark:text-red-400
            "
          >
            <svg
              className="h-6 w-6"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 3L2 12h3v8h14v-8h3L12 3zm0 2.8l7 7V20H5v-7.2l7-7z" />
            </svg>

            <span className="hidden sm:inline">Batdongsan</span>
          </Link>

          <nav
            aria-label="Điều hướng chính"
            className="
              hidden items-center gap-6
              font-medium text-gray-700
              md:flex
              dark:text-slate-300
            "
          >
            {propertyTypes.map((propertyType) => (
              <PropertyTypeMenu
                key={propertyType.id}
                propertyType={propertyType}
                selectedCategoryId={selectedCategoryId}
              />
            ))}

            {user && (
              <Link
                href="/favorites"
                className="
                  transition-colors
                  hover:text-red-500
                  dark:hover:text-red-400
                "
              >
                Tin đã lưu
              </Link>
            )}
          </nav>
        </div>

        {/* Các nút bên phải */}
        <div className="flex flex-shrink-0 items-center gap-2 sm:gap-4">
          <ThemeToggle />

          {user ? (
            <>
              <span
                className="
                  hidden text-gray-600
                  lg:inline
                  dark:text-slate-300
                "
              >
                Xin chào,{" "}
                <strong className="text-gray-800 dark:text-white">
                  {user.firstName || user.username}
                </strong>
              </span>

              <button
                type="button"
                onClick={handleLogout}
                className="
                  hidden font-medium text-gray-600
                  transition-colors
                  hover:text-red-500
                  sm:inline
                  dark:text-slate-300
                  dark:hover:text-red-400
                "
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="
                hidden font-medium text-gray-600
                transition-colors
                hover:text-red-500
                sm:inline
                dark:text-slate-300
                dark:hover:text-red-400
              "
            >
              Đăng nhập
            </Link>
          )}

          {canPostProperty && (
            <Link
              href="/properties/new"
              className="
                rounded-md bg-red-500
                px-3 py-2
                font-semibold text-white
                transition-colors
                hover:bg-red-600
                sm:px-4
                dark:bg-red-600
                dark:hover:bg-red-500
              "
            >
              Đăng tin
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
