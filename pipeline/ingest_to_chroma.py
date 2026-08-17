
import argparse
import hashlib
import logging
import os
import time
from dotenv import load_dotenv
from sqlalchemy import text
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma  import Chroma
from langchain_core.documents import Document

from config import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD  # dùng lại config có sẵn
from load_db import get_engine

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ingest_to_chroma")

PERSIST_DIR = "./chroma_db"   # không dùng trực tiếp nữa, Docker mount vào /data để tái sử dụng dữ liệu cũ
CHROMA_HOST = os.getenv("CHROMA_HOST", "localhost")
CHROMA_PORT = int(os.getenv("CHROMA_PORT", "8000"))
COLLECTION_PROPERTY = "real-estate-listings"
COLLECTION_LEGAL = "legal-documents"

# category_id 1-12 = nhà đất BÁN, 13-23 = nhà đất CHO THUÊ.
# Giá tin thuê là triệu/tháng, khác thang hoàn toàn với giá bán.
MAX_SALE_CATEGORY_ID = 12

# Chủ động giảm tốc để hạn chế chạm rate limit. Có thể chỉnh bằng biến môi trường.
REQUEST_DELAY_SECONDS = float(os.getenv("EMBED_REQUEST_DELAY_SECONDS", "2.0"))

# Khi đã chạm 429 liên tục, không retry 10 phút rồi crash.
# Thử tối đa 3 lần với backoff tăng dần; nếu vẫn 429 thì dừng an toàn.
RATE_LIMIT_BACKOFF_SECONDS = (60, 120)
MAX_ATTEMPTS_429 = len(RATE_LIMIT_BACKOFF_SECONDS) + 1

_embeddings = None


class RateLimitPause(RuntimeError):
    """Báo hiệu quota/rate limit chưa hồi; caller sẽ checkpoint và dừng an toàn."""



def get_embeddings():
    global _embeddings
    if _embeddings is None:
        # output_dimensionality set tường minh (768) để nhẹ và ổn định,
        # tránh phụ thuộc default của Google có thể đổi trong tương lai.
        # Nếu đổi số này SAU KHI đã có dữ liệu trong Chroma, phải xoá
        # persist_dir và embed lại toàn bộ (--force), vì Chroma không
        # cho phép trộn vector khác số chiều trong cùng 1 collection.
        _embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            output_dimensionality=768,
        )
    return _embeddings


def get_vectorstore(collection_name: str) -> Chroma:
    # Đang ở chế độ TEST LOCAL (embedded, persist_directory) — khớp với
    # cách query_chroma.py đang đọc. Khi nào sẵn sàng làm RAG Chat API
    # bằng Spring Boot, sẽ cần đổi sang Docker server (host/port) để
    # Java đọc chung được — xem lại hướng dẫn Docker ở bước trước.
    return Chroma(
        collection_name=collection_name,
        embedding_function=get_embeddings(),
        persist_directory=PERSIST_DIR,
    )


def content_hash(text_value: str) -> str:
    return hashlib.sha256((text_value or "").encode("utf-8")).hexdigest()


def add_documents_with_retry(vectorstore: Chroma, documents: list, ids: list, label: str):
    """
    Gọi vectorstore.add_documents() với retry có backoff khi gặp 429.

    Nếu quota vẫn chưa hồi sau số lần thử cho phép, raise RateLimitPause để
    vòng sync dừng có kiểm soát. Các bản ghi đã sync trước đó vẫn giữ nguyên
    trong vector_sync_status nên lần chạy sau sẽ tự được bỏ qua.
    """
    for attempt in range(1, MAX_ATTEMPTS_429 + 1):
        try:
            vectorstore.add_documents(documents=documents, ids=ids)
            return
        except Exception as e:
            error_msg = str(e)
            is_rate_limit = "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg

            if not is_rate_limit:
                raise  # lỗi khác 429 -> raise luôn

            if attempt >= MAX_ATTEMPTS_429:
                raise RateLimitPause(
                    f"Gemini vẫn trả 429 sau {MAX_ATTEMPTS_429} lần thử ở {label}."
                ) from e

            wait_seconds = RATE_LIMIT_BACKOFF_SECONDS[attempt - 1]
            logger.warning(
                f"  ⚠️ Quá giới hạn API (429) ở {label} "
                f"(lần thử {attempt}/{MAX_ATTEMPTS_429}). "
                f"Nghỉ {wait_seconds}s rồi thử lại..."
            )
            time.sleep(wait_seconds)


# ============================================================
# ĐỌC DỮ LIỆU CẦN EMBED (chưa sync hoặc content_hash đã đổi)
# ============================================================

