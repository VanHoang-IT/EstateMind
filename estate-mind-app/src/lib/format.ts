export function isRentCategory(categoryId?: number | null): boolean {
  return categoryId != null && categoryId >= 13;
}

export function formatPrice(
  price?: number | null,
  categoryId?: number | null,
): string {
  if (price == null || price <= 0) {
    return "Thỏa thuận";
  }

  const suffix = isRentCategory(categoryId) ? "/tháng" : "";

  if (price >= 1_000_000_000) {
    return `${(price / 1_000_000_000).toLocaleString("vi-VN", {
      maximumFractionDigits: 2,
    })} tỷ${suffix}`;
  }

  if (price >= 1_000_000) {
    return `${(price / 1_000_000).toLocaleString("vi-VN", {
      maximumFractionDigits: 2,
    })} triệu${suffix}`;
  }

  return `${price.toLocaleString("vi-VN")} đồng${suffix}`;
}

export function formatPricePerM2(
  price?: number | null,
  area?: number | null,
  categoryId?: number | null,
): string {
  if (!price || !area || price <= 0 || area <= 0) {
    return "";
  }

  if (isRentCategory(categoryId)) {
    const perM2 = price / area / 1_000;
    return `${perM2.toLocaleString("vi-VN", {
      maximumFractionDigits: 0,
    })} nghìn/m²/tháng`;
  }

  const perM2 = price / area / 1_000_000;
  return `${perM2.toLocaleString("vi-VN", {
    maximumFractionDigits: 1,
  })} triệu/m²`;
}

export function getInitials(name?: string | null): string {
  if (!name) {
    return "?";
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
