"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);

  for (let current = start; current <= end; current++) {
    pages.push(current);
  }

  const buttonBase =
    "grid h-10 min-w-10 place-items-center rounded-lg border px-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-35";

  return (
    <nav
      className="mt-12 flex items-center justify-center gap-2"
      aria-label="Phân trang"
    >
      <button
        type="button"
        className={`${buttonBase} border-[#d8e0dc] bg-white text-[#59665f] hover:border-brand hover:text-brand`}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Trang trước"
      >
        <ChevronLeft size={17} />
      </button>

      {start > 1 && (
        <>
          <button
            type="button"
            className={`${buttonBase} border-[#d8e0dc] bg-white text-[#59665f] hover:border-brand hover:text-brand`}
            onClick={() => onPageChange(1)}
            aria-label="Trang 1"
          >
            1
          </button>

          {start > 2 && (
            <span className="px-1 text-sm text-[#89938d]">...</span>
          )}
        </>
      )}

      {pages.map((current) => (
        <button
          type="button"
          key={current}
          aria-label={`Trang ${current}`}
          aria-current={current === page ? "page" : undefined}
          className={`${buttonBase} ${
            current === page
              ? "border-brand bg-brand text-white"
              : "border-[#d8e0dc] bg-white text-[#59665f] hover:border-brand hover:text-brand"
          }`}
          onClick={() => onPageChange(current)}
        >
          {current}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && (
            <span className="px-1 text-sm text-[#89938d]">...</span>
          )}

          <button
            type="button"
            className={`${buttonBase} border-[#d8e0dc] bg-white text-[#59665f] hover:border-brand hover:text-brand`}
            onClick={() => onPageChange(totalPages)}
            aria-label={`Trang ${totalPages}`}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        type="button"
        className={`${buttonBase} border-[#d8e0dc] bg-white text-[#59665f] hover:border-brand hover:text-brand`}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Trang tiếp theo"
      >
        <ChevronRight size={17} />
      </button>
    </nav>
  );
}
