import { CheckCircle2, Clock3, XCircle } from "lucide-react";

import { ModerationStatus } from "@/types/property";

interface Props {
  status?: ModerationStatus;
}

export default function PropertyModerationBadge({ status }: Props) {
  switch (status) {
    case "APPROVED":
      return (
        <span
          className="
            inline-flex
            items-center
            gap-1.5
            rounded-full
            bg-emerald-50
            px-2.5
            py-1
            text-xs
            font-semibold
            text-emerald-700
          "
        >
          <CheckCircle2 size={14} />
          Đã duyệt
        </span>
      );

    case "REJECTED":
      return (
        <span
          className="
            inline-flex
            items-center
            gap-1.5
            rounded-full
            bg-red-50
            px-2.5
            py-1
            text-xs
            font-semibold
            text-red-700
          "
        >
          <XCircle size={14} />
          Đã từ chối
        </span>
      );

    default:
      return (
        <span
          className="
            inline-flex
            items-center
            gap-1.5
            rounded-full
            bg-amber-50
            px-2.5
            py-1
            text-xs
            font-semibold
            text-amber-700
          "
        >
          <Clock3 size={14} />
          Chờ duyệt
        </span>
      );
  }
}
