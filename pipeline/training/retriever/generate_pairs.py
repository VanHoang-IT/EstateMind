import argparse
import json
import os
import random
from decimal import Decimal
from sqlalchemy import text

from load_db import get_engine

DISTRICT_QUERY_TEMPLATES = [
    "căn hộ {bedrooms} phòng ngủ ở {district}",
    "tìm nhà {district} khoảng {price_text}",
    "mua căn hộ {bedrooms}pn tại {district} giá {price_text}",
    "bán căn hộ diện tích {area}m2 ở {district}",
    "nhà {district} {bedrooms} phòng ngủ diện tích {area}m2",
    "căn hộ giá {price_text} khu vực {district}",
]


def format_price(price_vnd):
    if price_vnd is None:
        return "thương lượng"
    ty = price_vnd / 1_000_000_000
    return f"{ty:.1f} tỷ".replace(".0 tỷ", " tỷ")


def build_listing_text(row):
    return (
        f"Tiêu đề: {row['title']}\n"
        f"Địa chỉ: {row['address']}, {row['district']}\n"
        f"Giá: {row['price']} VNĐ\n"
        f"Diện tích: {row['area']} m2\n"
        f"Số phòng ngủ: {row['bedrooms']}\n"
        f"Mô tả: {str(row['description'])[:300]}"
    )


def build_synthetic_query(row):
    template = random.choice(DISTRICT_QUERY_TEMPLATES)
    return template.format(
        district=row["district"] or "TPHCM",
        bedrooms=row["bedrooms"] or "2",
        area=int(row["area"]) if row["area"] else "70",
        price_text=format_price(row["price"]),
    )


def fetch_properties(engine, limit=None):
    query = """
        SELECT id, title, description, address, district, price, area, bedrooms
        FROM property
        WHERE status = 'AVAILABLE'
          AND price IS NOT NULL AND area IS NOT NULL AND district IS NOT NULL
    """
    if limit:
        query += f" LIMIT {int(limit)}"
    with engine.connect() as conn:
        rows = conn.execute(text(query)).mappings().all()
    return [dict(row) for row in rows]


def pick_hard_negative(row, all_rows):
    same_district = [
        r
        for r in all_rows
        if r["district"] == row["district"]
        and r["id"] != row["id"]
    ]

    if same_district:
        candidates = [
            r
            for r in same_district
            if r["price"] is not None
            and row["price"] is not None
            and abs(r["price"] - row["price"])
            > row["price"] * Decimal("0.3")
        ]

        if candidates:
            return random.choice(candidates)

        return random.choice(same_district)

    others = [
        r
        for r in all_rows
        if r["id"] != row["id"]
    ]

    return random.choice(others) if others else None


def build_pairs(rows, queries_per_listing=2):
    pairs = []
    for row in rows:
        for _ in range(queries_per_listing):
            query = build_synthetic_query(row)
            positive = build_listing_text(row)
            negative_row = pick_hard_negative(row, rows)
            pair = {"query": query, "positive": positive}
            if negative_row:
                pair["hard_negative"] = build_listing_text(negative_row)
            pairs.append(pair)
    return pairs


def split_pairs(pairs, train_ratio=0.8, val_ratio=0.1, seed=42):
    shuffled = list(pairs)
    random.Random(seed).shuffle(shuffled)
    n = len(shuffled)
    n_train = int(n * train_ratio)
    n_val = int(n * val_ratio)
    return shuffled[:n_train], shuffled[n_train:n_train + n_val], shuffled[n_train + n_val:]


def write_jsonl(pairs, path):
    with open(path, "w", encoding="utf-8") as f:
        for pair in pairs:
            f.write(json.dumps(pair, ensure_ascii=False) + "\n")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output_dir", default="training/retriever/data")
    parser.add_argument("--queries_per_listing", type=int, default=2)
    parser.add_argument("--limit", type=int, default=None)
    args = parser.parse_args()

    engine = get_engine()
    rows = fetch_properties(engine, limit=args.limit)
    print(f"Đã lấy {len(rows)} property từ Postgres.")

    if len(rows) < 10:
        print("⚠️ Quá ít property (cần tối thiểu vài chục để train có ý nghĩa) — kiểm tra lại DB.")
        return

    pairs = build_pairs(rows, queries_per_listing=args.queries_per_listing)
    print(f"Đã sinh {len(pairs)} cặp (query, positive[, hard_negative]).")

    train_pairs, val_pairs, test_pairs = split_pairs(pairs)

    os.makedirs(args.output_dir, exist_ok=True)
    write_jsonl(train_pairs, os.path.join(args.output_dir, "train.jsonl"))
    write_jsonl(val_pairs, os.path.join(args.output_dir, "val.jsonl"))
    write_jsonl(test_pairs, os.path.join(args.output_dir, "test.jsonl"))

    print(f"Train: {len(train_pairs)} | Val: {len(val_pairs)} | Test: {len(test_pairs)}")
    print("Đây là cặp SINH TỰ ĐỘNG bằng template — nên xem qua 1 lượt trước khi train, "
          "sửa lại template trong DISTRICT_QUERY_TEMPLATES nếu câu nghe không tự nhiên.")


if __name__ == "__main__":
    main()