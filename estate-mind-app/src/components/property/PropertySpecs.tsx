interface PropertySpecsProps {
  attributes?: string | null;
}

// Thứ tự ưu tiên hiển thị; trường lạ sẽ nằm sau, không bị mất.
const PREFERRED_ORDER = [
  "Diện tích",
  "Số phòng ngủ",
  "Số phòng tắm, vệ sinh",
  "Số tầng",
  "Mặt tiền",
  "Đường vào",
  "Hướng nhà",
  "Hướng ban công",
  "Pháp lý",
  "Nội thất",
];

// Đã hiển thị ở khối chip phía trên, không lặp lại.
const SKIP_KEYS = new Set(["Khoảng giá", "Mức giá", "Giá"]);

function parseAttributes(raw?: string | null): [string, string][] {
  if (!raw) {
    return [];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return [];
  }

  const entries = Object.entries(parsed as Record<string, unknown>)
    .filter(([key, value]) => {
      if (SKIP_KEYS.has(key)) return false;
      return typeof value === "string" && value.trim().length > 0;
    })
    .map(([key, value]) => [key, String(value).trim()] as [string, string]);

  return entries.sort((a, b) => {
    const indexA = PREFERRED_ORDER.indexOf(a[0]);
    const indexB = PREFERRED_ORDER.indexOf(b[0]);

    if (indexA === -1 && indexB === -1) return a[0].localeCompare(b[0], "vi");
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    return indexA - indexB;
  });
}

export default function PropertySpecs({ attributes }: PropertySpecsProps) {
  const entries = parseAttributes(attributes);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-xl font-bold text-[#202523]">
        Đặc điểm bất động sản
      </h2>

      <dl className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
        {entries.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-4 border-b border-[#eef1ef] py-3"
          >
            <dt className="text-sm text-[#66716b]">{label}</dt>
            <dd className="text-right text-sm font-medium text-[#2f3934]">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
