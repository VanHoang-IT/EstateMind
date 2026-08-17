import re
import sys
from pathlib import Path

from sqlalchemy import text

PIPELINE_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PIPELINE_ROOT))

from load_db import get_engine

AMENITY_KEYWORDS = {
    "POOL": ["hồ bơi", "bể bơi", "swimming pool"],
    "GYM": ["gym", "phòng tập", "fitness"],
    "PARKING": ["hầm để xe", "hầm xe", "chỗ đậu ô tô", "bãi đậu xe", "chỗ để xe"],
    "SECURITY": ["bảo vệ 24", "an ninh 24", "camera an ninh", "an ninh tuyệt đối"],
    "PARK": ["công viên nội khu", "cây xanh nội khu", "vườn nội khu"],
    "MALL": ["trung tâm thương mại", "siêu thị", "shophouse"],
    "SCHOOL": ["trường học", "trường mầm non", "trường quốc tế"],
    "BBQ": ["sân bbq", "khu bbq", "khu nướng"],
    "SPA": ["spa"],
    "PLAYGROUND": ["khu vui chơi", "sân chơi trẻ em", "khu trẻ em"],
    "ELEVATOR": ["thang máy"],
    "FURNISHED": ["full nội thất", "nội thất đầy đủ", "đầy đủ nội thất", "nội thất cao cấp"],
}

DISTANCE_PATTERN = re.compile(
    r"(cách|gần|di chuyển)[^.\n]{0,60}?\d+\s*(km|m|phút)",
    re.IGNORECASE,
)


def strip_distance_clauses(text_value: str) -> str:
    return DISTANCE_PATTERN.sub(" ", text_value)


def extract_amenities(description: str, title: str = "") -> list:
    if not description and not title:
        return []

    blob = f"{title} {description}".lower()
    blob = strip_distance_clauses(blob)

    found = []

    for code, keywords in AMENITY_KEYWORDS.items():
        if any(keyword in blob for keyword in keywords):
            found.append(code)

    return found


def load_rows(engine):
    query = "SELECT id, title, description FROM property"

    with engine.connect() as conn:
        return conn.execute(text(query)).mappings().all()


def write_amenities(engine, updates):
    statement = text("""
        UPDATE property
        SET amenities = :amenities
        WHERE id = :id
    """)

    with engine.begin() as conn:
        for row in updates:
            conn.execute(statement, row)


def main():
    engine = get_engine()

    rows = load_rows(engine)

    print(f"Đang xử lý {len(rows)} tin đăng...")

    updates = []
    counter = {}

    for row in rows:
        codes = extract_amenities(row["description"] or "", row["title"] or "")

        for code in codes:
            counter[code] = counter.get(code, 0) + 1

        updates.append({
            "id": row["id"],
            "amenities": ",".join(codes) if codes else None,
        })

    write_amenities(engine, updates)

    with_amenities = sum(1 for u in updates if u["amenities"])

    print(f"\n✅ Đã cập nhật {len(updates)} tin.")
    print(f"Có ít nhất 1 tiện ích: {with_amenities} "
          f"({with_amenities / len(updates) * 100:.1f}%)")

    print("\nTần suất từng tiện ích:")

    for code, count in sorted(counter.items(), key=lambda x: -x[1]):
        print(f"  {code:12s} {count:4d}  ({count / len(updates) * 100:.1f}%)")


if __name__ == "__main__":
    main()