def fetch_pending_properties(engine, force: bool = False):
    query = """
        SELECT p.id, p.title, p.description, p.address, p.district,
               p.price, p.area, p.bedrooms, p.status, p.legal_verified,
               p.category_id, p.attributes,
               p.latitude, p.longitude, p.url, p.url_crawl,
               p.created_at, p.crawl_date,
               vs.content_hash AS synced_hash
        FROM property p
        LEFT JOIN vector_sync_status vs
               ON vs.source_table = 'property' AND vs.source_id = p.id
        WHERE p.status = 'AVAILABLE'
    """
    with engine.connect() as conn:
        rows = conn.execute(text(query)).mappings().all()

    pending = []
    for row in rows:
        # category_id nằm trong hash: đổi loại hình -> nội dung embed đổi
        # (bán/thuê hiển thị khác nhau) nên phải embed lại.
        raw = (
            f"{row['title']}|{row['description']}|{row['price']}|"
            f"{row['area']}|{row['district']}|{row['category_id']}|"
            f"{row['created_at']}|{row['crawl_date']}"
        )
        current_hash = content_hash(raw)
        if force or row["synced_hash"] != current_hash:
            pending.append({**row, "content_hash": current_hash})
    return pending


def fetch_pending_legal_docs(engine, force: bool = False):
    query = """
        SELECT l.id, l.title, l.source, l.article_number, l.content, l.effective_date,
               vs.content_hash AS synced_hash
        FROM legal_knowledge_base l
        LEFT JOIN vector_sync_status vs
               ON vs.source_table = 'legal_knowledge_base' AND vs.source_id = l.id
    """
    with engine.connect() as conn:
        rows = conn.execute(text(query)).mappings().all()

    pending = []
    for row in rows:
        current_hash = content_hash(row["content"])
        if force or row["synced_hash"] != current_hash:
            pending.append({**row, "content_hash": current_hash})
    return pending


# ============================================================
# CHUNK + BUILD DOCUMENT
# ============================================================

_splitter = RecursiveCharacterTextSplitter(chunk_size=700, chunk_overlap=50)


def _fmt_date(value, with_time: bool = False) -> str:
    if not value:
        return "không rõ"
    fmt = "%d/%m/%Y %H:%M" if with_time else "%d/%m/%Y"
    try:
        return value.strftime(fmt)
    except AttributeError:
        return str(value)


def _fmt_price(price, is_rent: bool) -> str:
    """
    Diễn giải giá bằng tiếng Việt tự nhiên để LLM đọc đúng ngữ nghĩa,
    thay vì con số thô kiểu 'Giá: 15000000 VNĐ'.
    """
    if price is None:
        return "Giá: Thỏa thuận (liên hệ người đăng)"

    value = float(price)

    if is_rent:
        trieu = value / 1_000_000
        return f"Giá thuê: {trieu:,.1f} triệu VNĐ/tháng"

    if value >= 1_000_000_000:
        ty = value / 1_000_000_000
        return f"Giá bán: {ty:,.2f} tỷ VNĐ"

    trieu = value / 1_000_000
    return f"Giá bán: {trieu:,.0f} triệu VNĐ"


def _fmt_attributes(raw) -> str:
    """Đặc điểm bất động sản (JSON) -> dòng text cho LLM đọc."""
    if not raw:
        return ""

    import json

    try:
        parsed = json.loads(raw)
    except (ValueError, TypeError):
        return ""

    if not isinstance(parsed, dict):
        return ""

    skip = {"Khoảng giá", "Mức giá", "Giá", "Diện tích", "Số phòng ngủ"}

    parts = [
        f"{key}: {value}"
        for key, value in parsed.items()
        if key not in skip and value
    ]

    return "; ".join(parts)


