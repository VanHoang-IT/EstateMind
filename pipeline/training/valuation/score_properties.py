import math
import sys
from datetime import datetime
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sqlalchemy import text

PIPELINE_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PIPELINE_ROOT))

from load_db import get_engine

MODEL_PATH = Path(__file__).resolve().parent / "models" / "valuation_model.joblib"

CENTER_LAT = 10.7769
CENTER_LON = 106.7009
MAX_DISTANCE_KM = 60.0

MIN_SIGMA = 0.05
MAX_PPM2_RATIO = 2.5

MIN_DISTRICT_COUNT = 5

# Mind Score chỉ áp cho tin BÁN (category_id 1-12).
# Tin THUÊ (13-23) có thang giá triệu/tháng, mô hình không train trên đó.
MAX_SALE_CATEGORY_ID = 12


class DistrictPriceEncoder(BaseEstimator, TransformerMixin):
    def __init__(self, min_count=MIN_DISTRICT_COUNT):
        self.min_count = min_count

    def fit(self, X, y):
        district = X["district"].astype(str)
        log_ppm2 = np.asarray(y) - X["log_area"].values

        frame = pd.DataFrame({"district": district.values, "v": log_ppm2})

        counts = frame["district"].value_counts()
        keep = counts[counts >= self.min_count].index

        grouped = frame[frame["district"].isin(keep)].groupby("district")["v"]

        self.mapping_ = grouped.median().to_dict()
        self.global_ = float(np.median(log_ppm2))

        return self

    def transform(self, X):
        values = X["district"].astype(str).map(self.mapping_).fillna(self.global_)

        return values.values.reshape(-1, 1)


def haversine_km(lat1, lon1, lat2, lon2):
    r = 6371.0

    p1 = np.radians(lat1)
    p2 = np.radians(lat2)

    dp = np.radians(lat2 - lat1)
    dl = np.radians(lon2 - lon1)

    a = np.sin(dp / 2) ** 2 + np.cos(p1) * np.cos(p2) * np.sin(dl / 2) ** 2

    return 2 * r * np.arcsin(np.sqrt(a))


def infer_property_type(url):
    u = str(url or "").lower()

    if "ban-dat" in u:
        return "DAT"
    if "ban-can-ho" in u or "chung-cu" in u:
        return "CAN_HO"
    if "biet-thu" in u or "lien-ke" in u:
        return "BIET_THU"
    if "ban-nha" in u or "nha-rieng" in u or "nha-mat-pho" in u:
        return "NHA"

    return "KHAC"


def load_properties(engine):
    query = """
        SELECT p.id, p.price, p.area, p.bedrooms, p.district,
               p.latitude, p.longitude, p.url, p.category_id
        FROM property p
    """
    with engine.connect() as conn:
        df = pd.read_sql(text(query), conn)

    df["price"] = pd.to_numeric(df["price"], errors="coerce")
    df["area"] = pd.to_numeric(df["area"], errors="coerce")
    df["category_id"] = pd.to_numeric(df["category_id"], errors="coerce")

    return df


def in_valid_domain(df, filters):
    price_per_m2 = df["price"] / df["area"]

    is_sale = df["category_id"].notna() & (df["category_id"] <= MAX_SALE_CATEGORY_ID)

    return (
        is_sale
        & df["price"].notna()
        & df["area"].notna()
        & (df["price"] > 0)
        & (df["area"] > 0)
        & df["area"].between(filters["min_area"], filters["max_area"])
        & df["price"].between(filters["min_price"], filters["max_price"])
        & price_per_m2.between(
            filters["min_price_per_m2"], filters["max_price_per_m2"]
        )
    )


def confidence_mask(df):
    bedrooms = pd.to_numeric(df["bedrooms"], errors="coerce")

    lat = pd.to_numeric(df["latitude"], errors="coerce")
    lon = pd.to_numeric(df["longitude"], errors="coerce")

    distance = haversine_km(lat, lon, CENTER_LAT, CENTER_LON)

    has_bedrooms = bedrooms.notna()
    has_geo = distance.notna() & (distance <= MAX_DISTANCE_KM)

    price_per_m2 = df["price"] / df["area"]

    type_median = price_per_m2.groupby(df["property_type"]).transform("median")

    ratio = price_per_m2 / type_median

    plausible_price = ratio.between(1.0 / MAX_PPM2_RATIO, MAX_PPM2_RATIO)

    print(f"  thieu so phong ngu      : {(~has_bedrooms).sum()}")
    print(f"  toa do khong dung        : {(~has_geo).sum()}")
    print(f"  gia/m2 lech qua {MAX_PPM2_RATIO} lan : {(~plausible_price).sum()}")

    return has_bedrooms & has_geo & plausible_price


