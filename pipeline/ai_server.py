import logging
import os
from pathlib import Path
from typing import Any

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from langchain_chroma import Chroma
from langchain_google_genai import (
    ChatGoogleGenerativeAI,
    GoogleGenerativeAIEmbeddings,
)
from pydantic import BaseModel, Field


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("estate-mind-ai")

CHROMA_DIR_ENV = os.getenv("CHROMA_DIR")
PERSIST_DIR = (
    Path(CHROMA_DIR_ENV).expanduser()
    if CHROMA_DIR_ENV
    else BASE_DIR / "chroma_db"
)

if not PERSIST_DIR.is_absolute():
    PERSIST_DIR = BASE_DIR / PERSIST_DIR

PERSIST_DIR = PERSIST_DIR.resolve()

COLLECTION_LEGAL = os.getenv(
    "CHROMA_LEGAL_COLLECTION",
    "legal-documents",
)
COLLECTION_PROPERTY = os.getenv(
    "CHROMA_PROPERTY_COLLECTION",
    "real-estate-listings",
)

EMBEDDING_MODEL = os.getenv(
    "GEMINI_EMBEDDING_MODEL",
    "models/gemini-embedding-001",
)
CHAT_MODEL = os.getenv(
    "GEMINI_CHAT_MODEL",
    "gemini-3.6-flash",
)

TOP_K_PROPERTY = int(os.getenv("TOP_K_PROPERTY", "5"))
TOP_K_LEGAL = int(os.getenv("TOP_K_LEGAL", "3"))

if not os.getenv("GOOGLE_API_KEY"):
    logger.warning(
        "Chưa tìm thấy GOOGLE_API_KEY trong biến môi trường hoặc file .env."
    )

PERSIST_DIR.mkdir(parents=True, exist_ok=True)


app = FastAPI(
    title="EstateMind AI Assistant API",
    version="1.1.0",
)


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)
    sessionId: int | None = None


class ChatResponse(BaseModel):
    status: str
    answer: str
    sources: list[dict[str, Any]] = Field(default_factory=list)


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1000)
    limit: int = Field(default=12, ge=1, le=50)


class SearchResponse(BaseModel):
    status: str
    query: str
    propertyIds: list[int] = Field(default_factory=list)


logger.info("Đang khởi động AI Server.")
logger.info("ChromaDB path: %s", PERSIST_DIR)
logger.info("Embedding model: %s", EMBEDDING_MODEL)
logger.info("Chat model: %s", CHAT_MODEL)


def create_embeddings() -> GoogleGenerativeAIEmbeddings:
    return GoogleGenerativeAIEmbeddings(
        model=EMBEDDING_MODEL,
        output_dimensionality=768,
    )


embeddings = create_embeddings()

legal_store = Chroma(
    collection_name=COLLECTION_LEGAL,
    embedding_function=embeddings,
    persist_directory=str(PERSIST_DIR),
)

property_store = Chroma(
    collection_name=COLLECTION_PROPERTY,
    embedding_function=embeddings,
    persist_directory=str(PERSIST_DIR),
)

llm = ChatGoogleGenerativeAI(
    model=CHAT_MODEL,
    temperature=0.2,
)


def extract_text(content: Any) -> str:
    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        parts: list[str] = []

        for block in content:
            if isinstance(block, str):
                parts.append(block)
                continue

            if isinstance(block, dict):
                text = block.get("text")

                if isinstance(text, str):
                    parts.append(text)

        return "".join(parts).strip()

    return str(content).strip()


def build_legal_context(documents: list[Any]) -> str:
    lines: list[str] = []

    for document in documents:
        source = document.metadata.get("source", "Không rõ nguồn")
        article = document.metadata.get(
            "article_number",
            "Không rõ điều khoản",
        )
        effective_date = document.metadata.get("effective_date", "không rõ")

        lines.append(
            f"- [{source} - {article}, hiệu lực từ {effective_date}]: "
            f"{document.page_content}"
        )

    return "\n".join(lines)


