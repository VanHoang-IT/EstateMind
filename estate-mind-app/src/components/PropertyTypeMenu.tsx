"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type {
  PropertyCategory,
  PropertyType,
} from "@/services/propertyTypeService";

interface Props {
  propertyType: PropertyType;
  selectedCategoryId?: number;
}

export default function PropertyTypeMenu({
  propertyType,
  selectedCategoryId,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const categories = propertyType.categories ?? [];

  const isActive = categories.some(
    (category) => category.id === selectedCategoryId,
  );

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function selectCategory(category: PropertyCategory) {
    const params = new URLSearchParams(searchParams.toString());

    params.set("categoryId", String(category.id));
    params.set("page", "1");

    router.push(`/?${params.toString()}`);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Chọn danh mục ${propertyType.name}`}
        className={`
          flex items-center gap-1
          transition-colors
          hover:text-red-500
          dark:hover:text-red-400
          ${
            isActive
              ? "text-red-500 dark:text-red-400"
              : "text-gray-700 dark:text-slate-300"
          }
        `}
      >
        <span>{propertyType.name}</span>

        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="
            absolute left-0 top-full z-[60] mt-5
            max-h-[430px] w-[360px] overflow-y-auto
            rounded-lg border border-gray-200
            bg-white py-2 shadow-xl
            dark:border-slate-700 dark:bg-slate-900
          "
        >
          {categories.length > 0 ? (
            categories.map((category) => {
              const selected = category.id === selectedCategoryId;

              return (
                <button
                  key={category.id}
                  type="button"
                  role="menuitem"
                  onClick={() => selectCategory(category)}
                  className={`
                    block w-full px-5 py-3
                    text-left text-sm transition-colors
                    ${
                      selected
                        ? "bg-red-50 font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-400"
                        : "text-gray-700 hover:bg-red-50 hover:text-red-600 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-red-400"
                    }
                  `}
                >
                  {category.name}
                </button>
              );
            })
          ) : (
            <p className="px-5 py-4 text-sm text-gray-400 dark:text-slate-500">
              Chưa có danh mục.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
