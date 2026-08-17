import {
  Review,
  ReviewInput,
} from "@/types/review";

import {
  API_URL,
  authFetch,
  throwIfNotOk,
} from "@/lib/api";

export const reviewService = {
  /*
   * =====================================================
   * GET REVIEWS
   * PUBLIC
   * =====================================================
   */
  async getReviewsByProperty(
    propertyId:
      | number
      | string,
  ): Promise<Review[]> {
    const res = await fetch(
      `${API_URL}/properties/${propertyId}/reviews`,
      {
        cache: "no-store",

        headers: {
          Accept:
            "application/json",
        },
      },
    );

    await throwIfNotOk(
      res,
    );

    return res.json();
  },

  /*
   * =====================================================
   * CREATE REVIEW
   * CUSTOMER
   * =====================================================
   */
  async createReview(
    input: ReviewInput,
  ): Promise<Review> {
    const res =
      await authFetch(
        "/secure/reviews",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body:
            JSON.stringify(
              input,
            ),
        },
      );

    await throwIfNotOk(
      res,
    );

    return res.json();
  },

  /*
   * =====================================================
   * DELETE OWN REVIEW
   * =====================================================
   */
  async deleteReview(
    id:
      | number
      | string,
  ): Promise<void> {
    const res =
      await authFetch(
        `/secure/reviews/${id}`,
        {
          method:
            "DELETE",
        },
      );

    await throwIfNotOk(
      res,
    );
  },
};