"use client";

import { useState, type FormEvent } from "react";

import { X } from "lucide-react";

interface Props {
  open: boolean;

  busy?: boolean;

  onClose: () => void;

  onReject: (reason: string) => Promise<void> | void;
}

export default function RejectPropertyModal({
  open,
  busy = false,
  onClose,
  onReject,
}: Props) {
  const [reason, setReason] = useState("");

  const [error, setError] = useState("");

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalized = reason.trim();

    if (!normalized) {
      setError("Vui lòng nhập lý do từ chối.");

      return;
    }

    setError("");

    try {
      await onReject(normalized);

      // Đặt lại biểu mẫu sau khi từ chối thành công
      setReason("");
      setError("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể từ chối tin đăng này.",
      );
    }
  }

  function handleClose() {
    if (busy) {
      return;
    }

    setReason("");
    setError("");

    onClose();
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        grid
        place-items-center
        bg-black/40
        p-5
      "
    >
      <div
        className="
          w-full
          max-w-lg
          rounded-2xl
          bg-white
          p-6
          shadow-[0_25px_80px_rgba(0,0,0,0.25)]
        "
      >
        <div
          className="
            flex
            items-start
            justify-between
            gap-4
          "
        >
          <div>
            <h2
              className="
                text-xl
                font-bold
                text-[#202523]
              "
            >
              Từ chối tin đăng
            </h2>

            <p
              className="
                mt-1
                text-sm
                leading-6
                text-[#748078]
              "
            >
              Người bán sẽ nhìn thấy lý do này và có thể chỉnh sửa tin đăng
              trước khi gửi lại để kiểm duyệt.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            aria-label="Đóng hộp thoại từ chối"
            className="
              grid
              h-9
              w-9
              shrink-0
              place-items-center
              rounded-full
              text-[#6e7973]
              transition
              hover:bg-[#f2f5f3]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <X size={18} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="mt-5">
          <label
            htmlFor="rejection-reason"
            className="
              text-xs
              font-bold
              uppercase
              tracking-[0.08em]
              text-[#68736d]
            "
          >
            Lý do từ chối
          </label>

          <textarea
            id="rejection-reason"
            autoFocus
            maxLength={1000}
            rows={5}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);

              if (error) {
                setError("");
              }
            }}
            placeholder="Ví dụ: Ảnh chính không rõ nét hoặc thông tin địa chỉ chưa đầy đủ."
            className="
              mt-2
              w-full
              resize-none
              rounded-xl
              border
              border-[#d6dfda]
              p-3
              text-sm
              leading-6
              text-[#34413a]
              outline-none
              transition
              placeholder:text-[#a0aaa4]
              focus:border-brand
              focus:ring-2
              focus:ring-brand/10
            "
          />

          <div
            className="
              mt-1.5
              flex
              min-h-5
              items-start
              justify-between
              gap-4
              text-xs
            "
          >
            <span className="text-red-600">{error}</span>

            <span
              className="
                shrink-0
                text-[#8a948e]
              "
            >
              {reason.length}/1000
            </span>
          </div>

          <div
            className="
              mt-5
              flex
              justify-end
              gap-3
            "
          >
            <button
              type="button"
              onClick={handleClose}
              disabled={busy}
              className="
                rounded-lg
                border
                border-[#d7dfdb]
                bg-white
                px-4
                py-2.5
                text-sm
                font-semibold
                text-[#5e6963]
                transition
                hover:bg-[#f5f7f6]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={busy || !reason.trim()}
              className="
                rounded-lg
                bg-red-600
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-red-700
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {busy ? "Đang từ chối..." : "Từ chối tin đăng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
