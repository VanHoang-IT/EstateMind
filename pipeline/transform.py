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


def _merge_address(a, d):
    a = " ".join(str(a or "").split()).strip(" ,-")
    d = " ".join(str(d or "").split()).strip(" ,-")
    if not d:
        return a
    if not a:
        return d
    if d.casefold() in a.casefold():
        return a
    parts = [p.strip() for p in a.split(",") if p.strip()]
    if any(p.casefold() == d.casefold() for p in parts):
        return a
    return f"{a}, {d}"


def transform(df):
    result = pd.DataFrame(index=df.index)

    result["seller_id"] = 1

    if "category_id" in df.columns:
        result["category_id"] = pd.to_numeric(
            df["category_id"], errors="coerce"
        ).fillna(1).astype(int)
    else:
        result["category_id"] = 1

    # title là NOT NULL trong DB. Crawler đôi khi không lấy được h1
    # (trang lỗi / Cloudflare) -> lấy tạm từ địa chỉ để không mất tin.
    raw_title = df.get("title", pd.Series(dtype=str)).fillna("").astype(str).str.strip()
    fallback_title = (
        df.get("address", pd.Series(dtype=str)).fillna("").astype(str).str.strip()
    )

    result["title"] = raw_title.where(raw_title != "", fallback_title)
    result["description"] = df["description"]
    result["url"] = df.get("url", pd.Series(dtype=str))
    result["url_crawl"] = "batdongsan.com.vn"
    result["main_image"] = df.get("main_image", pd.Series(dtype=str))

    # Đặc điểm bất động sản dạng JSON (mỗi loại hình có bộ trường khác nhau)
    result["attributes"] = df.get("specs_json", pd.Series(dtype=str))

    addr = df.get("address", pd.Series(dtype=str)).fillna("")
    dist = df.get("district", pd.Series(dtype=str)).fillna("")
    combined = pd.Series(
        [_merge_address(a, d) for a, d in zip(addr, dist)],
        index=addr.index,
    )
    result["address"] = combined.replace("", "Hồ Chí Minh")
    result["district"] = dist.replace("", "Hồ Chí Minh")

    # Giá đã ở đơn vị ĐỒNG từ clean_data (cả bán lẫn thuê)
    result["price"] = pd.to_numeric(
        df.get("price_vnd", pd.Series(dtype=float)), errors="coerce"
    )
    result["area"] = pd.to_numeric(
        df.get("area_m2", pd.Series(dtype=float)), errors="coerce"
    )

    if "bedrooms_clean" in df.columns:
        result["bedrooms"] = (
            df["bedrooms_clean"].astype(str)
            .str.extract(r"(\d+)", expand=False)
            .astype(float).astype("Int64")
        )
    else:
        result["bedrooms"] = None

    result["status"] = "AVAILABLE"

    result["latitude"] = pd.to_numeric(
        df.get("latitude", pd.Series(dtype=float)), errors="coerce"
    )
    result["longitude"] = pd.to_numeric(
        df.get("longitude", pd.Series(dtype=float)), errors="coerce"
    )

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
    fallback = pd.to_datetime(df.get("crawl_date", pd.Series(dtype=str)), errors="coerce")
    result["created_at"] = parsed_created_at.fillna(fallback)
    result["updated_at"] = fallback
    result["crawl_date"] = fallback

    before = len(result)
    result = result.dropna(subset=["url"])
    result = result[result["url"].astype(str).str.strip() != ""]

    # title vẫn rỗng sau khi lấy tạm địa chỉ -> không cứu được, phải bỏ.
    result = result[result["title"].astype(str).str.strip() != ""]

    dropped = before - len(result)
    if dropped:
        print(f"⚠️ Bỏ {dropped} dòng thiếu url hoặc title.")

    print(f"   thiếu giá      : {result['price'].isna().sum()}")
    print(f"   thiếu diện tích: {result['area'].isna().sum()}")
    print(f"   thiếu toạ độ   : {result['latitude'].isna().sum()}")

    return result


def transform_images(img_df, mapping_df):
    img_df = img_df.dropna(subset=['image_url'])
    merged = pd.merge(
        img_df, mapping_df,
        left_on="post_url", right_on="url", how="inner",
    )
    result = pd.DataFrame()
    result["property_id"] = merged["id"]
    result["image_url"] = merged["image_url"]
    return result