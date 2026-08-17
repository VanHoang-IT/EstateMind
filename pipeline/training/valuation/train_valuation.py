import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sqlalchemy import text

PIPELINE_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PIPELINE_ROOT))

from load_db import get_engine

import joblib
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import KFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

MODEL_DIR = Path(__file__).resolve().parent / "models"

MIN_AREA = 20.0
MAX_AREA = 500.0
MIN_PRICE = 500_000_000
MAX_PRICE = 100_000_000_000
MIN_PRICE_PER_M2 = 15_000_000
MAX_PRICE_PER_M2 = 500_000_000

CENTER_LAT = 10.7769
CENTER_LON = 106.7009

MAX_DISTANCE_KM = 60.0

MIN_DISTRICT_COUNT = 5
RANDOM_STATE = 42


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


def load_dataset():
    query = """
        SELECT p.id, p.price, p.area, p.bedrooms, p.district,
               p.latitude, p.longitude, p.url
        FROM property p
        WHERE p.price IS NOT NULL
          AND p.price > 0
          AND p.area IS NOT NULL
          AND p.area > 0
    """
    engine = get_engine()

    with engine.connect() as conn:
        df = pd.read_sql(text(query), conn)

    df["price"] = df["price"].astype(float)
    df["area"] = df["area"].astype(float)

    return df


def apply_domain_filter(df):
    before = len(df)

    price_per_m2 = df["price"] / df["area"]

    mask = (
        df["area"].between(MIN_AREA, MAX_AREA)
        & df["price"].between(MIN_PRICE, MAX_PRICE)
        & price_per_m2.between(MIN_PRICE_PER_M2, MAX_PRICE_PER_M2)
    )

    kept = df[mask].copy()

    print(f"Loc nghiep vu: {before} -> {len(kept)} (loai {before - len(kept)})")

    return kept


def describe_extra(df):
    print("=" * 60)
    print("DAC TRUNG MOI")
    print("=" * 60)

    print("\nLoai hinh (suy ra tu URL):")
    print(df["property_type"].value_counts())

    print("\nToa do thieu:")
    print(f"  latitude null : {df['latitude'].isna().sum()}")
    print(f"  longitude null: {df['longitude'].isna().sum()}")

    print("\nKhoang cach toi trung tam (km):")
    print(df["distance_km"].describe())

    print("\nGia/m2 trung vi theo loai hinh (trieu):")
    ppm2 = df["price"] / df["area"] / 1_000_000
    print(ppm2.groupby(df["property_type"]).median())
    print()


def build_features(df):
    out = pd.DataFrame(index=df.index)

    out["log_area"] = np.log(df["area"])

    bedrooms = pd.to_numeric(df["bedrooms"], errors="coerce")
    out["bedrooms"] = bedrooms.fillna(bedrooms.median()).astype(float)

    out["area_per_bedroom"] = df["area"].values / out["bedrooms"].clip(lower=1)

    out["distance_km"] = df["distance_km"].fillna(df["distance_km"].median())

    lat = pd.to_numeric(df["latitude"], errors="coerce")
    lon = pd.to_numeric(df["longitude"], errors="coerce")

    out["latitude"] = lat.fillna(lat.median())
    out["longitude"] = lon.fillna(lon.median())

    district = df["district"].fillna("UNKNOWN").astype(str)
    counts = district.value_counts()
    keep = set(counts[counts >= MIN_DISTRICT_COUNT].index)

    out["district"] = district.where(district.isin(keep), "OTHER")

    out["property_type"] = df["property_type"].values

    return out


def build_model(kind):
    numeric = [
        "log_area",
        "bedrooms",
        "area_per_bedroom",
        "distance_km",
        "latitude",
        "longitude",
    ]
    categorical = ["district", "property_type"]
    encoder_cols = ["district", "log_area"]

    if kind == "ridge":
        preprocessor = ColumnTransformer(
            transformers=[
                ("num", StandardScaler(), numeric),
                ("cat", OneHotEncoder(handle_unknown="ignore"), categorical),
                ("dist", DistrictPriceEncoder(), encoder_cols),
            ]
        )
        estimator = Ridge(alpha=1.0)

    elif kind == "rf":
        preprocessor = ColumnTransformer(
            transformers=[
                ("num", "passthrough", numeric),
                ("cat", OneHotEncoder(handle_unknown="ignore"), categorical),
                ("dist", DistrictPriceEncoder(), encoder_cols),
            ]
        )
        estimator = RandomForestRegressor(
            n_estimators=400,
            max_depth=10,
            min_samples_leaf=3,
            random_state=RANDOM_STATE,
            n_jobs=-1,
        )

    else:
        preprocessor = ColumnTransformer(
            transformers=[
                ("num", "passthrough", numeric),
                ("cat", OneHotEncoder(handle_unknown="ignore"), categorical),
                ("dist", DistrictPriceEncoder(), encoder_cols),
            ]
        )
        estimator = GradientBoostingRegressor(
            n_estimators=300,
            learning_rate=0.05,
            max_depth=3,
            random_state=RANDOM_STATE,
        )

    return Pipeline([("prep", preprocessor), ("model", estimator)])


