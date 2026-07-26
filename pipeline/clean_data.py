import pandas as pd
import re


def parse_and_calculate(row):
    """Gộp toàn bộ text để siêu parser quét qua"""
    title = str(row.get('title', ''))
    desc = str(row.get('description', ''))
    price_raw = str(row.get('price_raw', ''))
    area_raw = str(row.get('area_raw', ''))
    bedrooms = str(row.get('bedrooms', ''))

    full_text = f"{title} {desc} {price_raw} {area_raw}"

    # ==========================================
    # 1. LỌC LOCATION: Kiểm tra có phải ở HCM không
    # ==========================================
    hcm_keywords = r'(hồ chí minh|tp\.hcm|hcm|sài gòn|quận \d+|tân bình|phú nhuận|bình thạnh|gò vấp|thủ đức|nhà bè|bình chánh)'
    is_hcm = bool(re.search(hcm_keywords, full_text, re.IGNORECASE))

    # ==========================================
    # 2. BÓC TÁCH DIỆN TÍCH & GIÁ
    # ==========================================
    area, unit_price, total_price = None, None, None

    area_match = re.search(r'(\d+(?:[.,]\d+)?)\s*(?:m2|m²|mét vuông)', full_text, re.IGNORECASE)
    if area_match:
        area = float(area_match.group(1).replace(',', '.'))

    unit_match = re.search(r'(\d+(?:[.,]\d+)?)\s*(?:tr/m2|triệu/m2|tr / m2)', full_text, re.IGNORECASE)
    if unit_match:
        unit_price = float(unit_match.group(1).replace(',', '.'))

    ty_match = re.search(r'(\d+(?:[.,]\d+)?)\s*(?:tỷ|tỉ)', full_text, re.IGNORECASE)
    if ty_match:
        total_price = float(ty_match.group(1).replace(',', '.'))
    else:
        trieu_match = re.search(r'(\d+(?:[.,]\d+)?)\s*triệu', full_text, re.IGNORECASE)
        if trieu_match:
            total_price = float(trieu_match.group(1).replace(',', '.')) / 1000

    # 3. TÍNH TOÁN CHÉO
    if area and unit_price and not total_price:
        total_price = (area * unit_price) / 1000
    elif total_price and area and not unit_price:
        unit_price = (total_price * 1000) / area
    elif total_price and unit_price and not area:
        area = (total_price * 1000) / unit_price

    # ==========================================
    # 4. BÓC TÁCH SỐ PHÒNG NGỦ
    # ==========================================
    bed_count = bedrooms if pd.notna(bedrooms) and str(bedrooms).strip() != '' else None
    if not bed_count:
        bed_match = re.search(r'(\d+)\s*(pn|phòng ngủ|ngủ|n\+|phòng)', full_text, re.IGNORECASE)
        if bed_match:
            bed_count = f"{bed_match.group(1)} PN"

    return pd.Series({
        'is_hcm': is_hcm,
        'bedrooms_clean': bed_count,
        'area_m2': round(area, 2) if area else None,
        'unit_price_million': round(unit_price, 2) if unit_price else None,
        'price_ty_vnd': round(total_price, 2) if total_price else None
    })


def clean_dataset(input_file, output_file):
    print(f"📥 Đang đọc dữ liệu từ: {input_file}...")
    try:
        df = pd.read_csv(input_file)
    except FileNotFoundError:
        print("❌ Không tìm thấy file gốc!")
        return

    print(f"📊 Tổng số dòng ban đầu: {len(df)}")

    # 1. Áp dụng logic bóc tách
    print(f"🛠️ Đang xử lý bóc tách giá, diện tích và phòng ngủ...")
    parsed_columns = df.apply(parse_and_calculate, axis=1)
    df_clean = pd.concat([df, parsed_columns], axis=1)

    # Chống lặp cột
    df_clean = df_clean.loc[:, ~df_clean.columns.duplicated()]

    # 2. Lọc chỉ lấy Hồ Chí Minh
    df_clean = df_clean[df_clean['is_hcm'] == True]
    print(f"📍 Số dòng sau khi lọc khu vực HCM: {len(df_clean)}")

    # ==========================================
    # 3. LỌC BỎ CÁC DÒNG JUNK (THỎA THUẬN HOẶC NULL PHÒNG NGỦ)
    # ==========================================
    df_clean = df_clean.dropna(subset=['price_ty_vnd', 'bedrooms_clean'])
    print(f"🧹 Số dòng sạch chuẩn 100% (Có giá cụ thể, có phòng ngủ): {len(df_clean)}")

    # 4. Lựa chọn các cột xuất file
    final_columns = [
        'url',
        'title',
        'description',
        'address',
        'district',
        'price_ty_vnd',
        'unit_price_million',
        'area_m2',
        'bedrooms_clean',
        'latitude',
        'longitude',
        'post_date',
        'crawl_date'
    ]

    existing_columns = [col for col in final_columns if col in df_clean.columns]
    df_final = df_clean[existing_columns]

    # LOẠI BỎ TOÀN BỘ CÁC HÀNG CÓ CHỨA GIÁ TRỊ NULL Ở BẤT KỲ CỘT NÀO
    df_final = df_final.dropna()

    print(f"💾 Đang lưu {len(df_final)} dòng dữ liệu chuẩn hóa ra file: {output_file}...")
    df_final.to_csv(output_file, index=False, encoding='utf-8-sig')
    print("🎉 Hoàn tất quá trình làm sạch!")