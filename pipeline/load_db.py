import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
from config import *


def get_engine():
    return create_engine(
        f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )


_UPSERT_PROPERTY_SQL = text("""
    INSERT INTO property (
        seller_id, category_id, title, description, address, district,
        price, area, bedrooms, status, url, url_crawl, main_image,
        latitude, longitude, geom,
        created_at, updated_at, crawl_date
    ) VALUES (
        :seller_id, :category_id, :title, :description, :address, :district,
        :price, :area, :bedrooms, :status, :url, :url_crawl, :main_image,
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
        main_image = COALESCE(EXCLUDED.main_image, property.main_image),
        updated_at = EXCLUDED.updated_at,
        crawl_date = EXCLUDED.crawl_date
    RETURNING id
""")


def insert_dataframe(df):
    """
    Upsert từng dòng property theo `url`. Trả về số dòng đã xử lý.
    """
    engine = get_engine()

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
                "main_image": row.get("main_image"),
                "latitude": row["latitude"],
                "longitude": row["longitude"],
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
                "crawl_date": row["crawl_date"],
            })
            processed += 1

    print(f"✅ Đã upsert {processed} property vào DB.")
    return processed


def get_property_url_mapping():
    """Query DB lấy mapping url -> id để map foreign key cho hình ảnh."""
    engine = get_engine()
    with engine.connect() as conn:
        df = pd.read_sql(
            text("SELECT id, url FROM property WHERE url IS NOT NULL"),
            conn,
        )
    return df


def insert_images_dataframe(df):
    """
    Insert hình ảnh, bỏ qua các cặp (property_id, image_url) đã tồn tại
    để chạy lại pipeline không tạo ảnh trùng.
    """
    engine = get_engine()

    df = df.replace({np.nan: None, pd.NaT: None})

    inserted = 0
    with engine.begin() as conn:
        for _, row in df.iterrows():
            result = conn.execute(
                text("""
                    INSERT INTO property_images (property_id, image_url, is_primary)
                    SELECT :property_id, :image_url, false
                    WHERE NOT EXISTS (
                        SELECT 1 FROM property_images
                        WHERE property_id = :property_id AND image_url = :image_url
                    )
                """),
                {
                    "property_id": int(row["property_id"]),
                    "image_url": row["image_url"],
                },
            )
            inserted += result.rowcount

    print(f"✅ Đã insert {inserted} hình ảnh mới vào DB.")
    return inserted