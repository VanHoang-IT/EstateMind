import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
from config import *


def get_engine():
    return create_engine(
        f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )


# ============================================================
# INSERT/UPDATE PROPERTY — dùng UPSERT thay vì append thuần
# ============================================================
# Trước đây dùng df.to_sql(if_exists="append") -> mỗi lần chạy lại
# main.py trên cùng dữ liệu (hoặc crawl trùng trang cũ) sẽ tạo
# property TRÙNG LẶP vì không có gì chặn theo `url`.
#
# Giờ dùng INSERT ... ON CONFLICT (url) DO UPDATE, đồng thời tự tính
# `geom` (PostGIS) từ latitude/longitude ngay trong câu SQL — việc mà
# to_sql() của pandas không làm được vì geom là kiểu geography đặc biệt.
#
# Yêu cầu: đã chạy migration thêm UNIQUE constraint trên property.url
# (xem file migration_fix_data_quality.sql) và migration thêm cột
# url_crawl (xem file migration_add_url_crawl.sql).
# ============================================================

_UPSERT_PROPERTY_SQL = text("""
    INSERT INTO property (
        seller_id, category_id, title, description, address, district,
        price, area, bedrooms, status, url, url_crawl,
        has_garden, has_garage, has_swimming_pool, has_air_conditioning,
        latitude, longitude, geom,
        created_at, updated_at, crawl_date
    ) VALUES (
        :seller_id, :category_id, :title, :description, :address, :district,
        :price, :area, :bedrooms, :status, :url, :url_crawl,
        :has_garden, :has_garage, :has_swimming_pool, :has_air_conditioning,
        :latitude, :longitude,
        CASE WHEN :longitude IS NOT NULL AND :latitude IS NOT NULL
             THEN ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
             ELSE NULL END,
        :created_at, :updated_at, :crawl_date
    )
    ON CONFLICT (url) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        address = EXCLUDED.address,
        district = EXCLUDED.district,
        price = EXCLUDED.price,
        area = EXCLUDED.area,
        bedrooms = EXCLUDED.bedrooms,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        geom = EXCLUDED.geom,
        url_crawl = EXCLUDED.url_crawl,
        updated_at = EXCLUDED.updated_at,
        crawl_date = EXCLUDED.crawl_date
    RETURNING id
""")


def insert_dataframe(df):
    """
    Upsert từng dòng property theo `url`. Trả về số dòng đã xử lý
    (insert mới hoặc update).
    """
    engine = get_engine()

    # Thay NaN/NaT của pandas bằng None để psycopg2/SQLAlchemy hiểu là NULL
    df = df.replace({np.nan: None, pd.NaT: None})

    processed = 0
    with engine.begin() as conn:
        for _, row in df.iterrows():
            conn.execute(_UPSERT_PROPERTY_SQL, {
                "seller_id": row["seller_id"],
                "category_id": row["category_id"],
                "title": row["title"],
                "description": row["description"],
                "address": row["address"],
                "district": row["district"],
                "price": row["price"],
                "area": row["area"],
                "bedrooms": row["bedrooms"],
                "status": row["status"],
                "url": row["url"],
                "url_crawl": row.get("url_crawl", "batdongsan.com.vn"),
                "has_garden": row.get("has_garden"),
                "has_garage": row.get("has_garage"),
                "has_swimming_pool": row.get("has_swimming_pool"),
                "has_air_conditioning": row.get("has_air_conditioning"),
                "latitude": row["latitude"],
                "longitude": row["longitude"],
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
                "crawl_date": row["crawl_date"],
            })
            processed += 1

    print(f"Upserted {processed} rows (insert mới hoặc update nếu url đã tồn tại).")
    return processed


def get_property_url_mapping():
    """Lấy danh sách ID và URL từ DB để map với hình ảnh"""
    engine = get_engine()
    query = "SELECT id, url FROM property"
    df_map = pd.read_sql(query, con=engine)
    return df_map


def insert_images_dataframe(df):
    """
    Đẩy dữ liệu vào bảng property_images.

    Trước khi insert, xoá ảnh cũ của các property_id liên quan để
    tránh nhân đôi ảnh khi crawl lại (chạy lại main.py trên dữ liệu
    đã từng insert trước đó).
    """
    if df.empty:
        print("Không có ảnh nào để insert.")
        return

    engine = get_engine()
    property_ids = df["property_id"].unique().tolist()

    with engine.begin() as conn:
        conn.execute(
            text("DELETE FROM property_images WHERE property_id = ANY(:ids)"),
            {"ids": property_ids},
        )
        df.to_sql(
            "property_images",
            con=conn,
            if_exists="append",
            index=False,
        )

    print(f"✅ Inserted {len(df)} images (đã xoá ảnh cũ của {len(property_ids)} property trước khi insert lại).")