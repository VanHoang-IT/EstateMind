import pandas as pd


def transform(df):
    # 1. Khởi tạo DataFrame mang sẵn số dòng của df gốc
    result = pd.DataFrame(index=df.index)

    # Điền giá trị mặc định cho khóa ngoại
    result["seller_id"] = 1
    result["category_id"] = 1

    result["title"] = df["title"]
    result["description"] = df["description"]

    # Lưu lại URL
    result["url"] = df.get("url", pd.Series(dtype=str))

    # Nguồn crawl — hiện tại chỉ crawl từ batdongsan.com.vn,
    # set tường minh ở đây để khi có thêm crawler nguồn khác
    # (vd: chotot.com) chỉ cần đổi giá trị này cho đúng nguồn.
    result["url_crawl"] = "batdongsan.com.vn"

    # ==========================================
    # 2. XỬ LÝ ĐỊA CHỈ & QUẬN (CHUẨN HÓA THEO DB)
    # ==========================================
    addr = df.get("address", pd.Series(dtype=str)).fillna("")
    dist = df.get("district", pd.Series(dtype=str)).fillna("")

    # QUAN TRỌNG: sau đợt sáp nhập hành chính, batdongsan.com.vn hiển thị
    # cả address-line-1 (addr) VÀ address-line-2 (dist) đều kèm tên
    # phường/thành phố mới -> nếu nối thẳng addr + dist sẽ bị LẶP đoạn
    # "(Phường X, Hồ Chí Minh mới)" 2 lần. Chỉ nối dist vào address nếu
    # dist CHƯA xuất hiện sẵn trong addr, tránh trùng lặp.
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

    # Tách riêng cột District truyền vào DB
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

    # ĐÃ XÓA BATHROOMS VÀ FLOORS VÌ DB KHÔNG CÓ!
    result["status"] = "AVAILABLE"

    # ==========================================
    # 3.5 CÁC CỘT TIỆN ÍCH (has_garden/garage/pool/aircon)
    # ==========================================
    # QUAN TRỌNG: crawler hiện KHÔNG thu thập được thông tin này.
    # Trước đây các cột này bị bỏ trống khi insert -> DB tự áp default
    # SAI là `true` cho mọi property, khiến dữ liệu nói dối là "có đủ
    # tiện ích" dù không biết thật hay không.
    #
    # Explicitly set = None (NULL) để thể hiện đúng "chưa rõ", thay vì
    # để trống cho DB tự điền default. Migration đã DROP DEFAULT của
    # các cột này ở DB, nhưng set tường minh ở đây để chắc chắn dù
    # default DB có bị đổi lại trong tương lai.
    result["has_garden"] = None
    result["has_garage"] = None
    result["has_swimming_pool"] = None
    result["has_air_conditioning"] = None

    # ==========================================
    # 4. CẬP NHẬT LẠI TỌA ĐỘ & THỜI GIAN
    # ==========================================
    result["latitude"] = df.get("latitude", pd.Series(dtype=float))
    result["longitude"] = df.get("longitude", pd.Series(dtype=float))

    parsed_created_at = pd.to_datetime(
        df.get("post_date", pd.Series(dtype=str)),
        format="%d/%m/%Y",
        errors="coerce"
    )
    # Nếu không parse được post_date (NaT), fallback về crawl_date thay vì
    # để NULL đè lên DEFAULT CURRENT_TIMESTAMP của DB -> tránh mất mốc thời gian.
    fallback_crawl_date = pd.to_datetime(
        df.get("crawl_date", pd.Series(dtype=str)),
        errors="coerce"
    )
    result["created_at"] = parsed_created_at.fillna(fallback_crawl_date)

    result["updated_at"] = pd.to_datetime(
        df.get("crawl_date", pd.Series(dtype=str)),
        errors="coerce"
    )

    result["crawl_date"] = pd.to_datetime(
        df.get("crawl_date", pd.Series(dtype=str)),
        errors="coerce"
    )

    # Chốt chặn bảo vệ: Dòng nào mất Giá, Diện tích hoặc URL thì bỏ đi
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