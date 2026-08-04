"""
ingest_to_chroma.py
====================
Pipeline Embedding: Postgres -> Chroma.

Đọc dữ liệu từ 2 bảng:
  - property               -> collection "real-estate-listings"
  - legal_knowledge_base   -> collection "legal-documents"

Chỉ embed những bản ghi CHƯA có trong `vector_sync_status`, hoặc đã có
nhưng nội dung thay đổi (so sánh content_hash) -> tránh embed lại toàn
bộ mỗi lần chạy, tiết kiệm API call tới Gemini.

Cài đặt thêm (ngoài các package đã có sẵn trong pipeline crawl):
    pip install langchain-google-genai langchain-community langchain-text-splitters chromadb

Chạy:
    python ingest_to_chroma.py                # embed cả 2 nguồn
    python ingest_to_chroma.py --source property
    python ingest_to_chroma.py --source legal
    python ingest_to_chroma.py --force         # bỏ qua content_hash, embed lại hết
"""

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

# Free tier Gemini embed_content: 100 request/phút.
MAX_RETRIES_429 = 10          # tối đa 10 lần retry (~10 phút) rồi mới bỏ cuộc, tránh treo vô hạn
RETRY_WAIT_SECONDS = 60       # thời gian nghỉ mỗi lần gặp 429

_embeddings = None


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
    Gọi vectorstore.add_documents() với retry khi gặp lỗi 429
    (RESOURCE_EXHAUSTED). Có giới hạn số lần retry để không treo vô hạn
    nếu vấn đề không tự hết (vd: hết quota cả ngày).
    """
    for attempt in range(1, MAX_RETRIES_429 + 1):
        try:
            vectorstore.add_documents(documents=documents, ids=ids)
            return
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                logger.warning(
                    f"  ⚠️ Quá giới hạn API (429) ở {label} "
                    f"(lần thử {attempt}/{MAX_RETRIES_429}). Nghỉ {RETRY_WAIT_SECONDS}s..."
                )
                time.sleep(RETRY_WAIT_SECONDS)
            else:
                raise  # lỗi khác 429 -> raise luôn, không retry

    raise RuntimeError(
        f"Đã thử {MAX_RETRIES_429} lần vẫn bị rate limit ở {label}. "
        f"Dừng script — kiểm tra lại quota/billing trước khi chạy tiếp."
    )


# ============================================================
# ĐỌC DỮ LIỆU CẦN EMBED (chưa sync hoặc content_hash đã đổi)
# ============================================================

def fetch_pending_properties(engine, force: bool = False):
    query = """
        SELECT p.id, p.title, p.description, p.address, p.district,
               p.price, p.area, p.bedrooms, p.status, p.legal_verified,
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
        raw = (
            f"{row['title']}|{row['description']}|{row['price']}|"
            f"{row['area']}|{row['district']}|{row['created_at']}|{row['crawl_date']}"
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


def build_property_documents(row: dict) -> list[Document]:
    posted_date = _fmt_date(row.get("created_at"))
    crawled_date = _fmt_date(row.get("crawl_date"), with_time=True)
    source_site = row.get("url_crawl") or "Người dùng đăng trực tiếp trên EstateMind"

    if row.get("url_crawl"):
        source_line = f"Nguồn dữ liệu: {source_site} (thu thập lúc {crawled_date})"
    else:
        source_line = f"Nguồn dữ liệu: {source_site}"

    text_content = (
        f"Tiêu đề: {row['title']}\n"
        f"Địa chỉ: {row['address']}, {row['district']}\n"
        f"Giá: {row['price']} VNĐ\n"
        f"Diện tích: {row['area']} m2\n"
        f"Số phòng ngủ: {row['bedrooms']}\n"
        f"Ngày đăng tin: {posted_date}\n"
        f"{source_line}\n"
        f"Mô tả: {row['description']}"
    )
    metadata = {
        "property_id": row["id"],
        "price": float(row["price"]) if row["price"] is not None else 0.0,
        "area": float(row["area"]) if row["area"] is not None else 0.0,
        "district": row["district"] or "",
        "bedrooms": row["bedrooms"] or 0,
        "legal_verified": bool(row["legal_verified"]),
        "url": row["url"] or "",
        "source_site": source_site,
        "posted_date": posted_date,
        "crawled_date": crawled_date,
    }
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


def sync_properties(engine, force: bool = False):
    pending = fetch_pending_properties(engine, force=force)
    if not pending:
        logger.info("Không có property nào cần embed (đã đồng bộ đầy đủ).")
        return

    logger.info(f"Cần embed {len(pending)} property...")
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

        add_documents_with_retry(vectorstore, docs, ids, label=f"property id={property_id}")

        upsert_vector_sync_status(engine, "property", property_id, vector_id_prefix, row["content_hash"])
        logger.info(f"  ✅ Embedded property id={property_id} ({len(docs)} chunks)")

    logger.info(f"Hoàn tất embed {len(pending)} property.")


def sync_legal_documents(engine, force: bool = False):
    pending = fetch_pending_legal_docs(engine, force=force)
    if not pending:
        logger.info("Không có legal_knowledge_base nào cần embed (đã đồng bộ đầy đủ).")
        return

    logger.info(f"Cần embed {len(pending)} văn bản luật...")
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

        add_documents_with_retry(vectorstore, docs, ids, label=f"legal doc id={legal_id}")

        upsert_vector_sync_status(engine, "legal_knowledge_base", legal_id, vector_id_prefix, row["content_hash"])
        logger.info(f"  ✅ Embedded legal doc id={legal_id} ({len(docs)} chunks)")

    logger.info(f"Hoàn tất embed {len(pending)} văn bản luật.")


# ============================================================
# MAIN
# ============================================================

def main():
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

    if args.source in ("property", "all"):
        sync_properties(engine, force=args.force)

    if args.source in ("legal", "all"):
        sync_legal_documents(engine, force=args.force)

    logger.info("🎉 HOÀN TẤT ĐỒNG BỘ EMBEDDING!")


if __name__ == "__main__":
    main()