def build_property_documents(row: dict) -> list[Document]:
    posted_date = _fmt_date(row.get("created_at"))
    crawled_date = _fmt_date(row.get("crawl_date"), with_time=True)
    source_site = row.get("url_crawl") or "Người dùng đăng trực tiếp trên EstateMind"

    if row.get("url_crawl"):
        source_line = f"Nguồn dữ liệu: {source_site} (thu thập lúc {crawled_date})"
    else:
        source_line = f"Nguồn dữ liệu: {source_site}"

    category_id = row.get("category_id") or 0
    is_rent = category_id > MAX_SALE_CATEGORY_ID

    listing_label = "Cho thuê" if is_rent else "Bán"
    price_line = _fmt_price(row.get("price"), is_rent)
    specs_line = _fmt_attributes(row.get("attributes"))

    lines = [
        f"Hình thức: {listing_label}",
        f"Tiêu đề: {row['title']}",
        f"Địa chỉ: {row['address']}, {row['district']}",
        price_line,
        f"Diện tích: {row['area']} m2",
        f"Số phòng ngủ: {row['bedrooms']}",
    ]

    if specs_line:
        lines.append(f"Đặc điểm: {specs_line}")

    lines.extend([
        f"Ngày đăng tin: {posted_date}",
        source_line,
        f"Mô tả: {row['description']}",
    ])

    text_content = "\n".join(lines)

    metadata = {
        "property_id": row["id"],
        # price = None cho tin Thỏa thuận: Chroma bỏ qua khoá null nên tin
        # này không lọt vào bộ lọc khoảng giá (trước đây gán 0.0 -> khớp nhầm).
        "price": float(row["price"]) if row["price"] is not None else None,
        "area": float(row["area"]) if row["area"] is not None else 0.0,
        "district": row["district"] or "",
        "bedrooms": row["bedrooms"] or 0,
        "category_id": category_id,
        "listing_type": "THUE" if is_rent else "BAN",
        "legal_verified": bool(row["legal_verified"]),
        "url": row["url"] or "",
        "source_site": source_site,
        "posted_date": posted_date,
        "crawled_date": crawled_date,
    }

    # Chroma không nhận giá trị None trong metadata -> loại bỏ khoá null.
    metadata = {k: v for k, v in metadata.items() if v is not None}

    chunks = _splitter.split_text(text_content)
    return [
        Document(page_content=chunk, metadata={**metadata, "chunk_index": i})
        for i, chunk in enumerate(chunks)
    ]


def build_legal_documents(row: dict) -> list[Document]:
    effective_date = _fmt_date(row.get("effective_date"))

    text_content = (
        f"{row['title']} ({row['article_number']})\n"
        f"Nguồn: {row['source']}\n"
        f"Ngày hiệu lực: {effective_date}\n\n"
        f"{row['content']}"
    )
    metadata = {
        "legal_document_id": row["id"],
        "source": row["source"] or "",
        "article_number": row["article_number"] or "",
        "effective_date": effective_date,
    }
    chunks = _splitter.split_text(text_content)
    return [
        Document(page_content=chunk, metadata={**metadata, "chunk_index": i})
        for i, chunk in enumerate(chunks)
    ]


# ============================================================
# EMBED + LƯU VÀO CHROMA + CẬP NHẬT vector_sync_status
# ============================================================

