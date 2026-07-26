import { API_URL, throwIfNotOk } from "@/lib/api";

export interface PropertyCategory {
  id: number;
  name: string;
  description?: string;
  propertyTypeId?: number | PropertyTypeReference;
}

export interface PropertyTypeReference {
  id: number;
  name?: string;
}

export interface PropertyType {
  id: number;
  name: string;
  description?: string;
  categories: PropertyCategory[];
}

interface RawPropertyType {
  id: number;
  name: string;
  description?: string;
  categories?: PropertyCategory[];
  categorySet?: PropertyCategory[];
  categoriesSet?: PropertyCategory[];
}

interface PageResponseLike<T> {
  items?: T[];
  content?: T[];
  data?: T[];
}

function extractArray<T>(
  value: T[] | PageResponseLike<T>,
): T[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value.items)) {
    return value.items;
  }

  if (Array.isArray(value.content)) {
    return value.content;
  }

  if (Array.isArray(value.data)) {
    return value.data;
  }

  return [];
}

function getCategoryPropertyTypeId(
  category: PropertyCategory,
): number | undefined {
  if (typeof category.propertyTypeId === "number") {
    return category.propertyTypeId;
  }

  return category.propertyTypeId?.id;
}

function normalizePropertyType(
  propertyType: RawPropertyType,
): PropertyType {
  const categories =
    propertyType.categories ??
    propertyType.categorySet ??
    propertyType.categoriesSet ??
    [];

  return {
    id: propertyType.id,
    name: propertyType.name,
    description: propertyType.description,
    categories: [...categories].sort((a, b) => a.id - b.id),
  };
}

export const propertyTypeService = {
  async getPropertyTypes(): Promise<PropertyType[]> {
    const typeResponse = await fetch(`${API_URL}/property-types`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    await throwIfNotOk(typeResponse);

    const rawTypeData:
      | RawPropertyType[]
      | PageResponseLike<RawPropertyType> =
      await typeResponse.json();

    const propertyTypes = extractArray(rawTypeData)
      .map(normalizePropertyType)
      .sort((a, b) => a.id - b.id);

    const alreadyHasCategories = propertyTypes.some(
      (propertyType) => propertyType.categories.length > 0,
    );

    if (alreadyHasCategories) {
      return propertyTypes;
    }

    /*
     * Fallback cho trường hợp API /property-types chỉ trả loại chính,
     * còn category được cung cấp qua endpoint /categories.
     */
    try {
      const categoryResponse = await fetch(`${API_URL}/categories`, {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      await throwIfNotOk(categoryResponse);

      const rawCategoryData:
        | PropertyCategory[]
        | PageResponseLike<PropertyCategory> =
        await categoryResponse.json();

      const categories = extractArray(rawCategoryData);

      return propertyTypes.map((propertyType) => ({
        ...propertyType,
        categories: categories
          .filter(
            (category) =>
              getCategoryPropertyTypeId(category) === propertyType.id,
          )
          .sort((a, b) => a.id - b.id),
      }));
    } catch {
      return propertyTypes;
    }
  },
};