"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import {
  BadgeCheck,
  Bookmark,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Plus,
  UserRound,
  X,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { getInitials } from "@/lib/format";

const navItems = [
  {
    label: "Trang chủ",
    href: "/",
  },
  {
    label: "Bất động sản",
    href: "/projects",
  },
  {
    label: "Giới thiệu",
    href: "/#about",
  },
  {
    label: "Tin tức",
    href: "/#insights",
  },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const { user, loading: authLoading, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);

  const [accountOpen, setAccountOpen] = useState(false);

  const isSeller = user?.userRole === "ROLE_SELLER";

  const isAdmin = user?.userRole === "ROLE_ADMIN";

  const canUseFavorites =
    user?.userRole === "ROLE_CUSTOMER" || user?.userRole === "ROLE_SELLER";

  const canVerifyAccount =
    user?.userRole === "ROLE_CUSTOMER" || user?.userRole === "ROLE_SELLER";

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    if (href === "/projects") {
      return pathname.startsWith("/projects");
    }

    return false;
  }

  function closeMenus() {
    setAccountOpen(false);
    setMobileOpen(false);
  }

  function handleLogout() {
    logout();

    closeMenus();

    router.push("/");
  }

  const initials = getInitials(
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() ||
      user?.username ||
      "EM",
  );

  const menuLinkClass = `
      flex
      items-center
      gap-2
      rounded-lg
      px-3
      py-2.5
      text-sm
      text-[#4f5954]
      transition
      hover:bg-[#f4f7f5]
      hover:text-brand
    `;

  return (
    <header
      className="
        sticky
        top-0
        z-50
        border-b
        border-border
        bg-white/95
        backdrop-blur
      "
    >
      <div
        className="
          mx-auto
          flex
          h-[72px]
          max-w-[1180px]
          items-center
          justify-between
          px-5
          sm:px-6
        "
      >
        {/* LOGO */}
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="
            text-[27px]
            font-bold
            tracking-[-0.04em]
            text-brand
          "
        >
          EstateMind
        </Link>

        {/* DESKTOP NAV */}
        <nav
          className="
            hidden
            items-center
            gap-8
            md:flex
          "
        >
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`
                  relative
                  py-6
                  text-[15px]
                  font-medium
                  transition-colors
                  ${
                    isActive(item.href)
                      ? "text-brand"
                      : "text-[#4f5954] hover:text-brand"
                  }
                `}
            >
              {item.label}

              {isActive(item.href) && (
                <span
                  className="
                      absolute
                      inset-x-0
                      bottom-0
                      h-0.5
                      rounded-full
                      bg-brand
                    "
                />
              )}
            </Link>
          ))}
        </nav>

        {/* DESKTOP ACTIONS */}
        <div
          className="
            hidden
            items-center
            gap-3
            md:flex
          "
        >
          {!authLoading && isSeller && (
            <Link
              href="/properties/new"
              className="
                inline-flex
                h-10
                items-center
                gap-2
                rounded-lg
                bg-brand
                px-4
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-brand-hover
              "
            >
              <Plus size={17} />
              Đăng tin
            </Link>
          )}

          {/* FAVORITES SHORTCUT */}
          {canUseFavorites && (
            <Link
              href="/favorites"
              aria-label="Bất động sản đã lưu"
              title="Bất động sản đã lưu"
              className={`
                grid
                h-10
                w-10
                place-items-center
                rounded-full
                border
                transition
                ${
                  pathname.startsWith("/favorites")
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-[#d8e0dc] bg-white text-[#52605a] hover:border-brand hover:text-brand"
                }
              `}
            >
              <Bookmark size={18} />
            </Link>
          )}

          {/* AUTH */}
          {authLoading ? (
            <div
              className="
                h-10
                w-10
                animate-pulse
                rounded-full
                bg-[#edf2ef]
              "
            />
          ) : user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((value) => !value)}
                aria-label="Mở menu tài khoản"
                className="
                  grid
                  h-10
                  w-10
                  place-items-center
                  rounded-full
                  border
                  border-[#d8e0dc]
                  bg-brand-soft
                  text-sm
                  font-bold
                  text-brand
                  transition
                  hover:border-brand/40
                "
              >
                {initials}
              </button>

              {accountOpen && (
                <div
                  className="
                    absolute
                    right-0
                    top-12
                    w-64
                    overflow-hidden
                    rounded-xl
                    border
                    border-border
                    bg-white
                    p-2
                    shadow-[0_16px_45px_rgba(20,40,30,0.12)]
                  "
                >
                  {/* USER INFO */}
                  <div
                    className="
                      border-b
                      border-border
                      px-3
                      py-3
                    "
                  >
                    <p
                      className="
                        truncate
                        text-sm
                        font-semibold
                        text-[#202523]
                      "
                    >
                      {user.firstName || user.username}
                    </p>

                    <p
                      className="
                        truncate
                        text-xs
                        text-[#7a857f]
                      "
                    >
                      {user.email || user.username}
                    </p>
                  </div>

                  {/* ADMIN DASHBOARD */}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setAccountOpen(false)}
                      className={`
                        mt-1
                        ${menuLinkClass}
                      `}
                    >
                      <LayoutDashboard size={16} />
                      Trang quản trị
                    </Link>
                  )}

                  {/* PROFILE */}
                  <Link
                    href="/account/profile"
                    onClick={() => setAccountOpen(false)}
                    className={`
                      ${!isAdmin ? "mt-1" : ""}
                      ${menuLinkClass}
                    `}
                  >
                    <UserRound size={16} />
                    Hồ sơ của tôi
                  </Link>

                  {/* VERIFICATION */}
                  {canVerifyAccount && (
                    <Link
                      href="/account/verification"
                      onClick={() => setAccountOpen(false)}
                      className={menuLinkClass}
                    >
                      <BadgeCheck size={16} />
                      Xác minh tài khoản
                    </Link>
                  )}

                  {/* MY LISTINGS */}
                  {isSeller && (
                    <Link
                      href="/properties/mine"
                      onClick={() => setAccountOpen(false)}
                      className={menuLinkClass}
                    >
                      <ListChecks size={16} />
                      Tin đăng của tôi
                    </Link>
                  )}

                  {/* FAVORITES */}
                  {canUseFavorites && (
                    <Link
                      href="/favorites"
                      onClick={() => setAccountOpen(false)}
                      className={menuLinkClass}
                    >
                      <Bookmark size={16} />
                      Bất động sản đã lưu
                    </Link>
                  )}

                  <div
                    className="
                      my-1
                      border-t
                      border-border
                    "
                  />

                  {/* LOGOUT */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="
                      flex
                      w-full
                      items-center
                      gap-2
                      rounded-lg
                      px-3
                      py-2.5
                      text-left
                      text-sm
                      text-[#4f5954]
                      transition
                      hover:bg-[#f4f7f5]
                      hover:text-brand
                    "
                  >
                    <LogOut size={16} />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              aria-label="Đăng nhập"
              className="
                grid
                h-10
                w-10
                place-items-center
                rounded-full
                border
                border-[#d8e0dc]
                text-[#52605a]
                transition
                hover:border-brand
                hover:text-brand
              "
            >
              <UserRound size={19} />
            </Link>
          )}
        </div>

        {/* MOBILE BUTTON */}
        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          aria-label="Mở hoặc đóng menu"
          className="
            grid
            h-10
            w-10
            place-items-center
            rounded-lg
            border
            border-border
            text-[#34433b]
            md:hidden
          "
        >
          {mobileOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div
          className="
            border-t
            border-border
            bg-white
            px-5
            py-4
            md:hidden
          "
        >
          <nav
            className="
              flex
              flex-col
              gap-1
            "
          >
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                    rounded-lg
                    px-3
                    py-3
                    text-sm
                    font-medium
                    ${
                      isActive(item.href)
                        ? "bg-brand-soft text-brand"
                        : "text-[#4f5954]"
                    }
                  `}
              >
                {item.label}
              </Link>
            ))}

            {!authLoading && isSeller && (
              <Link
                href="/properties/new"
                onClick={() => setMobileOpen(false)}
                className="
                  mt-3
                  inline-flex
                  h-11
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  bg-brand
                  px-4
                  text-sm
                  font-semibold
                  text-white
                "
              >
                <Plus size={17} />
                Đăng tin
              </Link>
            )}

            {!authLoading && user && (
              <>
                {/* ADMIN */}
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={closeMenus}
                    className="
                        mt-2
                        flex
                        items-center
                        gap-2
                        rounded-lg
                        px-3
                        py-3
                        text-sm
                        font-medium
                        text-[#4f5954]
                      "
                  >
                    <LayoutDashboard size={17} />
                    Trang quản trị
                  </Link>
                )}

                {/* PROFILE */}
                <Link
                  href="/account/profile"
                  onClick={closeMenus}
                  className="
                      mt-2
                      flex
                      items-center
                      gap-2
                      rounded-lg
                      px-3
                      py-3
                      text-sm
                      font-medium
                      text-[#4f5954]
                    "
                >
                  <UserRound size={17} />
                  Hồ sơ của tôi
                </Link>

                {/* VERIFICATION */}
                {canVerifyAccount && (
                  <Link
                    href="/account/verification"
                    onClick={closeMenus}
                    className="
                        flex
                        items-center
                        gap-2
                        rounded-lg
                        px-3
                        py-3
                        text-sm
                        font-medium
                        text-[#4f5954]
                      "
                  >
                    <BadgeCheck size={17} />
                    Xác minh tài khoản
                  </Link>
                )}

                {/* SELLER LISTINGS */}
                {isSeller && (
                  <Link
                    href="/properties/mine"
                    onClick={closeMenus}
                    className="
                        flex
                        items-center
                        gap-2
                        rounded-lg
                        px-3
                        py-3
                        text-sm
                        font-medium
                        text-[#4f5954]
                      "
                  >
                    <ListChecks size={17} />
                    Tin đăng của tôi
                  </Link>
                )}

                {/* FAVORITES */}
                {canUseFavorites && (
                  <Link
                    href="/favorites"
                    onClick={closeMenus}
                    className="
                        flex
                        items-center
                        gap-2
                        rounded-lg
                        px-3
                        py-3
                        text-sm
                        font-medium
                        text-[#4f5954]
                      "
                  >
                    <Bookmark size={17} />
                    Bất động sản đã lưu
                  </Link>
                )}

                {/* LOGOUT */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="
                      flex
                      items-center
                      gap-2
                      rounded-lg
                      px-3
                      py-3
                      text-left
                      text-sm
                      font-medium
                      text-[#4f5954]
                    "
                >
                  <LogOut size={17} />
                  Đăng xuất
                </button>
              </>
            )}

            {!authLoading && !user && (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="
                    mt-2
                    flex
                    items-center
                    gap-2
                    rounded-lg
                    px-3
                    py-3
                    text-sm
                    font-medium
                    text-[#4f5954]
                  "
              >
                <UserRound size={17} />
                Đăng nhập
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