def report(name, y_true_log, pred_log):
    r2_log = r2_score(y_true_log, pred_log)

    pred_price = np.exp(pred_log)
    true_price = np.exp(y_true_log)

    mae_ty = mean_absolute_error(true_price, pred_price) / 1_000_000_000
    mape = np.mean(np.abs(pred_price - true_price) / true_price) * 100
    within_20 = np.mean(np.abs(pred_price - true_price) / true_price <= 0.20) * 100

    print(f"\n[{name}]")
    print(f"  R2 (log price)     : {r2_log:.4f}")
    print(f"  MAE (ty VND)       : {mae_ty:.3f}")
    print(f"  MAPE (%)           : {mape:.2f}")
    print(f"  Sai lech <= 20% (%): {within_20:.1f}")

    return r2_log


def main():
    df = load_dataset()

    df["property_type"] = df["url"].apply(infer_property_type)

    df["distance_km"] = haversine_km(
        pd.to_numeric(df["latitude"], errors="coerce"),
        pd.to_numeric(df["longitude"], errors="coerce"),
        CENTER_LAT,
        CENTER_LON,
    )

    bad_geo = df["distance_km"] > MAX_DISTANCE_KM

    print(f"Toa do vo ly (> {MAX_DISTANCE_KM} km): {bad_geo.sum()}")

    df.loc[bad_geo, ["latitude", "longitude", "distance_km"]] = np.nan

    df = apply_domain_filter(df)

    describe_extra(df)

    X = build_features(df)
    y = np.log(df["price"].values)

    X_train, X_test, y_train, y_test, df_train, df_test = train_test_split(
        X, y, df, test_size=0.2, random_state=RANDOM_STATE
    )

    print("=" * 60)
    print(f"KET QUA (train={len(X_train)}, test={len(X_test)})")
    print("=" * 60)

    ppm = (df_train["price"] / df_train["area"]).median()

    report("baseline: gia/m2 trung vi", y_test, np.log(ppm * df_test["area"].values))

    results = {}

    for kind in ("ridge", "rf", "gbr"):
        model = build_model(kind)
        model.fit(X_train, y_train)

        results[kind] = report(kind, y_test, model.predict(X_test))

    best_kind = max(results, key=results.get)

    print(f"\nMo hinh tot nhat: {best_kind}")

    print("\nCross-validation 5-fold:")

    cv_scores = cross_val_score(
        build_model(best_kind),
        X,
        y,
        cv=KFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE),
        scoring="r2",
    )

    print(f"  R2 tung fold : {np.round(cv_scores, 4)}")
    print(f"  R2 trung binh: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

    best_model = build_model(best_kind)
    best_model.fit(X, y)

    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    artifact = {
        "model": best_model,
        "kind": best_kind,
        "feature_columns": list(X.columns),
        "known_districts": sorted(set(X["district"])),
        "bedrooms_median": float(X["bedrooms"].median()),
        "distance_median": float(X["distance_km"].median()),
        "latitude_median": float(X["latitude"].median()),
        "longitude_median": float(X["longitude"].median()),
        "min_district_count": MIN_DISTRICT_COUNT,
        "center": {"lat": CENTER_LAT, "lon": CENTER_LON},
        "cv_r2_mean": float(cv_scores.mean()),
        "cv_r2_std": float(cv_scores.std()),
        "n_samples": int(len(X)),
        "filters": {
            "min_area": MIN_AREA,
            "max_area": MAX_AREA,
            "min_price": MIN_PRICE,
            "max_price": MAX_PRICE,
            "min_price_per_m2": MIN_PRICE_PER_M2,
            "max_price_per_m2": MAX_PRICE_PER_M2,
        },
    }

    output_path = MODEL_DIR / "valuation_model.joblib"

    joblib.dump(artifact, output_path)

    print(f"\nDa luu model: {output_path}")


if __name__ == "__main__":
    main()