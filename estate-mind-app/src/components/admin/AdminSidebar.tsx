"use client";

import Link from "next/link";

import { Building2, LogOut, ShieldCheck, UserCheck } from "lucide-react";

import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";

const items = [
  {
    href: "/admin/properties",

    label: "Kiểm duyệt tin đăng",

    icon: Building2,
  },

  {
    href: "/admin/verification",

    label: "Xác minh tài khoản",

    icon: UserCheck,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const router = useRouter();

  const { logout } = useAuth();

  function handleLogout() {
    logout();

    router.push("/");
  }

  return (
    <aside
      className="
        flex
        h-full
        min-h-screen
        w-full
        flex-col
        border-r
        border-[#e0e6e2]
        bg-white
        p-5
      "
    >
      <Link
        href="/admin"
        className="
          flex
          items-center
          gap-2
          px-2
          py-3
        "
      >
        <span
          className="
            grid
            h-9
            w-9
            place-items-center
            rounded-lg
            bg-brand
            text-white
          "
        >
          <ShieldCheck size={19} />
        </span>

        <div>
          <p
            className="
              text-lg
              font-bold
              tracking-[-0.03em]
              text-[#202523]
            "
          >
            EstateMind
          </p>

          <p
            className="
              text-[10px]
              font-bold
              uppercase
              tracking-[0.1em]
              text-[#839089]
            "
          >
            Quản trị
          </p>
        </div>
      </Link>

      <nav
        className="
          mt-7
          space-y-1
        "
      >
        {items.map((item) => {
          const Icon = item.icon;

          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                  flex
                  items-center
                  gap-3
                  rounded-lg
                  px-3
                  py-3
                  text-sm
                  font-semibold
                  transition

                  ${
                    active
                      ? "bg-brand-soft text-brand"
                      : "text-[#5c6962] hover:bg-[#f4f7f5] hover:text-brand"
                  }
                `}
            >
              <Icon size={18} />

              {item.label}
            </Link>
          );
        })}
      </nav>

      <div
        className="
          mt-auto
          border-t
          border-border
          pt-4
        "
      >
        <Link
          href="/"
          className="
            block
            rounded-lg
            px-3
            py-2
            text-sm
            font-medium
            text-[#69756e]
            hover:bg-[#f4f7f5]
          "
        >
          ← Về trang web
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="
            mt-1
            flex
            w-full
            items-center
            gap-2
            rounded-lg
            px-3
            py-2
            text-sm
            font-medium
            text-[#69756e]
            hover:bg-[#f4f7f5]
            hover:text-red-600
          "
        >
          <LogOut size={16} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
