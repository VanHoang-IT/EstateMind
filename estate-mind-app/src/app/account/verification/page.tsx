"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { authFetch, throwIfNotOk } from "@/lib/api";

interface CustomerVerificationProfile {
  id: number;
  address?: string | null;
  identityNumber?: string | null;
  identityVerified?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface SellerCompany {
  id?: number;
  name?: string | null;
}

interface SellerVerificationProfile {
  id: number;
  bio?: string | null;
  isVerified?: boolean | null;
  verifiedAt?: string | null;
  ratingAvg?: number | null;
  totalProperties?: number | null;
  companyId?: number | SellerCompany | null;
  companyName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

type VerificationProfileResponse =
  | {
      role: "ROLE_CUSTOMER";
      profile: CustomerVerificationProfile;
    }
  | {
      role: "ROLE_SELLER";
      profile: SellerVerificationProfile;
    };

function formatDate(value?: string | null) {
  if (!value) {
    return "Chưa có dữ liệu";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function maskIdentityNumber(value?: string | null) {
  if (!value) {
    return "Chưa cập nhật";
  }

  if (value.length <= 4) {
    return value;
  }

  return `${"*".repeat(value.length - 4)}${value.slice(-4)}`;
}

function getCompanyLabel(profile: SellerVerificationProfile) {
  if (profile.companyName) {
    return profile.companyName;
  }

  if (profile.companyId && typeof profile.companyId === "object") {
    return (
      profile.companyId.name ||
      (profile.companyId.id
        ? `Doanh nghiệp #${profile.companyId.id}`
        : "Chưa liên kết")
    );
  }

  if (typeof profile.companyId === "number") {
    return `Doanh nghiệp #${profile.companyId}`;
  }

  return "Chưa liên kết";
}

function InfoItem({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-gray-200 p-4 dark:border-slate-700 ${
        fullWidth ? "sm:col-span-2" : ""
      }`}
    >
      <dt className="text-sm text-gray-500 dark:text-slate-400">{label}</dt>

      <dd className="mt-1 break-words font-medium text-gray-900 dark:text-white">
        {value}
      </dd>
    </div>
  );
}

async function updateVerificationProfile(payload: {
  address?: string;
  identityNumber?: string;
  bio?: string;
  companyId?: number;
}) {
  const response = await authFetch("/secure/verification-profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  await throwIfNotOk(response);

  return response.json();
}

export default function AccountVerificationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<VerificationProfileResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVerificationProfile = useCallback(async () => {
    try {
      const response = await authFetch("/secure/verification-profile", {
        cache: "no-store",
      });

      await throwIfNotOk(response);

      const result = (await response.json()) as VerificationProfileResponse;

      if (result.role !== "ROLE_CUSTOMER" && result.role !== "ROLE_SELLER") {
        throw new Error("Vai trò tài khoản không hỗ trợ trang xác minh.");
      }

      setData(result);
      setError(null);
    } catch (requestError) {
      setData(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể tải hồ sơ xác minh.",
      );
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      const timer = setTimeout(() => router.replace("/login"), 0);
      return () => clearTimeout(timer);
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    const timer = setTimeout(loadVerificationProfile, 0);

    return () => clearTimeout(timer);
  }, [authLoading, user, loadVerificationProfile]);

  const displayName = useMemo(() => {
    if (!user) {
      return "";
    }

    return (
      [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username
    );
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-500 dark:text-slate-400">
        Đang tải...
      </div>
    );
  }

  const isCustomer = data?.role === "ROLE_CUSTOMER";
  const isSeller = data?.role === "ROLE_SELLER";

  const verified =
    data?.role === "ROLE_CUSTOMER"
      ? data.profile.identityVerified === true
      : data?.role === "ROLE_SELLER"
        ? data.profile.isVerified === true
        : false;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-slate-950 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="text-sm font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
          >
            ← Về trang chủ
          </Link>

          <Link
            href="/account/profile"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Thông tin tài khoản
          </Link>
        </div>

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-gray-200 px-6 py-5 dark:border-slate-800">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Xác nhận tài khoản
            </h1>

            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Hồ sơ xác minh của {displayName}.
            </p>
          </div>

          <div className="p-6">
            {loadingProfile && (
              <div className="flex min-h-56 items-center justify-center text-gray-500 dark:text-slate-400">
                Đang tải hồ sơ xác minh...
              </div>
            )}

            {!loadingProfile && error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
              >
                <p className="font-semibold">Không thể tải hồ sơ xác minh</p>

                <p className="mt-1">{error}</p>
              </div>
            )}

            {!loadingProfile && data && (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 rounded-lg border border-gray-200 p-5 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      Loại tài khoản
                    </p>

                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                      {isCustomer ? "Người mua" : "Người bán"}
                    </p>
                  </div>

                  <span
                    className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-semibold ${
                      verified
                        ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                    }`}
                  >
                    {verified ? "Đã xác minh" : "Chưa xác minh"}
                  </span>
                </div>

                {isCustomer && (
                  <CustomerVerificationSection
                    profile={data.profile}
                    onSaved={loadVerificationProfile}
                  />
                )}

                {isSeller && (
                  <SellerVerificationSection
                    profile={data.profile}
                    onSaved={loadVerificationProfile}
                  />
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function CustomerVerificationSection({
  profile,
  onSaved,
}: {
  profile: CustomerVerificationProfile;
  onSaved: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [address, setAddress] = useState(profile.address ?? "");
  const [identityNumber, setIdentityNumber] = useState(
    profile.identityNumber ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);

    try {
      await updateVerificationProfile({
        address: address.trim(),
        identityNumber: identityNumber.trim(),
      });

      await onSaved();
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Không thể lưu hồ sơ.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Hồ sơ người mua
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Cập nhật địa chỉ và giấy tờ định danh để được xác minh.
          </p>
        </div>

        {!editing && (
          <button
            type="button"
            onClick={() => {
              setAddress(profile.address ?? "");
              setIdentityNumber(profile.identityNumber ?? "");
              setSaveError(null);
              setEditing(true);
            }}
            className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600"
          >
            Cập nhật hồ sơ
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4 rounded-lg border border-gray-200 p-5 dark:border-slate-700">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
              Địa chỉ
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              placeholder="Nhập địa chỉ..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
              Số giấy tờ định danh
            </label>
            <input
              type="text"
              value={identityNumber}
              onChange={(e) => setIdentityNumber(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              placeholder="CCCD/CMND..."
            />
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Thay đổi số giấy tờ sẽ yêu cầu xác minh lại từ đầu.
            </p>
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
              {saving ? "Đang lưu..." : "Lưu hồ sơ"}
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
        <dl className="grid gap-4 sm:grid-cols-2">
          <InfoItem label="Mã hồ sơ" value={profile.id} />

          <InfoItem
            label="Trạng thái định danh"
            value={profile.identityVerified ? "Đã xác minh" : "Chưa xác minh"}
          />

          <InfoItem
            label="Số giấy tờ định danh"
            value={maskIdentityNumber(profile.identityNumber)}
          />

          <InfoItem
            label="Địa chỉ"
            value={profile.address || "Chưa cập nhật"}
          />

          <InfoItem
            label="Ngày tạo hồ sơ"
            value={formatDate(profile.createdAt)}
          />

          <InfoItem
            label="Cập nhật gần nhất"
            value={formatDate(profile.updatedAt)}
          />
        </dl>
      )}

      {!editing && !profile.identityVerified && (
        <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          Tài khoản người mua chưa được xác minh danh tính. Cần bổ sung địa chỉ
          và giấy tờ định danh, sau đó chờ quản trị viên xét duyệt.
        </div>
      )}
    </div>
  );
}

function SellerVerificationSection({
  profile,
  onSaved,
}: {
  profile: SellerVerificationProfile;
  onSaved: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [companyIdInput, setCompanyIdInput] = useState(
    typeof profile.companyId === "number"
      ? String(profile.companyId)
      : profile.companyId && typeof profile.companyId === "object"
        ? String(profile.companyId.id ?? "")
        : "",
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);

    const trimmedCompanyId = companyIdInput.trim();
    const parsedCompanyId = trimmedCompanyId
      ? Number(trimmedCompanyId)
      : undefined;

    if (
      trimmedCompanyId &&
      (!Number.isInteger(parsedCompanyId) || (parsedCompanyId as number) <= 0)
    ) {
      setSaveError("Mã doanh nghiệp phải là số nguyên dương.");
      setSaving(false);
      return;
    }

    try {
      await updateVerificationProfile({
        bio: bio.trim(),
        ...(parsedCompanyId ? { companyId: parsedCompanyId } : {}),
      });

      await onSaved();
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Không thể lưu hồ sơ.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Hồ sơ người bán
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Cập nhật giới thiệu và doanh nghiệp liên kết.
          </p>
        </div>

        {!editing && (
          <button
            type="button"
            onClick={() => {
              setBio(profile.bio ?? "");
              setSaveError(null);
              setEditing(true);
            }}
            className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600"
          >
            Cập nhật hồ sơ
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4 rounded-lg border border-gray-200 p-5 dark:border-slate-700">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
              Giới thiệu
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              placeholder="Giới thiệu về bạn hoặc doanh nghiệp..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
              Mã doanh nghiệp (tuỳ chọn)
            </label>
            <input
              type="number"
              min={1}
              value={companyIdInput}
              onChange={(e) => setCompanyIdInput(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              placeholder="Nhập ID doanh nghiệp..."
            />
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
              {saving ? "Đang lưu..." : "Lưu hồ sơ"}
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
        <dl className="grid gap-4 sm:grid-cols-2">
          <InfoItem label="Mã hồ sơ" value={profile.id} />

          <InfoItem
            label="Trạng thái người bán"
            value={profile.isVerified ? "Đã xác minh" : "Chưa xác minh"}
          />

          <InfoItem
            label="Thời điểm xác minh"
            value={formatDate(profile.verifiedAt)}
          />

          <InfoItem label="Doanh nghiệp" value={getCompanyLabel(profile)} />

          <InfoItem
            label="Điểm đánh giá trung bình"
            value={
              profile.ratingAvg === null || profile.ratingAvg === undefined
                ? "Chưa có đánh giá"
                : Number(profile.ratingAvg).toFixed(1)
            }
          />

          <InfoItem
            label="Tổng số tin đăng"
            value={profile.totalProperties ?? 0}
          />

          <InfoItem
            label="Ngày tạo hồ sơ"
            value={formatDate(profile.createdAt)}
          />

          <InfoItem
            label="Cập nhật gần nhất"
            value={formatDate(profile.updatedAt)}
          />

          <InfoItem
            label="Giới thiệu"
            value={profile.bio || "Chưa cập nhật"}
            fullWidth
          />
        </dl>
      )}

      {!editing && !profile.isVerified && (
        <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          Tài khoản người bán chưa được xác minh. Hồ sơ cần được quản trị viên
          kiểm tra trước khi hiển thị trạng thái đã xác minh.
        </div>
      )}
    </div>
  );
}
