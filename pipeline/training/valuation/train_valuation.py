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
from sklearn.model_selection import (
    KFold,
    RandomizedSearchCV,
    cross_val_predict,
    cross_val_score,
    train_test_split,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

try:
    from xgboost import XGBRegressor
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

try:
    from lightgbm import LGBMRegressor
    HAS_LGBM = True
except ImportError:
    HAS_LGBM = False

try:
    from catboost import CatBoostRegressor
    HAS_CATBOOST = True
except ImportError:
    HAS_CATBOOST = False

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
MAX_SALE_CATEGORY_ID = 12
MIN_SIGMA = 0.05
RANDOM_STATE = 42
N_SPLITS = 5
N_ITER_SEARCH = 25


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
    query = f"""
        SELECT p.id, p.price, p.area, p.bedrooms, p.district,
               p.latitude, p.longitude, p.url, p.category_id
        FROM property p
        WHERE p.price IS NOT NULL
          AND p.price > 0
          AND p.area IS NOT NULL
          AND p.area > 0
          AND p.category_id IS NOT NULL
          AND p.category_id <= {MAX_SALE_CATEGORY_ID}
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


def available_model_kinds():
    kinds = ["ridge", "rf", "gbr"]
    if HAS_XGB:
        kinds.append("xgb")
    if HAS_LGBM:
        kinds.append("lgbm")
    if HAS_CATBOOST:
        kinds.append("catboost")
    return kinds


def build_estimator(kind, params=None):
    params = params or {}

    if kind == "ridge":
        return Ridge(alpha=params.get("alpha", 1.0))

    if kind == "rf":
        return RandomForestRegressor(
            n_estimators=params.get("n_estimators", 400),
            max_depth=params.get("max_depth", 10),
            min_samples_leaf=params.get("min_samples_leaf", 3),
            random_state=RANDOM_STATE,
            n_jobs=-1,
        )

    if kind == "gbr":
        return GradientBoostingRegressor(
            n_estimators=params.get("n_estimators", 300),
            learning_rate=params.get("learning_rate", 0.05),
            max_depth=params.get("max_depth", 3),
            random_state=RANDOM_STATE,
        )

    if kind == "xgb":
        return XGBRegressor(
            n_estimators=params.get("n_estimators", 300),
            max_depth=params.get("max_depth", 6),
            learning_rate=params.get("learning_rate", 0.05),
            subsample=params.get("subsample", 0.8),
            colsample_bytree=params.get("colsample_bytree", 0.8),
            random_state=RANDOM_STATE,
            n_jobs=-1,
        )

    if kind == "lgbm":
        return LGBMRegressor(
            n_estimators=params.get("n_estimators", 300),
            max_depth=params.get("max_depth", 6),
            learning_rate=params.get("learning_rate", 0.05),
            subsample=params.get("subsample", 0.8),
            colsample_bytree=params.get("colsample_bytree", 0.8),
            random_state=RANDOM_STATE,
            verbose=-1,
        )

    return CatBoostRegressor(
        iterations=params.get("iterations", 300),
        depth=params.get("depth", 6),
        learning_rate=params.get("learning_rate", 0.05),
        random_state=RANDOM_STATE,
        verbose=0,
        thread_count=1,
        allow_writing_files=False,
    )


def build_preprocessor(kind):
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

    num_transform = StandardScaler() if kind == "ridge" else "passthrough"

    return ColumnTransformer(
        transformers=[
            ("num", num_transform, numeric),
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical),
            ("dist", DistrictPriceEncoder(), encoder_cols),
        ]
    )


def build_model(kind, params=None):
    return Pipeline(
        [
            ("prep", build_preprocessor(kind)),
            ("model", build_estimator(kind, params)),
        ]
    )


PARAM_DISTRIBUTIONS = {
    "ridge": {"model__alpha": [0.1, 0.3, 1.0, 3.0, 10.0, 30.0]},
    "rf": {
        "model__n_estimators": [200, 300, 400, 600],
        "model__max_depth": [6, 8, 10, 15, None],
        "model__min_samples_leaf": [1, 2, 3, 5],
    },
    "gbr": {
        "model__n_estimators": [200, 300, 400],
        "model__learning_rate": [0.01, 0.03, 0.05, 0.1],
        "model__max_depth": [2, 3, 4],
    },
    "xgb": {
        "model__n_estimators": [200, 300, 400],
        "model__max_depth": [4, 6, 8],
        "model__learning_rate": [0.01, 0.05, 0.1],
        "model__subsample": [0.7, 0.8, 1.0],
    },
    "lgbm": {
        "model__n_estimators": [200, 300, 400],
        "model__max_depth": [4, 6, 8],
        "model__learning_rate": [0.01, 0.05, 0.1],
        "model__subsample": [0.7, 0.8, 1.0],
    },
    "catboost": {
        "model__iterations": [200, 300, 400],
        "model__depth": [4, 6, 8],
        "model__learning_rate": [0.01, 0.05, 0.1],
    },
}


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


def select_model_kind_by_cv(X_train, y_train):
    kf = KFold(n_splits=N_SPLITS, shuffle=True, random_state=RANDOM_STATE)

    print("=" * 60)
    print("CHON LOAI MO HINH BANG CROSS-VALIDATION (chi tren train)")
    print("=" * 60)

    cv_results = {}

    for kind in available_model_kinds():
        scores = cross_val_score(
            build_model(kind), X_train, y_train, cv=kf, scoring="r2", n_jobs=-1
        )
        cv_results[kind] = (scores.mean(), scores.std())
        print(f"  {kind:10s}: CV R2 = {scores.mean():.4f} (+/- {scores.std():.4f})")

    best_kind = max(cv_results, key=lambda k: cv_results[k][0])
    best_cv_mean, best_cv_std = cv_results[best_kind]

    print(f"\nLoai mo hinh tot nhat theo CV: {best_kind} (R2 = {best_cv_mean:.4f})")

    return best_kind, best_cv_mean, best_cv_std


def tune_hyperparameters(kind, X_train, y_train):
    grid = PARAM_DISTRIBUTIONS.get(kind)

    if not grid:
        return build_model(kind).fit(X_train, y_train), {}

    print(f"\nTuning sieu tham so cho {kind} (RandomizedSearchCV, {N_ITER_SEARCH} to hop)...")

    kf = KFold(n_splits=N_SPLITS, shuffle=True, random_state=RANDOM_STATE)

    search = RandomizedSearchCV(
        estimator=build_model(kind),
        param_distributions=grid,
        n_iter=min(N_ITER_SEARCH, _grid_size(grid)),
        cv=kf,
        scoring="r2",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    search.fit(X_train, y_train)

    print(f"  Tham so tot nhat: {search.best_params_}")
    print(f"  CV R2 sau tuning: {search.best_score_:.4f}")

    return search.best_estimator_, search.best_params_


def _grid_size(grid):
    size = 1
    for values in grid.values():
        size *= len(values)
    return size


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
    print(f"BASELINE (train={len(X_train)}, test={len(X_test)})")
    print("=" * 60)

    ppm = (df_train["price"] / df_train["area"]).median()
    report("baseline: gia/m2 trung vi", y_test, np.log(ppm * df_test["area"].values))

    best_kind, cv_mean_selection, cv_std_selection = select_model_kind_by_cv(
        X_train, y_train
    )

    tuned_model, best_params = tune_hyperparameters(best_kind, X_train, y_train)

    print("=" * 60)
    print(f"DANH GIA MO HINH DA CHON TREN TAP TEST (mot lan duy nhat): {best_kind}")
    print("=" * 60)

    test_r2 = report(f"{best_kind} (test, sau tuning)", y_test, tuned_model.predict(X_test))

    gap = cv_mean_selection - test_r2

    print(f"\nChenh lech CV R2 luc chon model ({cv_mean_selection:.4f}) vs Test R2 ({test_r2:.4f}): {gap:.4f}")
    if abs(gap) > 0.05:
        print("  Canh bao: chenh lech > 0.05, co the mo hinh dang overfit hoac tap test qua nho/khac phan phoi.")
    else:
        print("  Chenh lech nho, mo hinh on dinh giua CV va test.")

    final_params = {
        k.replace("model__", ""): v for k, v in best_params.items()
    } if best_params else None

    best_model = build_model(best_kind, final_params)
    best_model.fit(X, y)

    kf = KFold(n_splits=N_SPLITS, shuffle=True, random_state=RANDOM_STATE)

    oof_pred = cross_val_predict(
        build_model(best_kind, final_params), X, y, cv=kf, n_jobs=-1
    )

    oof_resid = oof_pred - y

    q1, q3 = np.percentile(oof_resid, [25, 75])
    sigma_oof = max(float((q3 - q1) / 1.349), MIN_SIGMA)

    oof_price = np.exp(oof_pred)
    true_price_full = np.exp(y)

    oof_mape = np.mean(np.abs(oof_price - true_price_full) / true_price_full) * 100
    oof_within_20 = (
        np.mean(np.abs(oof_price - true_price_full) / true_price_full <= 0.20) * 100
    )

    print(f"\nOut-of-fold tren toan bo du lieu (dung cho Mind Score):")
    print(f"  Sigma              : {sigma_oof:.4f}")
    print(f"  MAPE (%)           : {oof_mape:.2f}")
    print(f"  Sai lech <= 20% (%): {oof_within_20:.1f}")

    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    artifact = {
        "model": best_model,
        "kind": best_kind,
        "best_params": final_params,
        "feature_columns": list(X.columns),
        "known_districts": sorted(set(X["district"])),
        "bedrooms_median": float(X["bedrooms"].median()),
        "distance_median": float(X["distance_km"].median()),
        "latitude_median": float(X["latitude"].median()),
        "longitude_median": float(X["longitude"].median()),
        "min_district_count": MIN_DISTRICT_COUNT,
        "center": {"lat": CENTER_LAT, "lon": CENTER_LON},
        "cv_r2_mean_selection": float(cv_mean_selection),
        "cv_r2_std_selection": float(cv_std_selection),
        "test_r2": float(test_r2),
        "cv_test_gap": float(gap),
        "n_samples": int(len(X)),
        "scope": "BAN",
        "max_sale_category_id": MAX_SALE_CATEGORY_ID,
        "sigma_oof": sigma_oof,
        "oof_mape": float(oof_mape),
        "oof_within_20": float(oof_within_20),
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