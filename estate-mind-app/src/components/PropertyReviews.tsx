"use client";

import { useEffect, useState } from "react";
import { Review } from "@/types/review";
import { reviewService } from "@/services/reviewService";
import { useAuth } from "@/contexts/AuthContext";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-500 text-sm">
      {"★".repeat(rating)}
      <span className="text-gray-300">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default function PropertyReviews({ propertyId }: { propertyId: number }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    reviewService
      .getReviewsByProperty(propertyId)
      .then(setReviews)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setFormError(null);
    try {
      await reviewService.createReview({ content, rating, propertyId });
      setContent("");
      setRating(5);
      load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Gửi đánh giá thất bại");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Đánh giá ({reviews.length})</h2>

      {user ? (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-md p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-gray-600">Đánh giá:</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setRating(n)}
                className={`text-xl ${n <= rating ? "text-yellow-500" : "text-gray-300"}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="Chia sẻ trải nghiệm của bạn về bất động sản này..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-red-500 mb-3"
          />
          {formError && <p className="text-sm text-red-600 mb-2">{formError}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-5 py-2 rounded-md disabled:opacity-50"
          >
            {submitting ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </form>
      ) : (
        <p className="text-sm text-gray-500 mb-6">
          <a href="/login" className="text-red-500 font-medium hover:underline">
            Đăng nhập
          </a>{" "}
          để viết đánh giá.
        </p>
      )}

      {loading && <p className="text-sm text-gray-400">Đang tải đánh giá...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && reviews.length === 0 && (
        <p className="text-sm text-gray-400">Chưa có đánh giá nào cho bất động sản này.</p>
      )}

      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="border-b border-gray-100 pb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm text-gray-800">
                {r.userId?.firstName || r.userId?.username || "Người dùng"}
              </span>
              <Stars rating={r.rating} />
            </div>
            <p className="text-sm text-gray-600">{r.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
