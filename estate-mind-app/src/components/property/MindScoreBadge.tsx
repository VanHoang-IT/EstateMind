import { Brain } from "lucide-react";

interface MindScoreBadgeProps {
  score?: number | null;
  className?: string;
}

const GOOD_THRESHOLD = 70;

export default function MindScoreBadge({
  score,
  className = "",
}: MindScoreBadgeProps) {
  if (score == null || score < GOOD_THRESHOLD) {
    return null;
  }

  return (
    <span
      title="Giá rao thấp hơn mức thị trường ước tính bằng mô hình AI. Chỉ mang tính tham khảo."
      className={`inline-flex items-center gap-1.5 rounded-md bg-[#e6f4ee] px-2.5 py-1.5 text-xs font-semibold text-[#046c4e] ${className}`}
    >
      <Brain size={14} />
      Giá tốt
    </span>
  );
}