def build_property_context(documents: list[Any]) -> str:
    lines: list[str] = []

    for document in documents:
        property_id = document.metadata.get("property_id", "N/A")
        price = document.metadata.get("price", "N/A")
        district = document.metadata.get("district", "N/A")
        url = document.metadata.get("url", "")
        posted_date = document.metadata.get("posted_date", "không rõ")
        crawled_date = document.metadata.get("crawled_date", "không rõ")
        source_site = document.metadata.get("source_site", "không rõ")

        lines.append(
            f"- [Mã: {property_id}, Giá: {price} VNĐ, "
            f"Khu vực: {district}, Ngày đăng: {posted_date}, "
            f"Nguồn: {source_site}, Thu thập: {crawled_date}, URL: {url}]: "
            f"{document.page_content}"
        )

    return "\n".join(lines)


def extract_ordered_property_ids(
    documents: list[Any],
    limit: int,
) -> list[int]:
    ordered_ids: list[int] = []
    seen: set[int] = set()

    for document in documents:
        raw_id = document.metadata.get("property_id")

        if raw_id is None:
            continue

        try:
            property_id = int(raw_id)
        except (TypeError, ValueError):
            continue

        if property_id in seen:
            continue

        seen.add(property_id)
        ordered_ids.append(property_id)

        if len(ordered_ids) >= limit:
            break

    return ordered_ids


def build_sources(
    property_documents: list[Any],
    legal_documents: list[Any],
) -> list[dict[str, Any]]:
    sources: list[dict[str, Any]] = []
    seen_property_ids: set[Any] = set()
    seen_legal_ids: set[Any] = set()

    for document in property_documents:
        metadata = document.metadata
        property_id = metadata.get("property_id")

        if property_id is None or property_id in seen_property_ids:
            continue

        seen_property_ids.add(property_id)

        sources.append(
            {
                "type": "property",
                "propertyId": property_id,
                "price": metadata.get("price"),
                "area": metadata.get("area"),
                "district": metadata.get("district"),
                "bedrooms": metadata.get("bedrooms"),
                "legalVerified": metadata.get("legal_verified"),
                "sourceUrl": metadata.get("url"),
                "sourceSite": metadata.get("source_site"),
                "postedDate": metadata.get("posted_date"),
                "crawledDate": metadata.get("crawled_date"),
                "detailPath": f"/properties/{property_id}",
            }
        )

    for document in legal_documents:
        metadata = document.metadata
        legal_id = metadata.get("legal_document_id")

        deduplication_key = (
            legal_id
            if legal_id is not None
            else (
                metadata.get("source"),
                metadata.get("article_number"),
            )
        )

        if deduplication_key in seen_legal_ids:
            continue

        seen_legal_ids.add(deduplication_key)

        sources.append(
            {
                "type": "legal",
                "legalDocumentId": legal_id,
                "source": metadata.get("source"),
                "articleNumber": metadata.get("article_number"),
            }
        )

    return sources


