"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { ShieldAlert } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";

import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const { user, loading } = useAuth();

  const isAdmin = user?.userRole === "ROLE_ADMIN";

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/");
    }
  }, [loading, isAdmin, router]);

  if (loading) {
    return (
      <div
        className="
          grid
          min-h-[70vh]
          place-items-center
          text-sm
          text-[#748078]
        "
      >
        Đang kiểm tra quyền quản trị...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        className="
          grid
          min-h-[70vh]
          place-items-center
          px-6
          text-center
        "
      >
        <div>
          <ShieldAlert
            size={34}
            className="
              mx-auto
              text-[#9aa39e]
            "
          />

          <p
            className="
              mt-3
              text-sm
              text-[#748078]
            "
          >
            Bạn cần quyền quản trị viên để truy cập trang này.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="
        min-h-screen
        bg-[#f6f8f7]

        lg:grid
        lg:grid-cols-[250px_minmax(0,1fr)]
      "
    >
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      <main className="min-w-0">
        <div
          className="
            border-b
            border-border
            bg-white
            px-5
            py-4

            sm:px-7
            lg:px-10
          "
        >
          <div
            className="
              mx-auto
              flex
              max-w-[1280px]
              items-center
              justify-between
            "
          >
            <div>
              <p
                className="
                  text-xs
                  font-bold
                  uppercase
                  tracking-[0.1em]
                  text-brand
                "
              >
                Quản trị EstateMind
              </p>

              <p
                className="
                  mt-0.5
                  text-sm
                  text-[#7b867f]
                "
              >
                Xem xét và quản lý các tin đăng trên hệ thống.
              </p>
            </div>

            <div className="text-right">
              <p
                className="
                  text-sm
                  font-semibold
                  text-[#34413a]
                "
              >
                {user.firstName || user.username}
              </p>

              <p
                className="
                  text-xs
                  text-[#87918b]
                "
              >
                Quản trị viên
              </p>
            </div>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
