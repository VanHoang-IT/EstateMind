import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
from config import *


def get_engine():
    return create_engine(
        f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )


def _clean_value(value):
    if value is None or value is pd.NaT or value is pd.NA:
        return None
    if isinstance(value, float) and np.isnan(value):
        return None
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass
    if isinstance(value, np.integer):
        return int(value)
    if isinstance(value, np.floating):
        return float(value)
    if isinstance(value, np.bool_):
        return bool(value)
    return value


_UPSERT_PROPERTY_SQL = text("""
    INSERT INTO property (
        seller_id, category_id, title, description, address, district,
        price, area, bedrooms, status, url, url_crawl, main_image,
        attributes,
        latitude, longitude, geom,
        created_at, updated_at, crawl_date
    ) VALUES (
        :seller_id, :category_id, :title, :description, :address, :district,
        :price, :area, :bedrooms, :status, :url, :url_crawl, :main_image,
        :attributes,
        :latitude, :longitude,
        CASE WHEN :longitude IS NOT NULL AND :latitude IS NOT NULL
             THEN ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
             ELSE NULL END,
        :created_at, :updated_at, :crawl_date
    )
    ON CONFLICT (url) DO UPDATE SET
        category_id = EXCLUDED.category_id,
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
        attributes = COALESCE(EXCLUDED.attributes, property.attributes),
        updated_at = EXCLUDED.updated_at,
        crawl_date = EXCLUDED.crawl_date
    RETURNING id
""")


def insert_dataframe(df):
    """
    Upsert từng dòng trong TRANSACTION RIÊNG.
    Một dòng lỗi chỉ rollback dòng đó, không kéo sập cả mẻ
    (trước đây 1 dòng thiếu title làm hỏng toàn bộ transaction).
    """
    engine = get_engine()
    processed = failed = null_price = 0

    with engine.connect() as conn:
        for _, row in df.iterrows():
            params = {
                "seller_id": _clean_value(row.get("seller_id")) or 1,
                "category_id": _clean_value(row.get("category_id")) or 1,
                "title": _clean_value(row.get("title")),
                "description": _clean_value(row.get("description")),
                "address": _clean_value(row.get("address")),
                "district": _clean_value(row.get("district")),
                "price": _clean_value(row.get("price")),
                "area": _clean_value(row.get("area")),
                "bedrooms": _clean_value(row.get("bedrooms")),
                "status": _clean_value(row.get("status")) or "AVAILABLE",
                "url": _clean_value(row.get("url")),
                "url_crawl": _clean_value(row.get("url_crawl")) or "batdongsan.com.vn",
                "main_image": _clean_value(row.get("main_image")),
                "attributes": _clean_value(row.get("attributes")) or None,
                "latitude": _clean_value(row.get("latitude")),
                "longitude": _clean_value(row.get("longitude")),
                "created_at": _clean_value(row.get("created_at")),
                "updated_at": _clean_value(row.get("updated_at")),
                "crawl_date": _clean_value(row.get("crawl_date")),
            }
            if not params["title"]:
                failed += 1
                print(f"⚠️ Bỏ qua (thiếu title): {params['url']}")
                continue

            if params["price"] is None:
                null_price += 1

            try:
                with conn.begin():
                    conn.execute(_UPSERT_PROPERTY_SQL, params)
                processed += 1
            except Exception as e:
                failed += 1
                message = str(e).split("\n")[0]
                print(f"⚠️ Bỏ qua {params['url']}: {message}")

    print(f"✅ Đã upsert {processed} property.")
    print(f"   không có giá (Thỏa thuận): {null_price}")
    if failed:
        print(f"❌ Thất bại: {failed} dòng.")
    return processed


def get_property_url_mapping():
    engine = get_engine()
    with engine.connect() as conn:
        return pd.read_sql(
            text("SELECT id, url FROM property WHERE url IS NOT NULL"), conn
        )


def backfill_main_image():
    engine = get_engine()
    with engine.begin() as conn:
        result = conn.execute(text("""
            UPDATE property p
            SET main_image = sub.image_url
            FROM (
                SELECT DISTINCT ON (property_id) property_id, image_url
                FROM property_images
                ORDER BY property_id, id
            ) sub
            WHERE p.id = sub.property_id
              AND (p.main_image IS NULL OR p.main_image = '')
        """))
        updated = result.rowcount
    print(f"✅ Đã backfill main_image cho {updated} property.")
    return updated


def insert_images_dataframe(df):
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
                {"property_id": int(row["property_id"]), "image_url": row["image_url"]},
            )
            inserted += result.rowcount
    print(f"✅ Đã insert {inserted} hình ảnh mới.")
    return inserted