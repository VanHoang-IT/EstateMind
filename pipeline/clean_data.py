import pandas as pd
import re

MIN_AREA_M2 = 10.0
MAX_AREA_M2 = 2_000.0

# Ngưỡng theo loại giao dịch (đơn vị: đồng)
SALE_MIN_VND = 100_000_000
SALE_MAX_VND = 200_000_000_000
RENT_MIN_VND = 300_000
RENT_MAX_VND = 500_000_000

_NUMBER_TOKEN = r"\d[\d.,]*"

_AREA_RE = re.compile(
    rf"({_NUMBER_TOKEN})\s*(?:m2|m²|m\s*vu[oô]ng|mét vuông|mét)\b",
    re.IGNORECASE,
)
_TY_RE = re.compile(rf"({_NUMBER_TOKEN})\s*(?:tỷ|tỉ)", re.IGNORECASE)
_TRIEU_RE = re.compile(rf"({_NUMBER_TOKEN})\s*(?:triệu|trđ\b|tr\b)", re.IGNORECASE)
_NGHIN_RE = re.compile(rf"({_NUMBER_TOKEN})\s*(?:nghìn|ngàn|k)\b", re.IGNORECASE)
_UNIT_PRICE_RE = re.compile(
    rf"({_NUMBER_TOKEN})\s*(?:tr|triệu)\s*/\s*(?:m2|m²)", re.IGNORECASE
)
_BEDROOM_RE = re.compile(r"(\d+)\s*(?:pn\b|phòng ngủ|ngủ\b)", re.IGNORECASE)
_NEGOTIABLE_RE = re.compile(r"thỏa thuận|thoả thuận", re.IGNORECASE)

HCM_KEYWORDS = re.compile(
    r"(hồ chí minh|tp\.hcm|hcm|sài gòn|quận \d+|tân bình|phú nhuận|"
    r"bình thạnh|gò vấp|thủ đức|nhà bè|bình chánh)",
    re.IGNORECASE,
)


def parse_vn_number(raw):
    if raw is None:
        return None
    text = str(raw).strip().strip(".,")
    if not text:
        return None
    if "," in text:
        text = text.replace(".", "").replace(",", ".")
    else:
        parts = text.split(".")
        if len(parts) > 1 and all(len(p) == 3 for p in parts[1:]):
            text = "".join(parts)
    try:
        return float(text)
    except ValueError:
        return None


def _search_number(pattern, *sources):
    for source in sources:
        if not source:
            continue
        match = pattern.search(source)
        if match:
            value = parse_vn_number(match.group(1))
            if value is not None:
                return value
    return None


def _clean_text(value):
    if value is None:
        return ""
    if isinstance(value, float) and pd.isna(value):
        return ""
    text = str(value).strip()
    return "" if text.lower() == "nan" else text


