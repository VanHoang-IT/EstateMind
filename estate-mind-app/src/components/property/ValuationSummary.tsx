import { Brain } from "lucide-react";

interface ValuationSummaryProps {
  price?: number | null;
  predictedPrice?: number | null;
  mindScore?: number | null;
}

function formatTy(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toLocaleString("vi-VN", {
      maximumFractionDigits: 2,
    })} tỷ`;
  }

  return `${(value / 1_000_000).toLocaleString("vi-VN", {
    maximumFractionDigits: 0,
  })} triệu`;
}

function verdict(diffPercent: number): string {
  if (diffPercent >= 10) {
    return "Giá rao thấp hơn đáng kể so với ước tính";
  }

  if (diffPercent >= 3) {
    return "Giá rao thấp hơn ước tính một chút";
  }

  if (diffPercent > -3) {
    return "Giá rao sát với ước tính";
  }

  if (diffPercent > -10) {
    return "Giá rao cao hơn ước tính một chút";
  }

  return "Giá rao cao hơn đáng kể so với ước tính";
}

export default function ValuationSummary({
  price,
  predictedPrice,
  mindScore,
}: ValuationSummaryProps) {
  if (price == null || predictedPrice == null || mindScore == null) {
    return null;
  }

  const diffPercent = ((predictedPrice - price) / predictedPrice) * 100;

  const barColor =
    mindScore >= 70
      ? "bg-[#0a7f5a]"
      : mindScore >= 40
        ? "bg-[#8a938d]"
        : "bg-[#c2593a]";

  return (
    <div className="mb-6 rounded-md border border-[#dfe5e1] bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <Brain size={17} className="text-[#007a5a]" />

        <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-[#007a5a]">
          Định giá AI
        </h2>
      </div>

      <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
        <div>
          <p className="mb-1 text-xs text-gray-400">Giá thị trường ước tính</p>

          <p className="text-xl font-bold text-gray-800">
            {formatTy(predictedPrice)}
          </p>
        </div>

        <div>
          <p className="mb-1 text-xs text-gray-400">Chênh lệch với giá rao</p>

          <p className="text-xl font-bold text-gray-800">
            {diffPercent >= 0 ? "−" : "+"}
            {Math.abs(diffPercent).toLocaleString("vi-VN", {
              maximumFractionDigits: 1,
            })}
            %
          </p>
        </div>

        <div>
          <p className="mb-1 text-xs text-gray-400">Mind Score</p>

          <p className="text-xl font-bold text-gray-800">{mindScore}/100</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#eef1ef]">
          <div
            className={`h-full rounded-full ${barColor}`}
            style={{ width: `${mindScore}%` }}
          />
        </div>

        <p className="mt-2 text-sm text-gray-600">{verdict(diffPercent)}.</p>
      </div>

      <p className="mt-4 border-t border-[#eef1ef] pt-3 text-xs leading-5 text-gray-400">
        Ước tính do mô hình hồi quy huấn luyện trên dữ liệu tin đăng đã thu
        thập, dựa trên diện tích, số phòng ngủ, vị trí và loại hình. Sai số
        trung bình khoảng 30%, chỉ mang tính tham khảo và không thay thế thẩm
        định giá chuyên nghiệp.
      </p>
    </div>
  );
}
