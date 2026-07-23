"use client";

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  // Hiện tối đa 5 số trang xung quanh trang hiện tại, tránh render hàng trăm nút.
  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let p = start; p <= end; p++) pages.push(p);

  const btnBase =
    "min-w-[36px] h-9 px-2 rounded-md text-sm font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <nav className="flex justify-center items-center gap-1.5 mt-8" aria-label="Phân trang">
      <button
        className={`${btnBase} border-gray-300 text-gray-600 hover:bg-gray-50`}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        ‹
      </button>

      {start > 1 && (
        <>
          <button className={`${btnBase} border-gray-300 text-gray-600 hover:bg-gray-50`} onClick={() => onPageChange(1)}>
            1
          </button>
          {start > 2 && <span className="px-1 text-gray-400">…</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          className={`${btnBase} ${
            p === page
              ? "bg-red-500 border-red-500 text-white"
              : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-gray-400">…</span>}
          <button
            className={`${btnBase} border-gray-300 text-gray-600 hover:bg-gray-50`}
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        className={`${btnBase} border-gray-300 text-gray-600 hover:bg-gray-50`}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        ›
      </button>
    </nav>
  );
}