def parse_and_calculate(row):
    title = _clean_text(row.get("title"))
    desc = _clean_text(row.get("description"))
    price_raw = _clean_text(row.get("price_raw"))
    area_raw = _clean_text(row.get("area_raw"))
    bedrooms = _clean_text(row.get("bedrooms"))
    listing_type = _clean_text(row.get("listing_type")).upper() or "BAN"
    address = _clean_text(row.get("address"))
    district = _clean_text(row.get("district"))

    # Địa chỉ mới là chỗ chắc chắn chứa "Hồ Chí Minh" — trước đây bỏ sót
    # nên nhiều tin hợp lệ bị loại oan.
    full_text = f"{title} {desc} {price_raw} {area_raw} {address} {district}"
    is_hcm = bool(HCM_KEYWORDS.search(full_text))
    is_negotiable = bool(_NEGOTIABLE_RE.search(price_raw))

    # ---- Diện tích ----
    area = _search_number(_AREA_RE, area_raw, title, desc)
    if area is None and area_raw:
        area = parse_vn_number(area_raw)
    if area is not None and not (MIN_AREA_M2 <= area <= MAX_AREA_M2):
        area = None

    # ---- Giá (đổi hết về ĐỒNG) ----
    price_vnd = None
    if not is_negotiable:
        if listing_type == "THUE":
            # Tin thuê: giá tính bằng triệu/tháng
            trieu = _search_number(_TRIEU_RE, price_raw, title)
            if trieu is not None:
                price_vnd = trieu * 1_000_000
            else:
                nghin = _search_number(_NGHIN_RE, price_raw, title)
                if nghin is not None:
                    price_vnd = nghin * 1_000
        else:
            # Tin bán: ưu tiên tỷ, rồi triệu
            ty = _search_number(_TY_RE, price_raw, title)
            if ty is not None:
                price_vnd = ty * 1_000_000_000
            else:
                trieu = _search_number(_TRIEU_RE, price_raw, title)
                if trieu is not None:
                    price_vnd = trieu * 1_000_000

            # Nếu không có giá tổng, thử suy từ đơn giá * diện tích
            if price_vnd is None and area:
                unit = _search_number(_UNIT_PRICE_RE, price_raw, title, desc)
                if unit is not None:
                    price_vnd = unit * 1_000_000 * area

    # ---- Kiểm tra ngưỡng theo loại ----
    if price_vnd is not None:
        if listing_type == "THUE":
            if not (RENT_MIN_VND <= price_vnd <= RENT_MAX_VND):
                price_vnd = None
        else:
            if not (SALE_MIN_VND <= price_vnd <= SALE_MAX_VND):
                price_vnd = None

    # ---- Phòng ngủ ----
    bed_count = bedrooms if bedrooms else None
    if not bed_count:
        bed_match = _BEDROOM_RE.search(f"{title} {desc}")
        if bed_match:
            bed_count = f"{bed_match.group(1)} PN"

    return pd.Series({
        "is_hcm": is_hcm,
        "is_negotiable": is_negotiable,
        "bedrooms_clean": bed_count,
        "area_m2": round(area, 2) if area else None,
        "price_vnd": round(price_vnd) if price_vnd else None,
    })


def clean_dataset(input_file, output_file):
    print(f"📥 Đang đọc dữ liệu từ: {input_file}...")
    try:
        df = pd.read_csv(input_file)
    except FileNotFoundError:
        print("❌ Không tìm thấy file gốc!")
        return

    print(f"📊 Tổng số dòng ban đầu: {len(df)}")

    if "listing_type" not in df.columns:
        df["listing_type"] = "BAN"
    if "category_id" not in df.columns:
        df["category_id"] = 1

    print("🛠️ Đang bóc tách giá, diện tích, phòng ngủ...")
    parsed = df.apply(parse_and_calculate, axis=1)
    df_clean = pd.concat([df, parsed], axis=1)
    df_clean = df_clean.loc[:, ~df_clean.columns.duplicated()]

    df_clean = df_clean[df_clean["is_hcm"] == True]
    print(f"📍 Sau lọc HCM: {len(df_clean)}")

    final_columns = [
        "url", "title", "description", "address", "district",
        "price_vnd", "area_m2", "bedrooms_clean", "is_negotiable",
        "listing_type", "category_id",
        "latitude", "longitude", "post_date", "crawl_date", "main_image",
        "specs_json",
    ]
    existing = [c for c in final_columns if c in df_clean.columns]
    df_final = df_clean[existing]

    df_final = df_final.dropna(subset=["url"])

    total = len(df_final)
    if total:
        no_price = int(df_final["price_vnd"].isna().sum())
        no_area = int(df_final["area_m2"].isna().sum())
        by_type = df_final["listing_type"].value_counts().to_dict()

        print(f"\n📈 Giữ {total} dòng:")
        print(f"   theo loại        : {by_type}")
        print(f"   thiếu giá        : {no_price} ({no_price/total*100:.1f}%)")
        print(f"   thiếu diện tích  : {no_area} ({no_area/total*100:.1f}%)")

    print(f"\n💾 Lưu {total} dòng ra: {output_file}")
    df_final.to_csv(output_file, index=False, encoding="utf-8-sig")
    print("🎉 Hoàn tất!")