"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  const canVerifyAccount =
    user?.userRole === "ROLE_CUSTOMER" || user?.userRole === "ROLE_SELLER";
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const accountMenuRef = useRef<HTMLDivElement>(null);

  const parsedCategoryId = Number(searchParams.get("categoryId"));
  const selectedCategoryId =
    Number.isInteger(parsedCategoryId) && parsedCategoryId > 0
      ? parsedCategoryId
      : undefined;

  const canPostProperty =
    user?.userRole === "ROLE_SELLER" || user?.userRole === "ROLE_ADMIN";

  const isSeller = user?.userRole === "ROLE_SELLER";
  const isCustomer = user?.userRole === "ROLE_CUSTOMER";

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username
    : "";

  const avatarInitial = displayName
    ? displayName.trim().charAt(0).toUpperCase()
    : "U";

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

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleLogout() {
    setAccountMenuOpen(false);
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

            {isCustomer && (
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

            {isSeller && (
              <Link
                href="/properties/mine"
                className="
                  transition-colors
                  hover:text-red-500
                  dark:hover:text-red-400
                "
              >
                Tin đã đăng
              </Link>
            )}

            {isSeller && (
              <Link
                href="/properties/pending"
                className="
                  transition-colors
                  hover:text-red-500
                  dark:hover:text-red-400
                "
              >
                Tin chờ duyệt
              </Link>
            )}
          </nav>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2 sm:gap-4">
          <ThemeToggle />

          {user ? (
            <div ref={accountMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setAccountMenuOpen((current) => !current)}
                aria-haspopup="menu"
                aria-expanded={accountMenuOpen}
                className="
                  flex items-center gap-2
                  rounded-full border border-transparent
                  p-1
                  transition-colors
                  hover:border-gray-200
                  hover:bg-gray-50
                  focus:outline-none
                  focus:ring-2
                  focus:ring-red-200
                  dark:hover:border-slate-700
                  dark:hover:bg-slate-900
                  dark:focus:ring-red-900
                "
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={`Ảnh đại diện của ${displayName}`}
                    className="
                      h-9 w-9 rounded-full
                      border border-gray-200
                      object-cover
                      dark:border-slate-700
                    "
                  />
                ) : (
                  <span
                    className="
                      flex h-9 w-9 items-center justify-center
                      rounded-full
                      bg-red-500
                      font-semibold text-white
                      dark:bg-red-600
                    "
                  >
                    {avatarInitial}
                  </span>
                )}

                <span
                  className="
                    hidden max-w-36 truncate
                    text-gray-700
                    lg:block
                    dark:text-slate-200
                  "
                >
                  {displayName}
                </span>

                <svg
                  className={`
                    hidden h-4 w-4
                    text-gray-500
                    transition-transform
                    lg:block
                    dark:text-slate-400
                    ${accountMenuOpen ? "rotate-180" : ""}
                  `}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="m19 9-7 7-7-7"
                  />
                </svg>
              </button>

              {accountMenuOpen && (
                <div
                  role="menu"
                  className="
                    absolute right-0 mt-2
                    w-64 overflow-hidden
                    rounded-lg
                    border border-gray-200
                    bg-white shadow-lg
                    dark:border-slate-700
                    dark:bg-slate-900
                    dark:shadow-black/40
                  "
                >
                  <div
                    className="
                      border-b border-gray-100
                      px-4 py-3
                      dark:border-slate-800
                    "
                  >
                    <p
                      className="
                        truncate font-semibold
                        text-gray-900
                        dark:text-white
                      "
                    >
                      {displayName}
                    </p>

                    <p
                      className="
                        truncate text-xs
                        font-normal
                        text-gray-500
                        dark:text-slate-400
                      "
                    >
                      {user.email || user.username}
                    </p>
                  </div>

                  <div className="py-1">
                    {canVerifyAccount && (
                      <Link
                        href="/account/verification"
                        role="menuitem"
                        onClick={() => setAccountMenuOpen(false)}
                        className="
                          flex items-center gap-3
                          px-4 py-3
                          text-gray-700
                          transition-colors
                          hover:bg-gray-50
                          hover:text-red-500
                          dark:text-slate-200
                          dark:hover:bg-slate-800
                          dark:hover:text-red-400
                        "
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M9 12.75 11.25 15 15 9.75m6 2.25a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                          />
                        </svg>
                        Xác nhận tài khoản
                      </Link>
                    )}

                    <Link
                      href="/account/profile"
                      role="menuitem"
                      onClick={() => setAccountMenuOpen(false)}
                      className="
                        flex items-center gap-3
                        px-4 py-3
                        text-gray-700
                        transition-colors
                        hover:bg-gray-50
                        hover:text-red-500
                        dark:text-slate-200
                        dark:hover:bg-slate-800
                        dark:hover:text-red-400
                      "
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0"
                        />
                      </svg>
                      Thông tin tài khoản
                    </Link>
                  </div>

                  <div
                    className="
                      border-t border-gray-100
                      py-1
                      dark:border-slate-800
                    "
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="
                        flex w-full items-center gap-3
                        px-4 py-3
                        text-left text-red-600
                        transition-colors
                        hover:bg-red-50
                        dark:text-red-400
                        dark:hover:bg-red-950/40
                      "
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3-3H9m9 0-3-3m3 3-3 3"
                        />
                      </svg>
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="
                hidden font-medium
                text-gray-600
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
