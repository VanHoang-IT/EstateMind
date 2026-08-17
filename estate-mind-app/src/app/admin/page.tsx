"use client";

import { useEffect, useMemo, useState } from "react";

import { Search } from "lucide-react";

import { adminPropertyService } from "@/services/adminPropertyService";

import { ModerationStatus, Property } from "@/types/property";

import PropertyModerationTable from "@/components/admin/PropertyModerationTable";

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
    label: "All",

    value: "",
  },

  {
    label: "Pending",

    value: "PENDING",
  },

  {
    label: "Approved",

    value: "APPROVED",
  },

  {
    label: "Rejected",

    value: "REJECTED",
  },
];

export default function AdminPropertiesPage() {
  const [moderationStatus, setModerationStatus] = useState<
    ModerationStatus | ""
  >("PENDING");

  const [search, setSearch] = useState("");

  const [submittedSearch, setSubmittedSearch] = useState("");

  const requestKey = useMemo(
    () => `${moderationStatus}|${submittedSearch}`,

    [moderationStatus, submittedSearch],
  );

  const [state, setState] = useState<LoadedState | null>(null);

  useEffect(() => {
    let ignore = false;

    adminPropertyService
      .getProperties({
        moderationStatus: moderationStatus || undefined,

        search: submittedSearch || undefined,

        page: 1,

        size: 50,
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
            error instanceof Error ? error.message : "Unable to load listings.",
        });
      });

    return () => {
      ignore = true;
    };
  }, [moderationStatus, submittedSearch, requestKey]);

  const loading = state?.key !== requestKey;

  const properties = loading ? [] : (state?.properties ?? []);

  const total = loading ? 0 : (state?.total ?? 0);

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
          Property Moderation
        </h1>

        <p
          className="
            mt-2
            text-sm
            text-[#68736d]
          "
        >
          Review seller submissions and control which listings are published.
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
              onClick={() => setModerationStatus(tab.value)}
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

            setSubmittedSearch(search.trim());
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
            placeholder="Search property..."
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
            ? "Loading listings..."
            : `${total.toLocaleString(
                "en-US",
              )} listing${total === 1 ? "" : "s"}`}
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
    </div>
  );
}
