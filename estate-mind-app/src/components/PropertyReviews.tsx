"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Star, Trash2 } from "lucide-react";

import { Review } from "@/types/review";
import { reviewService } from "@/services/reviewService";
import { useAuth } from "@/contexts/AuthContext";

interface ReviewLoadState {
  propertyId: number;
  reviews: Review[];
  error: string | null;
}

function Stars({ rating }: { rating: number }) {
  const safeRating = Math.min(5, Math.max(0, Math.round(rating)));

  return (
    <div className="flex gap-0.5" aria-label={`${safeRating} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          size={15}
          className={
            value <= safeRating
              ? "fill-amber-400 text-amber-400"
              : "text-[#d3dad6]"
          }
        />
      ))}
    </div>
  );
}

function formatReviewDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function PropertyReviews({
  propertyId,
}: {
  propertyId: number;
}) {
  const { user } = useAuth();

  const [reviewState, setReviewState] = useState<ReviewLoadState | null>(null);

  const [content, setContent] = useState("");

  const [rating, setRating] = useState(5);

  const [submitting, setSubmitting] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);

  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);

  /*
   * =====================================================
   * ROLE
   * Only CUSTOMER can create reviews
   * =====================================================
   */
  const canReview = user?.userRole === "ROLE_CUSTOMER";

  /*
   * =====================================================
   * CURRENT PROPERTY STATE
   * =====================================================
   */
  const stateMatchesProperty = reviewState?.propertyId === propertyId;

  const reviews = stateMatchesProperty ? reviewState.reviews : [];

  const error = stateMatchesProperty ? reviewState.error : null;

  const loading = !stateMatchesProperty;

  /*
   * =====================================================
   * LOAD REVIEWS
   * =====================================================
   */
  useEffect(() => {
    let ignore = false;

    reviewService
      .getReviewsByProperty(propertyId)
      .then((result) => {
        if (ignore) {
          return;
        }

        setReviewState({
          propertyId,
          reviews: result,
          error: null,
        });
      })
      .catch((requestError) => {
        if (ignore) {
          return;
        }

        setReviewState({
          propertyId,
          reviews: [],
          error: getErrorMessage(
            requestError,
            "Không thể tải danh sách đánh giá.",
          ),
        });
      });

    return () => {
      ignore = true;
    };
  }, [propertyId]);

  /*
   * =====================================================
   * RELOAD REVIEWS
   * =====================================================
   */
  async function reloadReviews() {
    try {
      const result = await reviewService.getReviewsByProperty(propertyId);

      setReviewState({
        propertyId,
        reviews: result,
        error: null,
      });
    } catch (requestError) {
      setReviewState({
        propertyId,
        reviews: [],
        error: getErrorMessage(
          requestError,
          "Không thể tải danh sách đánh giá.",
        ),
      });
    }
  }

  /*
   * =====================================================
   * CREATE REVIEW
   * =====================================================
   */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canReview) {
      return;
    }

    if (submitting) {
      return;
    }

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      setFormError("Vui lòng nhập nội dung đánh giá.");

      return;
    }

    if (rating < 1 || rating > 5) {
      setFormError("Số sao đánh giá phải từ 1 đến 5.");

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
    } catch (requestError) {
      setFormError(getErrorMessage(requestError, "Không thể gửi đánh giá."));
    } finally {
      setSubmitting(false);
    }
  }

  /*
   * =====================================================
   * DELETE OWN REVIEW
   * =====================================================
   */
  async function handleDeleteReview(review: Review) {
    if (!user) {
      return;
    }

    /*
     * Frontend ownership check.
     * Backend still needs to enforce ownership.
     */
    if (review.userId?.id !== user.id) {
      return;
    }

    if (deletingReviewId !== null) {
      return;
    }

    const confirmed = window.confirm(
      "Bạn có chắc muốn xóa đánh giá này không?",
    );

    if (!confirmed) {
      return;
    }

    setDeletingReviewId(review.id);

    try {
      await reviewService.deleteReview(review.id);

      /*
       * Remove review immediately
       * without another GET request.
       */
      setReviewState((current) => {
        if (!current || current.propertyId !== propertyId) {
          return current;
        }

        return {
          ...current,

          reviews: current.reviews.filter((item) => item.id !== review.id),
        };
      });
    } catch (requestError) {
      window.alert(getErrorMessage(requestError, "Không thể xóa đánh giá."));
    } finally {
      setDeletingReviewId(null);
    }
  }

  return (
    <section
      className="
        border-t
        border-border
        pt-8
      "
    >
      {/* =================================================
          TITLE
          ================================================= */}
      <h2
        className="
          text-2xl
          font-bold
          tracking-[-0.025em]
          text-[#202523]
        "
      >
        Reviews
        <span
          className="
            ml-2
            text-base
            font-medium
            text-[#7b867f]
          "
        >
          ({reviews.length})
        </span>
      </h2>

      {/* =================================================
          CUSTOMER REVIEW FORM
          ================================================= */}
      {canReview && (
        <form
          onSubmit={handleSubmit}
          className="
            mt-5
            rounded-xl
            border
            border-[#e0e6e2]
            bg-white
            p-5
          "
        >
          {/* RATING */}
          <div
            className="
              mb-4
              flex
              items-center
              gap-3
            "
          >
            <span
              className="
                text-sm
                font-medium
                text-[#59655f]
              "
            >
              Đánh giá của bạn
            </span>

            <div className="flex">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setRating(value);

                    setFormError(null);
                  }}
                  className="
                      rounded
                      p-0.5
                      transition
                      hover:scale-110
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  aria-label={`Đánh giá ${value} sao`}
                  aria-pressed={value === rating}
                >
                  <Star
                    size={22}
                    className={
                      value <= rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-[#d3dad6]"
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          {/* CONTENT */}
          <textarea
            value={content}
            onChange={(event) => {
              setContent(event.target.value);

              if (formError) {
                setFormError(null);
              }
            }}
            rows={4}
            maxLength={1000}
            disabled={submitting}
            placeholder="Chia sẻ cảm nhận của bạn về bất động sản này..."
            className="
              w-full
              resize-none
              rounded-lg
              border
              border-[#d7dfdb]
              px-3
              py-2.5
              text-sm
              text-[#313a35]
              outline-none
              transition
              placeholder:text-[#9aa39e]
              focus:border-brand
              focus:ring-2
              focus:ring-brand/10
              disabled:bg-[#f6f7f6]
            "
          />

          {/* CHARACTER COUNT */}
          <div
            className="
              mt-1
              text-right
              text-xs
              text-[#929c96]
            "
          >
            {content.length}/1000
          </div>

          {/* FORM ERROR */}
          {formError && (
            <p
              className="
                mt-2
                text-sm
                text-red-600
              "
            >
              {formError}
            </p>
          )}

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="
              mt-3
              rounded-lg
              bg-brand
              px-5
              py-2.5
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-brand-hover
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {submitting ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </form>
      )}

      {/* =================================================
          GUEST
          ================================================= */}
      {!user && (
        <p
          className="
            mt-4
            text-sm
            text-[#6f7a74]
          "
        >
          <Link
            href="/login"
            className="
              font-semibold
              text-brand
              hover:underline
            "
          >
            Log in
          </Link>{" "}
          để viết đánh giá.
        </p>
      )}

      {/* =================================================
          SELLER / ADMIN
          ================================================= */}
      {user && !canReview && (
        <p
          className="
              mt-4
              text-sm
              text-[#7a857f]
            "
        >
          Tài khoản này chỉ có thể xem đánh giá.
        </p>
      )}

      {/* =================================================
          LOADING
          ================================================= */}
      {loading && (
        <p
          className="
            mt-6
            text-sm
            text-[#869089]
          "
        >
          Đang tải đánh giá...
        </p>
      )}

      {/* =================================================
          ERROR
          ================================================= */}
      {error && (
        <div
          className="
            mt-5
            rounded-lg
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-sm
            text-red-600
          "
        >
          {error}
        </div>
      )}

      {/* =================================================
          EMPTY
          ================================================= */}
      {!loading && !error && reviews.length === 0 && (
        <p
          className="
              mt-6
              text-sm
              text-[#869089]
            "
        >
          Bất động sản này chưa có đánh giá nào.
        </p>
      )}

      {/* =================================================
          REVIEW LIST
          ================================================= */}
      <div
        className="
          mt-5
          space-y-4
        "
      >
        {reviews.map((review) => {
          const authorName =
            [review.userId?.firstName, review.userId?.lastName]
              .filter(Boolean)
              .join(" ")
              .trim() ||
            review.userId?.username ||
            "Người dùng EstateMind";

          const reviewDate = formatReviewDate(review.createdAt);

          /*
           * Only the owner sees Delete.
           */
          const isOwner = Boolean(user) && review.userId?.id === user?.id;

          const deleting = deletingReviewId === review.id;

          return (
            <article
              key={review.id}
              className="
                  rounded-xl
                  border
                  border-[#e1e7e3]
                  bg-white
                  p-5
                "
            >
              {/* HEADER */}
              <div
                className="
                    flex
                    items-start
                    justify-between
                    gap-4
                  "
              >
                <div
                  className="
                      min-w-0
                    "
                >
                  <p
                    className="
                        truncate
                        font-semibold
                        text-[#34413a]
                      "
                  >
                    {authorName}
                  </p>

                  {reviewDate && (
                    <p
                      className="
                          mt-1
                          text-xs
                          text-[#8c9690]
                        "
                    >
                      {reviewDate}
                    </p>
                  )}
                </div>

                <div
                  className="
                      flex
                      shrink-0
                      items-center
                      gap-3
                    "
                >
                  <Stars rating={review.rating} />

                  {/* DELETE OWN REVIEW */}
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => handleDeleteReview(review)}
                      disabled={deletingReviewId !== null}
                      title="Xóa đánh giá"
                      aria-label="Xóa đánh giá"
                      className="
                          grid
                          h-8
                          w-8
                          place-items-center
                          rounded-lg
                          text-[#a26d6d]
                          transition
                          hover:bg-red-50
                          hover:text-red-600
                          disabled:cursor-not-allowed
                          disabled:opacity-40
                        "
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* REVIEW CONTENT */}
              <p
                className="
                    mt-3
                    whitespace-pre-line
                    text-sm
                    leading-6
                    text-[#66716b]
                  "
              >
                {review.content}
              </p>

              {/* DELETE STATUS */}
              {deleting && (
                <p
                  className="
                      mt-3
                      text-xs
                      text-[#89948e]
                    "
                >
                  Đang xóa đánh giá...
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
