import os
import logging
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma

# Tắt bớt log không cần thiết để hiển thị kết quả cho sạch
logging.basicConfig(level=logging.WARNING)
load_dotenv()

PERSIST_DIR = "./chroma_db"
COLLECTION_LEGAL = "legal-documents"


def get_embeddings():
    return GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
        output_dimensionality=768,
    )


def query_legal_docs(query_text: str, k: int = 3):
    """
    Truy vấn ChromaDB để tìm k tài liệu liên quan nhất đến query_text.
    """
    # Khởi tạo kết nối tới Chroma collection
    vectorstore = Chroma(
        collection_name=COLLECTION_LEGAL,
        embedding_function=get_embeddings(),
        persist_directory=PERSIST_DIR,
    )

    # Thực hiện tìm kiếm tương đồng kèm điểm số khoảng cách (L2 distance)
    # k=3 nghĩa là lấy ra top 3 kết quả liên quan nhất
    results = vectorstore.similarity_search_with_score(query_text, k=k)

    print(f"\n🔍 CÂU HỎI TRUY VẤN: '{query_text}'")
    print("=" * 60)

    if not results:
        print("Không tìm thấy kết quả nào phù hợp.")
        return

    for i, (doc, score) in enumerate(results, 1):
        print(f"📍 KẾT QUẢ TỐP {i} (Độ lệch/Distance Score: {score:.4f})")
        print(f"📄 Nguồn: {doc.metadata.get('source', 'N/A')}")
        print(f"📌 Điều khoản: {doc.metadata.get('article_number', 'N/A')}")
        print("-" * 40)
        print(doc.page_content)
        print("=" * 60)


if __name__ == "__main__":
    # Nhập câu hỏi bất kỳ liên quan tới dữ liệu luật bạn đã ingest
    # (Ví dụ: "quy định về đặt cọc", "thủ tục sang tên", v.v.)
    user_query = input("Nhập câu hỏi bạn muốn tìm kiếm trong database luật: ")
    query_legal_docs(user_query, k=2)  # lấy top 2 kết quả liên quan nhất