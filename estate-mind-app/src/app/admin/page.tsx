"use client";

import { useEffect, useMemo, useState } from "react";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { adminPropertyService } from "@/services/adminPropertyService";

import { ModerationStatus, Property } from "@/types/property";

import PropertyModerationTable from "@/components/admin/PropertyModerationTable";

const PAGE_SIZE = 8;

interface LoadedState {
  key: string;

  properties: Property[];

  total: number;

  error: string | null;
}

const tabs: {
  label: string;
  value: ModerationStatus | "";
}[] = [
  {
    label: "Tất cả",

    value: "",
  },

  {
    label: "Chờ duyệt",

    value: "PENDING",
  },

  {
    label: "Đã duyệt",

    value: "APPROVED",
  },

  {
    label: "Đã từ chối",

    value: "REJECTED",
  },
];

function buildPageList(current: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, current]);

  if (current - 1 >= 1) pages.add(current - 1);
  if (current + 1 <= totalPages) pages.add(current + 1);

  const sorted = Array.from(pages).sort((a, b) => a - b);

  const result: (number | "…")[] = [];

  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) {
      result.push("…");
    }

    result.push(page);
  });

  return result;
}

export default function AdminPropertiesPage() {
  const [moderationStatus, setModerationStatus] = useState<
    ModerationStatus | ""
  >("PENDING");

  const [search, setSearch] = useState("");

  const [submittedSearch, setSubmittedSearch] = useState("");

  const [page, setPage] = useState(1);

  const requestKey = useMemo(
    () => `${moderationStatus}|${submittedSearch}|${page}`,

    [moderationStatus, submittedSearch, page],
  );

  const [state, setState] = useState<LoadedState | null>(null);

  useEffect(() => {
    let ignore = false;

    adminPropertyService
      .getProperties({
        moderationStatus: moderationStatus || undefined,

        search: submittedSearch || undefined,

        page,

        size: PAGE_SIZE,
      })

      .then((response) => {
        if (ignore) {
          return;
        }

        setState({
          key: requestKey,

          properties: response.items,

          total: response.totalElements,

          error: null,
        });
      })

      .catch((error) => {
        if (ignore) {
          return;
        }

        setState({
          key: requestKey,

          properties: [],

          total: 0,

          error:
            error instanceof Error
              ? error.message
              : "Không thể tải danh sách tin đăng.",
        });
      });

    return () => {
      ignore = true;
    };
  }, [moderationStatus, submittedSearch, page, requestKey]);

  const loading = state?.key !== requestKey;

  const properties = loading ? [] : (state?.properties ?? []);

  const total = loading ? 0 : (state?.total ?? 0);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function changeTab(value: ModerationStatus | "") {
    setModerationStatus(value);
    setPage(1);
  }

  function submitSearch() {
    setSubmittedSearch(search.trim());
    setPage(1);
  }

  function goToPage(target: number) {
    const clamped = Math.min(Math.max(target, 1), totalPages);

    if (clamped !== page) {
      setPage(clamped);
    }
  }

  return (
    <div
      className="
        mx-auto
        max-w-[1280px]
        px-5
        py-10

        sm:px-7
        lg:px-10
      "
    >
      <div>
        <h1
          className="
            text-4xl
            font-bold
            tracking-[-0.045em]
            text-[#202523]
          "
        >
          Kiểm duyệt tin đăng
        </h1>

        <p
          className="
            mt-2
            text-sm
            text-[#68736d]
          "
        >
          Xem xét các tin đăng do người bán gửi và quyết định tin nào được phép
          công khai.
        </p>
      </div>

      <div
        className="
          mt-8
          flex
          flex-col
          gap-4
          rounded-2xl
          border
          border-[#e0e6e2]
          bg-white
          p-4

          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div
          className="
            flex
            flex-wrap
            gap-2
          "
        >
          {tabs.map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => changeTab(tab.value)}
              className={`
                  rounded-lg
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  transition

                  ${
                    moderationStatus === tab.value
                      ? "bg-brand text-white"
                      : "bg-[#f3f6f4] text-[#65716a] hover:text-brand"
                  }
                `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();

            submitSearch();
          }}
          className="
            relative
            w-full

            sm:max-w-xs
          "
        >
          <Search
            size={16}
            className="
              absolute
              left-3
              top-1/2
              -translate-y-1/2
              text-[#7e8983]
            "
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm kiếm tin đăng..."
            className="
              h-10
              w-full
              rounded-lg
              border
              border-[#d7dfdb]
              pl-9
              pr-3
              text-sm
              outline-none
              transition
              focus:border-brand
            "
          />
        </form>
      </div>

      <div
        className="
          mb-5
          mt-7
        "
      >
        <p
          className="
            text-sm
            text-[#68736d]
          "
        >
          {loading
            ? "Đang tải danh sách tin đăng..."
            : `${total.toLocaleString("vi-VN")} tin đăng`}
        </p>
      </div>

      {!loading && state?.error && (
        <div
          className="
            mb-5
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-sm
            text-red-700
          "
        >
          {state.error}
        </div>
      )}

      {!loading && <PropertyModerationTable properties={properties} />}

      {!loading && !state?.error && total > 0 && totalPages > 1 && (
        <div
          className="
            mt-6
            flex
            flex-col
            items-center
            justify-between
            gap-3

            sm:flex-row
          "
        >
          <p
            className="
              text-sm
              text-[#68736d]
            "
          >
            Trang {page} / {totalPages}
          </p>

          <div
            className="
              flex
              items-center
              gap-1.5
            "
          >
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              aria-label="Trang trước"
              className="
                inline-flex
                h-9
                w-9
                items-center
                justify-center
                rounded-lg
                border
                border-[#d7dfdb]
                text-[#4c5851]
                transition
                hover:border-brand
                hover:text-brand
                disabled:cursor-not-allowed
                disabled:opacity-40
                disabled:hover:border-[#d7dfdb]
                disabled:hover:text-[#4c5851]
              "
            >
              <ChevronLeft size={16} />
            </button>

            {buildPageList(page, totalPages).map((item, index) =>
              item === "…" ? (
                <span
                  key={`ellipsis-${index}`}
                  className="
                    px-1.5
                    text-sm
                    text-[#9aa39c]
                  "
                >
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => goToPage(item)}
                  aria-current={item === page ? "page" : undefined}
                  className={`
                    inline-flex
                    h-9
                    min-w-[36px]
                    items-center
                    justify-center
                    rounded-lg
                    px-2
                    text-sm
                    font-semibold
                    transition

                    ${
                      item === page
                        ? "bg-brand text-white"
                        : "border border-[#d7dfdb] text-[#4c5851] hover:border-brand hover:text-brand"
                    }
                  `}
                >
                  {item}
                </button>
              ),
            )}

            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              aria-label="Trang sau"
              className="
                inline-flex
                h-9
                w-9
                items-center
                justify-center
                rounded-lg
                border
                border-[#d7dfdb]
                text-[#4c5851]
                transition
                hover:border-brand
                hover:text-brand
                disabled:cursor-not-allowed
                disabled:opacity-40
                disabled:hover:border-[#d7dfdb]
                disabled:hover:text-[#4c5851]
              "
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
