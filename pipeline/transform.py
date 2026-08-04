import pandas as pd
import re as _re
from datetime import timedelta


def _parse_post_date(value, crawl_value):
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return pd.NaT
    s = str(value).strip().lower()
    base = pd.to_datetime(crawl_value, errors="coerce")
    if "hôm nay" in s:
        return base.normalize() if pd.notna(base) else pd.NaT
    if "hôm qua" in s:
        return (base - timedelta(days=1)).normalize() if pd.notna(base) else pd.NaT
    m = _re.search(r"(\d+)\s*ngày trước", s)
    if m and pd.notna(base):
        return (base - timedelta(days=int(m.group(1)))).normalize()
    return pd.to_datetime(s, format="%d/%m/%Y", errors="coerce")


def transform(df):
    result = pd.DataFrame(index=df.index)

    result["seller_id"] = 1
    result["category_id"] = 1

    result["title"] = df["title"]
    result["description"] = df["description"]

    result["url"] = df.get("url", pd.Series(dtype=str))

    # Nguồn crawl — hiện tại chỉ crawl từ batdongsan.com.vn
    result["url_crawl"] = "batdongsan.com.vn"

    # Ảnh đại diện lấy từ card trang list (hoặc fallback ảnh đầu slide)
    result["main_image"] = df.get("main_image", pd.Series(dtype=str))

    # ==========================================
    # 2. XỬ LÝ ĐỊA CHỈ & QUẬN
    # ==========================================
    addr = df.get("address", pd.Series(dtype=str)).fillna("")
    dist = df.get("district", pd.Series(dtype=str)).fillna("")

    def _merge_address(a: str, d: str) -> str:
        a = a.strip()
        d = d.strip()
        if not d or d in a:
            return a.strip(", ")
        return f"{a}, {d}".strip(", ")

    combined_address = pd.Series(
        [_merge_address(a, d) for a, d in zip(addr, dist)],
        index=addr.index,
    )

    result["address"] = combined_address.replace("", "Hồ Chí Minh")
    result["district"] = dist.replace("", "Hồ Chí Minh")

    # ==========================================
    # 3. CHUẨN HÓA CÁC CHỈ SỐ CƠ BẢN
    # ==========================================
    result["price"] = df.get("price_ty_vnd", pd.Series(dtype=float)) * 1_000_000_000
    result["area"] = df.get("area_m2", pd.Series(dtype=float))

    if "bedrooms_clean" in df.columns:
        result["bedrooms"] = (
            df["bedrooms_clean"]
            .astype(str)
            .str.extract(r"(\d+)", expand=False)
            .astype(float)
            .astype("Int64")
        )
    else:
        result["bedrooms"] = None

    result["status"] = "AVAILABLE"

    # ==========================================
    # 4. TỌA ĐỘ & THỜI GIAN
    # ==========================================
    result["latitude"] = df.get("latitude", pd.Series(dtype=float))
    result["longitude"] = df.get("longitude", pd.Series(dtype=float))

    # Parse post_date linh hoạt: "dd/mm/yyyy", "Hôm nay", "Hôm qua", "N ngày trước"
    parsed_created_at = pd.Series(
        [
            _parse_post_date(v, c)
            for v, c in zip(
                df.get("post_date", pd.Series(dtype=str)),
                df.get("crawl_date", pd.Series(dtype=str)),
            )
        ],
        index=df.index,
    )

    fallback_crawl_date = pd.to_datetime(
        df.get("crawl_date", pd.Series(dtype=str)),
        errors="coerce"
    )
    result["created_at"] = parsed_created_at.fillna(fallback_crawl_date)

    result["updated_at"] = fallback_crawl_date
    result["crawl_date"] = fallback_crawl_date

    result = result.dropna(subset=["price", "area", "url"])

    return result


def transform_images(img_df, mapping_df):
    """Gộp file hình ảnh và mapping từ DB để lấy được Foreign Key (property_id)"""
    img_df = img_df.dropna(subset=['image_url'])

    merged_df = pd.merge(
        img_df,
        mapping_df,
        left_on="post_url",
        right_on="url",
        how="inner"
    )

    result = pd.DataFrame()
    result["property_id"] = merged_df["id"]
    result["image_url"] = merged_df["image_url"]

    return result