def build_features(df, artifact):
    out = pd.DataFrame(index=df.index)

    out["log_area"] = np.log(df["area"])

    bedrooms = pd.to_numeric(df["bedrooms"], errors="coerce")
    out["bedrooms"] = bedrooms.fillna(artifact["bedrooms_median"]).astype(float)

    out["area_per_bedroom"] = df["area"].values / out["bedrooms"].clip(lower=1)

    lat = pd.to_numeric(df["latitude"], errors="coerce")
    lon = pd.to_numeric(df["longitude"], errors="coerce")

    distance = haversine_km(lat, lon, CENTER_LAT, CENTER_LON)

    bad_geo = distance.isna() | (distance > MAX_DISTANCE_KM)

    out["distance_km"] = distance.mask(bad_geo, artifact["distance_median"])
    out["latitude"] = lat.mask(bad_geo, artifact["latitude_median"])
    out["longitude"] = lon.mask(bad_geo, artifact["longitude_median"])

    known = set(artifact["known_districts"])

    district = df["district"].fillna("UNKNOWN").astype(str)
    out["district"] = district.where(district.isin(known), "OTHER")

    out["property_type"] = df["url"].apply(infer_property_type)

    return out[artifact["feature_columns"]]


def normal_cdf(z):
    return 0.5 * (1.0 + math.erf(z / math.sqrt(2.0)))


def robust_sigma(values):
    q1, q3 = np.percentile(values, [25, 75])

    sigma = (q3 - q1) / 1.349

    return max(float(sigma), MIN_SIGMA)


def compute_scores(log_ratio, sigma):
    return np.array(
        [int(np.clip(round(100.0 * normal_cdf(v / sigma)), 0, 100))
         for v in log_ratio]
    )


def write_scores(engine, rows):
    statement = text("""
        UPDATE property
        SET predicted_price = :predicted_price,
            mind_score = :mind_score,
            scored_at = :scored_at
        WHERE id = :id
    """)

    with engine.begin() as conn:
        for row in rows:
            conn.execute(statement, row)


def clear_scores(engine, ids):
    if not ids:
        return

    statement = text("""
        UPDATE property
        SET predicted_price = NULL,
            mind_score = NULL,
            scored_at = NULL
        WHERE id = ANY(:ids)
    """)

    with engine.begin() as conn:
        conn.execute(statement, {"ids": ids})


def main():
    if not MODEL_PATH.exists():
        print(f"❌ Chưa có model tại {MODEL_PATH}. Chạy train_valuation_v4.py trước.")
        return

    artifact = joblib.load(MODEL_PATH)

    print(f"Model: {artifact['kind']}, "
          f"CV R2 = {artifact['cv_r2_mean']:.4f} "
          f"(+/- {artifact['cv_r2_std']:.4f}), "
          f"n = {artifact['n_samples']}")

    engine = get_engine()

    df = load_properties(engine)

    n_sale = int((df["category_id"] <= MAX_SALE_CATEGORY_ID).sum())
    n_rent = int((df["category_id"] > MAX_SALE_CATEGORY_ID).sum())

    print(f"Tổng số tin trong DB: {len(df)}")
    print(f"   tin BÁN  (category_id 1-{MAX_SALE_CATEGORY_ID}) : {n_sale}")
    print(f"   tin THUÊ (category_id >{MAX_SALE_CATEGORY_ID})  : {n_rent}  -> không chấm điểm")

    df["property_type"] = df["url"].apply(infer_property_type)

    valid_mask = in_valid_domain(df, artifact["filters"])

    df_valid = df[valid_mask].copy()

    print(f"Trong miền hợp lệ  : {len(df_valid)}")
    print(f"Ngoài miền (bỏ qua): {(~valid_mask).sum()}")

    if df_valid.empty:
        print("Không có tin nào để chấm điểm.")
        return

    print("\nKiem tra do tin cay:")

    conf_mask = confidence_mask(df_valid)

    df_score = df_valid[conf_mask].copy()

    skipped_ids = df.loc[~valid_mask, "id"].astype(int).tolist()
    skipped_ids += df_valid.loc[~conf_mask, "id"].astype(int).tolist()

    print(f"\nDu tin cay de cham diem : {len(df_score)}")
    print(f"Bo qua (tong cong)      : {len(skipped_ids)}")

    if df_score.empty:
        print("Không có tin nào đủ tin cậy để chấm điểm.")
        return

    df_valid = df_score

    X = build_features(df_valid, artifact)

    predicted_price = np.exp(artifact["model"].predict(X))

    actual_price = df_valid["price"].astype(float).values

    log_ratio = np.log(predicted_price) - np.log(actual_price)

    sigma = robust_sigma(log_ratio)

    print(f"\nSigma (do lech chuan robust cua log-ratio): {sigma:.4f}")

    scores = compute_scores(log_ratio, sigma)

    now = datetime.now()

    rows = [
        {
            "id": int(property_id),
            "predicted_price": round(float(predicted), 2),
            "mind_score": int(score),
            "scored_at": now,
        }
        for property_id, predicted, score in zip(
            df_valid["id"].astype(int), predicted_price, scores
        )
    ]

    write_scores(engine, rows)
    clear_scores(engine, skipped_ids)

    print(f"\n✅ Đã chấm điểm {len(rows)} tin.")
    print("\nPhân bố Mind Score:")
    print(pd.Series(scores).describe())

    print("\nSố tin theo khoảng điểm:")
    bins = [0, 20, 40, 60, 80, 100]
    labels = ["0-19", "20-39", "40-59", "60-79", "80-100"]
    print(pd.cut(pd.Series(scores), bins=bins, labels=labels,
                 include_lowest=True).value_counts().sort_index())

    ratio = predicted_price / df_valid["price"].astype(float).values

    print("\nTỷ lệ giá dự đoán / giá rao:")
    print(pd.Series(ratio).describe())


if __name__ == "__main__":
    main()