def build_system_instruction(
    property_context: str,
    legal_context: str,
) -> str:
    return (
        "Bạn là trợ lý AI của sàn giao dịch bất động sản EstateMind. "
        "Bạn có hai nhiệm vụ: giới thiệu bất động sản và hỗ trợ tra cứu "
        "thông tin pháp lý.\n\n"

        "QUY TẮC BẮT BUỘC:\n"
        "1. Chỉ được giới thiệu bất động sản xuất hiện trong "
        "'KHO DỮ LIỆU NHÀ ĐẤT HIỆN CÓ'.\n"
        "2. Không tự tạo tên dự án, địa chỉ, giá, diện tích hoặc thông tin "
        "bất động sản không có trong dữ liệu.\n"
        "3. Nếu dữ liệu không có căn đáp ứng đúng ngân sách hoặc khu vực, "
        "hãy nói rõ hiện chưa có căn phù hợp. Chỉ gợi ý kết quả gần đúng "
        "nếu kết quả đó thực sự xuất hiện trong kho dữ liệu.\n"
        "4. Khi tư vấn pháp lý, chỉ sử dụng nội dung trong "
        "'KHO DỮ LIỆU LUẬT PHÁP'.\n"
        "5. Giá trong dữ liệu được tính bằng VNĐ. Khi trả lời, hãy định dạng "
        "giá dễ đọc theo triệu hoặc tỷ đồng.\n"
        "6. Không khẳng định chắc chắn về pháp lý hoặc quyết định đầu tư. "
        "Hãy khuyến nghị người dùng kiểm tra hồ sơ và tham khảo chuyên gia "
        "khi cần thiết.\n\n"

        "--- KHO DỮ LIỆU NHÀ ĐẤT HIỆN CÓ ---\n"
        f"{property_context or '(Không có kết quả bất động sản trong hệ thống)'}"
        "\n\n"

        "--- KHO DỮ LIỆU LUẬT PHÁP ---\n"
        f"{legal_context or '(Không tìm thấy nội dung pháp lý liên quan)'}"
    )


@app.get("/health")
def health_check() -> dict[str, Any]:
    return {
        "status": "ok",
        "chromaDirectory": str(PERSIST_DIR),
        "propertyCollection": COLLECTION_PROPERTY,
        "legalCollection": COLLECTION_LEGAL,
        "chatModel": CHAT_MODEL,
        "embeddingModel": EMBEDDING_MODEL,
    }


@app.post("/api/search", response_model=SearchResponse)
def search_properties(request: SearchRequest) -> SearchResponse:
    query = request.query.strip()

    logger.info("Tìm kiếm ngôn ngữ tự nhiên: %s", query)

    try:
        documents = property_store.similarity_search(
            query,
            k=request.limit * 3,
        )

        property_ids = extract_ordered_property_ids(
            documents,
            request.limit,
        )

        logger.info(
            "Tìm thấy %s property từ %s chunk.",
            len(property_ids),
            len(documents),
        )

        return SearchResponse(
            status="success",
            query=query,
            propertyIds=property_ids,
        )

    except Exception:
        logger.exception("Lỗi khi tìm kiếm ngữ nghĩa.")

        return SearchResponse(
            status="error",
            query=query,
            propertyIds=[],
        )


@app.post("/api/chat", response_model=ChatResponse)
def chat_with_ai(request: ChatRequest) -> ChatResponse:
    question = request.question.strip()

    logger.info(
        "Nhận câu hỏi từ Java, sessionId=%s: %s",
        request.sessionId,
        question,
    )

    try:
        property_documents = property_store.similarity_search(
            question,
            k=TOP_K_PROPERTY,
        )
        legal_documents = legal_store.similarity_search(
            question,
            k=TOP_K_LEGAL,
        )

        property_context = build_property_context(property_documents)
        legal_context = build_legal_context(legal_documents)

        system_instruction = build_system_instruction(
            property_context,
            legal_context,
        )

        messages = [
            ("system", system_instruction),
            ("human", question),
        ]

        logger.info(
            "Gọi Gemini với %s property documents và %s legal documents.",
            len(property_documents),
            len(legal_documents),
        )

        response = llm.invoke(messages)
        answer_text = extract_text(response.content)

        if not answer_text:
            answer_text = (
                "Mình chưa tạo được câu trả lời phù hợp từ dữ liệu hiện có."
            )

        sources = build_sources(
            property_documents,
            legal_documents,
        )

        logger.info(
            "Trả lời thành công, số nguồn=%s.",
            len(sources),
        )

        return ChatResponse(
            status="success",
            answer=answer_text,
            sources=sources,
        )

    except Exception:
        logger.exception("Lỗi khi xử lý câu hỏi bằng AI.")

        return ChatResponse(
            status="error",
            answer=(
                "Hệ thống AI đang tạm thời gặp sự cố. "
                "Vui lòng thử lại sau."
            ),
            sources=[],
        )


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("AI_SERVER_PORT", "8000")),
    )