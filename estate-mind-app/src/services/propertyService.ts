import {
  Property,
  PropertyFilters,
  PropertyInput,
} from "@/types/property";
import { PageResponse } from "@/types/api";
import {
  API_URL,
  authFetch,
  throwIfNotOk,
} from "@/lib/api";

export interface PropertyMutationResponse {
  id: number;
  title?: string;
  mainImage?: string;
  message?: string;
}

function buildQuery(filters: PropertyFilters): string {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.district) {
    params.set("district", filters.district);
  }

  if (filters.minPrice != null) {
    params.set("minPrice", String(filters.minPrice));
  }

  if (filters.maxPrice != null) {
    params.set("maxPrice", String(filters.maxPrice));
  }

  if (filters.categoryId != null) {
    params.set(
      "categoryId",
      String(filters.categoryId)
    );
  }

  if (filters.bedrooms != null) {
    params.set(
      "bedrooms",
      String(filters.bedrooms)
    );
  }

  params.set("page", String(filters.page ?? 1));
  params.set("size", String(filters.size ?? 8));

  return params.toString();
}

function createPropertyFormData(
  input: PropertyInput,
  mainImage?: File | null,
  propertyImages: File[] = []
): FormData {
  const formData = new FormData();

  const propertyPayload = {
    title: input.title,
    description: input.description || null,
    address: input.address,
    price: input.price,
    area: input.area ?? null,
    district: input.district || null,
    bedrooms: input.bedrooms ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    categoryId: input.categoryId,
  };

  formData.append(
    "property",
    new Blob(
      [JSON.stringify(propertyPayload)],
      {
        type: "application/json",
      }
    )
  );

  if (mainImage) {
    formData.append("mainImage", mainImage);
  }

  propertyImages.forEach((file) => {
    formData.append("propertyImages", file);
  });

  return formData;
}

export const propertyService = {
  async getProperties(
    filters: PropertyFilters = {}
  ): Promise<PageResponse<Property>> {
    const query = buildQuery(filters);

    const res = await fetch(
      `${API_URL}/properties?${query}`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      }
    );

    await throwIfNotOk(res);

    return res.json();
  },

  async getPropertyById(
    id: number | string
  ): Promise<Property> {
    const res = await fetch(
      `${API_URL}/properties/${id}`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      }
    );

    await throwIfNotOk(res);

    return res.json();
  },

  async createProperty(
    input: PropertyInput,
    mainImage: File,
    propertyImages: File[] = []
  ): Promise<PropertyMutationResponse> {
    const formData = createPropertyFormData(
      input,
      mainImage,
      propertyImages
    );

    const res = await authFetch(
      "/secure/properties",
      {
        method: "POST",
        body: formData,
      }
    );

    await throwIfNotOk(res);

    return res.json();
  },

  async updateProperty(
    id: number | string,
    input: PropertyInput,
    mainImage?: File | null,
    propertyImages: File[] = []
  ): Promise<PropertyMutationResponse> {
    const formData = createPropertyFormData(
      input,
      mainImage,
      propertyImages
    );

    const res = await authFetch(
      `/secure/properties/${id}`,
      {
        method: "PUT",
        body: formData,
      }
    );

    await throwIfNotOk(res);

    return res.json();
  },

  async uploadPropertyImages(
    propertyId: number | string,
    files: File[]
  ): Promise<{
    message: string;
    propertyId: number;
    imageCount: number;
  }> {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("propertyImages", file);
    });

    const res = await authFetch(
      `/secure/properties/${propertyId}/images`,
      {
        method: "POST",
        body: formData,
      }
    );

    await throwIfNotOk(res);

    return res.json();
  },

  async uploadPropertyImage(
    propertyId: number | string,
    file: File
  ): Promise<void> {
    await this.uploadPropertyImages(
      propertyId,
      [file]
    );
  },

  async deleteProperty(
    id: number | string
  ): Promise<void> {
    const res = await authFetch(
      `/secure/properties/${id}`,
      {
        method: "DELETE",
      }
    );

    await throwIfNotOk(res);
  },
};