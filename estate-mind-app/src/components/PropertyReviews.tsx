"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Review } from "@/types/review";
import { reviewService } from "@/services/reviewService";
import { useAuth } from "@/contexts/AuthContext";

interface PropertyReviewsProps {
  propertyId: number;
}

function Stars({ rating }: { rating: number }) {
  const safeRating = Math.min(5, Math.max(0, Math.round(rating)));

  return (
    <span
      className="text-sm text-yellow-500"
      aria-label={`${safeRating} trên 5 sao`}
    >
      {"★".repeat(safeRating)}
      <span className="text-gray-300">{"★".repeat(5 - safeRating)}</span>
    </span>
  );
}

export default function PropertyReviews({ propertyId }: PropertyReviewsProps) {
  const { user } = useAuth();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    reviewService
      .getReviewsByProperty(propertyId)
      .then((result) => {
        if (ignore) {
          return;
        }

        setReviews(result);
        setError(null);
      })
      .catch(() => {
        if (ignore) {
          return;
        }

        setReviews([]);
        setError("Không thể tải đánh giá. Vui lòng thử lại sau.");
      })
      .finally(() => {
        if (ignore) {
          return;
        }

        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [propertyId]);

  async function reloadReviews() {
    setLoading(true);
    setError(null);

    try {
      const result = await reviewService.getReviewsByProperty(propertyId);

      setReviews(result);
    } catch {
      setReviews([]);
      setError("Không thể tải đánh giá. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      setFormError("Vui lòng nhập nội dung đánh giá.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await reviewService.createReview({
        content: trimmedContent,
        rating,
        propertyId,
      });

      setContent("");
      setRating(5);

      await reloadReviews();
    } catch {
      setFormError("Không thể gửi đánh giá. Vui lòng thử lại sau.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-slate-100">
        Đánh giá ({reviews.length})
      </h2>

      {user ? (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-md border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-slate-300">
              Đánh giá:
            </span>

            {[1, 2, 3, 4, 5].map((number) => (
              <button
                type="button"
                key={number}
                onClick={() => setRating(number)}
                aria-label={`Chọn ${number} sao`}
                aria-pressed={rating === number}
                className={`text-xl ${
                  number <= rating ? "text-yellow-500" : "text-gray-300"
                }`}
              >
                ★
              </button>
            ))}
          </div>

          <textarea
            value={content}
            onChange={(event) => {
              setContent(event.target.value);

              if (formError) {
                setFormError(null);
              }
            }}
            rows={3}
            maxLength={1000}
            placeholder="Chia sẻ trải nghiệm của bạn về bất động sản này..."
            className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />

          {formError && (
            <p className="mb-2 text-sm text-red-600 dark:text-red-400">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="rounded-md bg-red-500 px-5 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </form>
      ) : (
        <p className="mb-6 text-sm text-gray-500 dark:text-slate-400">
          <Link
            href="/login"
            className="font-medium text-red-500 hover:underline"
          >
            Đăng nhập
          </Link>{" "}
          để viết đánh giá.
        </p>
      )}

      {loading && <p className="text-sm text-gray-400">Đang tải đánh giá...</p>}

      {!loading && error && (
        <p className="text-sm text-gray-500 dark:text-slate-400">{error}</p>
      )}

      {!loading && !error && reviews.length === 0 && (
        <p className="text-sm text-gray-400">
          Chưa có đánh giá nào cho bất động sản này.
        </p>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="border-b border-gray-100 pb-4 dark:border-slate-800"
            >
              <div className="mb-1 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-gray-800 dark:text-slate-200">
                  {review.userId?.firstName ||
                    review.userId?.username ||
                    "Người dùng"}
                </span>

                <Stars rating={review.rating} />
              </div>

              <p className="whitespace-pre-line break-words text-sm text-gray-600 dark:text-slate-300">
                {review.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
