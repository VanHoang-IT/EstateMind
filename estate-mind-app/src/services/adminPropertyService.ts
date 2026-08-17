import {
  ModerationStatus,
  Property,
  PropertyFilters,
} from "@/types/property";

import { PageResponse } from "@/types/api";

import {
  authFetch,
  throwIfNotOk,
} from "@/lib/api";


export interface AdminPropertyStats {
  pending: number;
  approved: number;
  rejected: number;
  all: number;
}


function buildQuery(
  filters: PropertyFilters = {}
) {

  const params =
    new URLSearchParams();


  if (filters.search) {

    params.set(
      "search",
      filters.search
    );
  }


  if (filters.district) {

    params.set(
      "district",
      filters.district
    );
  }


  if (filters.status) {

    params.set(
      "status",
      filters.status
    );
  }


  if (filters.moderationStatus) {

    params.set(
      "moderationStatus",
      filters.moderationStatus
    );
  }


  params.set(
    "page",
    String(filters.page ?? 1)
  );


  params.set(
    "size",
    String(filters.size ?? 12)
  );


  return params.toString();
}


async function getProperties(
  filters: PropertyFilters = {}

): Promise<PageResponse<Property>> {

  const query =
    buildQuery(filters);


  const res =
    await authFetch(
      `/secure/admin/properties?${query}`,

      {
        method:
          "GET",

        headers: {
          Accept:
            "application/json",
        },
      }
    );


  await throwIfNotOk(res);


  return res.json();
}


export const adminPropertyService = {


  getProperties,


  async getPropertyById(
    id: number | string

  ): Promise<Property> {

    const res =
      await authFetch(
        `/secure/admin/properties/${id}`,

        {
          method:
            "GET",

          headers: {
            Accept:
              "application/json",
          },
        }
      );


    await throwIfNotOk(res);


    return res.json();
  },


  async getStats():
    Promise<AdminPropertyStats> {

    const [
      pending,
      approved,
      rejected,
      all,
    ] =
      await Promise.all([

        getProperties({
          moderationStatus:
            "PENDING",

          page: 1,
          size: 1,
        }),


        getProperties({
          moderationStatus:
            "APPROVED",

          page: 1,
          size: 1,
        }),


        getProperties({
          moderationStatus:
            "REJECTED",

          page: 1,
          size: 1,
        }),


        getProperties({
          page: 1,
          size: 1,
        }),
      ]);


    return {

      pending:
        pending.totalElements,

      approved:
        approved.totalElements,

      rejected:
        rejected.totalElements,

      all:
        all.totalElements,
    };
  },


  async approveProperty(
    id: number | string

  ): Promise<{
    message: string;
    id: number;
    moderationStatus:
      ModerationStatus;
  }> {

    const res =
      await authFetch(
        `/secure/admin/properties/${id}/approve`,

        {
          method:
            "PUT",
        }
      );


    await throwIfNotOk(res);


    return res.json();
  },


  async rejectProperty(
    id: number | string,

    reason: string

  ): Promise<{
    message: string;
    id: number;
    moderationStatus:
      ModerationStatus;
    rejectionReason: string;
  }> {

    const res =
      await authFetch(
        `/secure/admin/properties/${id}/reject`,

        {
          method:
            "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              reason,
            }),
        }
      );


    await throwIfNotOk(res);


    return res.json();
  },
};