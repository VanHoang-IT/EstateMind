"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { authFetch, throwIfNotOk } from "@/lib/api";

type UserProfile = {
  id?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  username?: string;
  active?: boolean;
  userRole?: string;
  avatar?: string;
};

export default function AccountProfilePage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      const timer = setTimeout(() => router.replace("/login"), 0);
      return () => clearTimeout(timer);
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-500 dark:text-slate-400">
        Đang tải...
      </div>
    );
  }

  const currentUser = user as UserProfile;

  const displayName =
    [currentUser.firstName, currentUser.lastName].filter(Boolean).join(" ") ||
    currentUser.username ||
    "Người dùng";

  const avatarInitial = displayName.trim().charAt(0).toUpperCase();

  const roleLabel =
    currentUser.userRole === "ROLE_ADMIN"
      ? "Quản trị viên"
      : currentUser.userRole === "ROLE_SELLER"
        ? "Người bán"
        : currentUser.userRole === "ROLE_CUSTOMER" ||
            currentUser.userRole === "ROLE_BUYER"
          ? "Người mua"
          : "Người dùng";

  const canVerifyAccount =
    currentUser.userRole === "ROLE_CUSTOMER" ||
    currentUser.userRole === "ROLE_SELLER";
  function startEditing() {
    setFirstName(currentUser.firstName ?? "");
    setLastName(currentUser.lastName ?? "");
    setPhone(currentUser.phone ?? "");
    setEmail(currentUser.email ?? "");
    setAvatarFile(null);
    setSaveError(null);
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);

    try {
      const formData = new FormData();
      formData.set("firstName", firstName.trim());
      formData.set("lastName", lastName.trim());
      formData.set("phone", phone.trim());
      formData.set("email", email.trim());

      if (avatarFile) {
        formData.set("avatar", avatarFile);
      }

      const response = await authFetch("/secure/profile", {
        method: "PUT",
        body: formData,
      });

      await throwIfNotOk(response);

      await refreshUser();
      setEditing(false);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Không thể cập nhật thông tin.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-slate-950 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
          >
            ← Về trang chủ
          </Link>

          {canVerifyAccount && (
            <Link
              href="/account/verification"
              className="rounded-md border border-red-500 px-3 py-2 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              Xác nhận tài khoản
            </Link>
          )}
        </div>

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-gray-200 px-6 py-5 dark:border-slate-800">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Thông tin tài khoản
            </h1>

            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Thông tin được lấy từ tài khoản đang đăng nhập.
            </p>
          </div>

          <div className="p-6">
            <div className="flex flex-col gap-5 border-b border-gray-200 pb-6 dark:border-slate-800 sm:flex-row sm:items-center">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={`Ảnh đại diện của ${displayName}`}
                  className="h-24 w-24 rounded-full border border-gray-200 object-cover dark:border-slate-700"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-500 text-3xl font-bold text-white dark:bg-red-600">
                  {avatarInitial}
                </div>
              )}

              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {displayName}
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                  {roleLabel}
                </p>

                <span
                  className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    currentUser.active === false
                      ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                      : "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                  }`}
                >
                  {currentUser.active === false
                    ? "Tài khoản bị khóa"
                    : "Tài khoản đang hoạt động"}
                </span>
              </div>
            </div>

            {editing ? (
              <div className="mt-6 space-y-4 rounded-lg border border-gray-200 p-5 dark:border-slate-700">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                      Họ
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                      Tên
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                      Ảnh đại diện mới (tuỳ chọn)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setAvatarFile(e.target.files?.[0] ?? null)
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                {saveError && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {saveError}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-60"
                  >
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    disabled={saving}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Huỷ
                  </button>
                </div>
              </div>
            ) : (
              <>
                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 p-4 dark:border-slate-700">
                    <dt className="text-sm text-gray-500 dark:text-slate-400">
                      ID
                    </dt>
                    <dd className="mt-1 font-medium text-gray-900 dark:text-white">
                      {currentUser.id ?? "Chưa có dữ liệu"}
                    </dd>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4 dark:border-slate-700">
                    <dt className="text-sm text-gray-500 dark:text-slate-400">
                      Tên đăng nhập
                    </dt>
                    <dd className="mt-1 font-medium text-gray-900 dark:text-white">
                      {currentUser.username || "Chưa cập nhật"}
                    </dd>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4 dark:border-slate-700">
                    <dt className="text-sm text-gray-500 dark:text-slate-400">
                      Họ
                    </dt>
                    <dd className="mt-1 font-medium text-gray-900 dark:text-white">
                      {currentUser.lastName || "Chưa cập nhật"}
                    </dd>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4 dark:border-slate-700">
                    <dt className="text-sm text-gray-500 dark:text-slate-400">
                      Tên
                    </dt>
                    <dd className="mt-1 font-medium text-gray-900 dark:text-white">
                      {currentUser.firstName || "Chưa cập nhật"}
                    </dd>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4 dark:border-slate-700">
                    <dt className="text-sm text-gray-500 dark:text-slate-400">
                      Email
                    </dt>
                    <dd className="mt-1 break-all font-medium text-gray-900 dark:text-white">
                      {currentUser.email || "Chưa cập nhật"}
                    </dd>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4 dark:border-slate-700">
                    <dt className="text-sm text-gray-500 dark:text-slate-400">
                      Số điện thoại
                    </dt>
                    <dd className="mt-1 font-medium text-gray-900 dark:text-white">
                      {currentUser.phone || "Chưa cập nhật"}
                    </dd>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4 dark:border-slate-700">
                    <dt className="text-sm text-gray-500 dark:text-slate-400">
                      Trạng thái
                    </dt>
                    <dd className="mt-1 font-medium text-gray-900 dark:text-white">
                      {currentUser.active === false
                        ? "Không hoạt động"
                        : "Đang hoạt động"}
                    </dd>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4 dark:border-slate-700">
                    <dt className="text-sm text-gray-500 dark:text-slate-400">
                      Vai trò
                    </dt>
                    <dd className="mt-1 font-medium text-gray-900 dark:text-white">
                      {currentUser.userRole || "Chưa có dữ liệu"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={startEditing}
                    className="rounded-md bg-red-500 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-red-600"
                  >
                    Chỉnh sửa thông tin
                  </button>
                </div>
              </>
            )}

            <p className="mt-3 text-xs text-gray-400 dark:text-slate-500">
              Mật khẩu không được hiển thị trên trang hồ sơ để bảo vệ tài khoản.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