def upsert_vector_sync_status(engine, source_table: str, source_id: int, vector_id: str, hash_value: str):
    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO vector_sync_status (source_table, source_id, vector_id, content_hash, synced_at)
                VALUES (:source_table, :source_id, :vector_id, :content_hash, CURRENT_TIMESTAMP)
                ON CONFLICT (source_table, source_id) DO UPDATE SET
                    vector_id = EXCLUDED.vector_id,
                    content_hash = EXCLUDED.content_hash,
                    synced_at = CURRENT_TIMESTAMP
            """),
            {
                "source_table": source_table,
                "source_id": source_id,
                "vector_id": vector_id,
                "content_hash": hash_value,
            },
        )


def sync_properties(engine, force: bool = False) -> bool:
    pending = fetch_pending_properties(engine, force=force)
    if not pending:
        logger.info("Không có property nào cần embed (đã đồng bộ đầy đủ).")
        return True

    rent_count = sum(
        1 for r in pending if (r.get("category_id") or 0) > MAX_SALE_CATEGORY_ID
    )
    total_pending = len(pending)
    completed = 0

    logger.info(
        f"Cần embed {total_pending} property "
        f"({total_pending - rent_count} bán / {rent_count} cho thuê)..."
    )
    logger.info(
        "Resume đang bật: property có content_hash khớp trong vector_sync_status sẽ được bỏ qua."
    )
    vectorstore = get_vectorstore(COLLECTION_PROPERTY)

    for row in pending:
        property_id = row["id"]
        vector_id_prefix = f"property_{property_id}"

        try:
            vectorstore.delete(where={"property_id": property_id})
        except Exception:
            pass

        docs = build_property_documents(row)
        ids = [f"{vector_id_prefix}_chunk{i}" for i in range(len(docs))]

        try:
            add_documents_with_retry(
                vectorstore, docs, ids, label=f"property id={property_id}"
            )
        except RateLimitPause as e:
            # Đảm bảo property đang lỗi không bị xem là đã sync.
            try:
                vectorstore.delete(where={"property_id": property_id})
            except Exception:
                pass

            remaining = total_pending - completed
            logger.error(f"⏸️ {e}")
            logger.error("⏸️ DỪNG AN TOÀN DO QUOTA/RATE LIMIT — KHÔNG MẤT CHECKPOINT.")
            logger.info(f"   ✅ Đã hoàn thành trong lần chạy này : {completed}/{total_pending}")
            logger.info(f"   ⏳ Còn lại tối đa                 : {remaining} property")
            logger.info(f"   Property đang chờ               : id={property_id}")
            logger.info(
                "   Chạy lại cùng lệnh sau khi quota hồi; các property đã sync sẽ tự động SKIP."
            )
            if force:
                logger.warning(
                    "   Bạn đang dùng --force. Để RESUME phần còn thiếu, hãy chạy lại KHÔNG có --force."
                )
            return False

        upsert_vector_sync_status(
            engine, "property", property_id, vector_id_prefix, row["content_hash"]
        )
        completed += 1
        logger.info(
            f"  ✅ Embedded property id={property_id} ({len(docs)} chunks) "
            f"[{completed}/{total_pending}]"
        )

        if REQUEST_DELAY_SECONDS > 0:
            time.sleep(REQUEST_DELAY_SECONDS)

    logger.info(f"Hoàn tất embed {completed}/{total_pending} property.")
    return True


def sync_legal_documents(engine, force: bool = False) -> bool:
    pending = fetch_pending_legal_docs(engine, force=force)
    if not pending:
        logger.info("Không có legal_knowledge_base nào cần embed (đã đồng bộ đầy đủ).")
        return True

    total_pending = len(pending)
    completed = 0
    logger.info(f"Cần embed {total_pending} văn bản luật...")
    vectorstore = get_vectorstore(COLLECTION_LEGAL)

    for row in pending:
        legal_id = row["id"]
        vector_id_prefix = f"legal_{legal_id}"

        try:
            vectorstore.delete(where={"legal_document_id": legal_id})
        except Exception:
            pass

        docs = build_legal_documents(row)
        ids = [f"{vector_id_prefix}_chunk{i}" for i in range(len(docs))]

        try:
            add_documents_with_retry(
                vectorstore, docs, ids, label=f"legal doc id={legal_id}"
            )
        except RateLimitPause as e:
            try:
                vectorstore.delete(where={"legal_document_id": legal_id})
            except Exception:
                pass

            remaining = total_pending - completed
            logger.error(f"⏸️ {e}")
            logger.error("⏸️ DỪNG AN TOÀN DO QUOTA/RATE LIMIT — KHÔNG MẤT CHECKPOINT.")
            logger.info(f"   ✅ Đã hoàn thành trong lần chạy này : {completed}/{total_pending}")
            logger.info(f"   ⏳ Còn lại tối đa                 : {remaining} văn bản")
            logger.info(f"   Văn bản đang chờ                 : id={legal_id}")
            logger.info(
                "   Chạy lại cùng lệnh sau khi quota hồi; các văn bản đã sync sẽ tự động SKIP."
            )
            if force:
                logger.warning(
                    "   Bạn đang dùng --force. Để RESUME phần còn thiếu, hãy chạy lại KHÔNG có --force."
                )
            return False

        upsert_vector_sync_status(
            engine, "legal_knowledge_base", legal_id, vector_id_prefix, row["content_hash"]
        )
        completed += 1
        logger.info(
            f"  ✅ Embedded legal doc id={legal_id} ({len(docs)} chunks) "
            f"[{completed}/{total_pending}]"
        )

        if REQUEST_DELAY_SECONDS > 0:
            time.sleep(REQUEST_DELAY_SECONDS)

    logger.info(f"Hoàn tất embed {completed}/{total_pending} văn bản luật.")
    return True


# ============================================================
# MAIN
# ============================================================

def main() -> int:
    parser = argparse.ArgumentParser(description="Đồng bộ embedding Postgres -> Chroma")
    parser.add_argument(
        "--source", choices=["property", "legal", "all"], default="all",
        help="Chỉ embed 1 nguồn cụ thể, mặc định embed cả 2",
    )
    parser.add_argument(
        "--force", action="store_true",
        help="Bỏ qua kiểm tra content_hash, embed lại toàn bộ",
    )
    args = parser.parse_args()

    engine = get_engine()

    if args.force:
        logger.warning(
            "⚠️ --force đang bật: toàn bộ bản ghi được chọn sẽ bị embed lại. "
            "Không dùng --force khi chỉ muốn RESUME sau rate limit."
        )

    if args.source in ("property", "all"):
        property_done = sync_properties(engine, force=args.force)
        if not property_done:
            logger.warning(
                "Kết thúc sớm nhưng an toàn. Hãy chạy lại sau khi quota Gemini phục hồi."
            )
            return 2

    if args.source in ("legal", "all"):
        legal_done = sync_legal_documents(engine, force=args.force)
        if not legal_done:
            logger.warning(
                "Kết thúc sớm nhưng an toàn. Hãy chạy lại sau khi quota Gemini phục hồi."
            )
            return 2

    logger.info("🎉 HOÀN TẤT ĐỒNG BỘ EMBEDDING!")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())