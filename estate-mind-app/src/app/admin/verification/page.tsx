      "use client";

      import { useCallback, useEffect, useState } from "react";

      import {
        adminVerificationService,
        VerificationQueueItem,
        VerificationRole,
      } from "@/services/adminVerificationService";

      const tabs: { label: string; value: VerificationRole | "" }[] = [
        { label: "Tất cả", value: "" },
        { label: "Khách hàng", value: "ROLE_CUSTOMER" },
        { label: "Người bán", value: "ROLE_SELLER" },
      ];

      function formatDate(value?: string | null) {
        if (!value) return "Chưa có dữ liệu";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return new Intl.DateTimeFormat("vi-VN", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(date);
      }

      function displayName(item: VerificationQueueItem) {
        const name = [item.firstName, item.lastName].filter(Boolean).join(" ");
        return name || item.username;
      }

      export default function AdminVerificationsPage() {
        const [roleFilter, setRoleFilter] = useState<VerificationRole | "">("");
        const [items, setItems] = useState<VerificationQueueItem[]>([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);
        const [actioningId, setActioningId] = useState<number | null>(null);
        const [actionError, setActionError] = useState<string | null>(null);

        const loadQueue = useCallback(async () => {
          setLoading(true);
          setError(null);

          try {
            const data = await adminVerificationService.getQueue(
              roleFilter || undefined,
            );
            setItems(data);
          } catch {
            setError("Không thể tải danh sách chờ xác minh. Vui lòng thử lại.");
          } finally {
            setLoading(false);
          }
        }, [roleFilter]);

        useEffect(() => {
          const timer = setTimeout(loadQueue, 0);
          return () => clearTimeout(timer);
        }, [loadQueue]);

        async function handleApprove(userId: number) {
          setActioningId(userId);
          setActionError(null);

          try {
            await adminVerificationService.approve(userId);
            setItems((prev) => prev.filter((item) => item.userId !== userId));
          } catch (err) {
            setActionError(
              err instanceof Error
                ? `Không thể duyệt: ${err.message}`
                : "Không thể duyệt hồ sơ này.",
            );
          } finally {
            setActioningId(null);
          }
        }

        async function handleReject(userId: number) {
          setActioningId(userId);
          setActionError(null);

          try {
            await adminVerificationService.reject(userId);
            setItems((prev) => prev.filter((item) => item.userId !== userId));
          } catch (err) {
            setActionError(
              err instanceof Error
                ? `Không thể từ chối: ${err.message}`
                : "Không thể từ chối hồ sơ này.",
            );
          } finally {
            setActioningId(null);
          }
        }

        return (
          <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-slate-950 sm:px-6">
            <div className="mx-auto max-w-5xl">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Xác minh tài khoản
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                  Duyệt hoặc từ chối hồ sơ xác minh của khách hàng và người bán.
                </p>
              </div>

              <div className="mb-4 flex gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.value || "all"}
                    type="button"
                    onClick={() => setRoleFilter(tab.value)}
                    className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                      roleFilter === tab.value
                        ? "bg-red-500 text-white"
                        : "border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {actionError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  {actionError}
                </div>
              )}

              {loading && (
                <div className="flex min-h-40 items-center justify-center text-gray-500 dark:text-slate-400">
                  Đang tải danh sách...
                </div>
              )}

              {!loading && error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  {error}
                </div>
              )}

              {!loading && !error && items.length === 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                  Không có hồ sơ nào đang chờ xác minh.
                </div>
              )}

              {!loading && !error && items.length > 0 && (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={`${item.role}-${item.userId}`}
                      className="rounded-lg border border-gray-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {displayName(item)}
                            </h2>
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                              {item.role === "ROLE_CUSTOMER"
                                ? "Khách hàng"
                                : "Người bán"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-slate-400">
                            @{item.username} · {item.email || "Chưa có email"}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleApprove(item.userId)}
                            disabled={actioningId === item.userId}
                            className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60"
                          >
                            {actioningId === item.userId ? "Đang xử lý..." : "Duyệt"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(item.userId)}
                            disabled={actioningId === item.userId}
                            className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
                          >
                            Từ chối
                          </button>
                        </div>
                      </div>

                      <dl className="grid gap-3 text-sm sm:grid-cols-2">
                        {item.role === "ROLE_CUSTOMER" ? (
                          <>
                            <div>
                              <dt className="text-gray-500 dark:text-slate-400">
                                Địa chỉ
                              </dt>
                              <dd className="text-gray-900 dark:text-white">
                                {item.address || "Chưa cập nhật"}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-gray-500 dark:text-slate-400">
                                Số giấy tờ tùy thân
                              </dt>
                              <dd className="text-gray-900 dark:text-white">
                                {item.identityNumber || "Chưa cập nhật"}
                              </dd>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <dt className="text-gray-500 dark:text-slate-400">
                                Công ty
                              </dt>
                              <dd className="text-gray-900 dark:text-white">
                                {item.companyName || "Chưa liên kết"}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-gray-500 dark:text-slate-400">
                                Mã số thuế
                              </dt>
                              <dd className="text-gray-900 dark:text-white">
                                {item.companyTaxCode || "Chưa có"}
                              </dd>
                            </div>
                            <div className="sm:col-span-2">
                              <dt className="text-gray-500 dark:text-slate-400">
                                Giới thiệu
                              </dt>
                              <dd className="text-gray-900 dark:text-white">
                                {item.bio || "Chưa cập nhật"}
                              </dd>
                            </div>
                          </>
                        )}

                        <div>
                          <dt className="text-gray-500 dark:text-slate-400">
                            Cập nhật lần cuối
                          </dt>
                          <dd className="text-gray-900 dark:text-white">
                            {formatDate(item.updatedAt)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        );
      }
