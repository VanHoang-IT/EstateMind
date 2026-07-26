import os
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_chroma import Chroma

load_dotenv()

PERSIST_DIR = "./chroma_db"
COLLECTION_LEGAL = "legal-documents"
COLLECTION_PROPERTY = "real-estate-listings"


def get_embeddings():
    return GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
        output_dimensionality=768,
    )


def extract_text(content) -> str:
    """
    Từ gemini-3.x trở lên, response.content có thể là:
      - str thuần (model cũ)
      - list các dict dạng [{'type': 'text', 'text': '...'}, ...] (model mới,
        do Gemini 3 hỗ trợ nhiều loại content block, kể cả 'thought' block)
    Hàm này chuẩn hoá về 1 string sạch để hiển thị, bất kể model nào.
    """
    if isinstance(content, str):
        return content

    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, dict):
                # chỉ lấy phần 'text', bỏ qua các block khác (vd: 'thought')
                if block.get("type") == "text" and "text" in block:
                    parts.append(block["text"])
            elif isinstance(block, str):
                parts.append(block)
        return "".join(parts)

    return str(content)


def generate_full_answer(user_question: str):
    embeddings = get_embeddings()

    legal_store = Chroma(
        collection_name=COLLECTION_LEGAL,
        embedding_function=embeddings,
        persist_directory=PERSIST_DIR,
    )

    property_store = Chroma(
        collection_name=COLLECTION_PROPERTY,
        embedding_function=embeddings,
        persist_directory=PERSIST_DIR,
    )

    legal_docs = legal_store.similarity_search(user_question, k=3)
    property_docs = property_store.similarity_search(user_question, k=3)

    legal_context = ""
    for doc in legal_docs:
        source = doc.metadata.get('source', 'N/A')
        article = doc.metadata.get('article_number', 'N/A')
        legal_context += f"- [{source} - {article}]: {doc.page_content}\n"

    property_context = ""
    for doc in property_docs:
        price = doc.metadata.get('price', 'N/A')
        district = doc.metadata.get('district', 'N/A')
        property_context += f"- [Giá: {price} VNĐ, Khu vực: {district}]: {doc.page_content}\n"

    system_instruction = (
        "Bạn là một Trợ lý ảo Thông minh của sàn giao dịch Bất động sản, đảm nhận 2 vai trò: "
        "Môi giới giới thiệu nhà đất VÀ Chuyên gia tư vấn pháp lý.\n"
        "Hãy đọc kỹ câu hỏi của khách hàng để biết họ đang muốn tìm nhà, hỏi luật, hay cả hai.\n\n"
        "QUY TẮC BẮT BUỘC, KHÔNG ĐƯỢC VI PHẠM:\n"
        "1. CHỈ được nhắc tới các bất động sản có xuất hiện NGUYÊN VĂN trong mục "
        "'KHO DỮ LIỆU NHÀ ĐẤT HIỆN CÓ' bên dưới. TUYỆT ĐỐI KHÔNG được tự bịa ra tên dự án, "
        "địa chỉ, giá, hay bất kỳ căn nhà nào không có trong danh sách đó, kể cả khi bạn biết "
        "về các dự án đó từ nguồn khác.\n"
        "2. Nếu trong 'KHO DỮ LIỆU NHÀ ĐẤT HIỆN CÓ' KHÔNG có căn nào khớp đúng yêu cầu (khu vực/giá), "
        "hãy trả lời thẳng là hiện chưa có căn phù hợp, và CHỈ được gợi ý các căn KHÁC cũng có trong "
        "danh sách đó nếu chúng gần đúng (ví dụ giá/khu vực lân cận), nói rõ đây là gợi ý gần đúng.\n"
        "3. Nếu 'KHO DỮ LIỆU NHÀ ĐẤT HIỆN CÓ' trống hoàn toàn, hãy nói rõ 'hiện không có dữ liệu "
        "bất động sản nào phù hợp trong hệ thống' — KHÔNG tự nghĩ ra bất kỳ căn nào để lấp chỗ trống.\n"
        "4. Khi trích dẫn luật, chỉ dùng đúng nội dung trong 'KHO DỮ LIỆU LUẬT PHÁP' bên dưới.\n\n"
        "--- KHO DỮ LIỆU NHÀ ĐẤT HIỆN CÓ ---\n"
        f"{property_context if property_context.strip() else '(Không có kết quả nào khớp trong hệ thống)'}\n\n"
        "--- KHO DỮ LIỆU LUẬT PHÁP ---\n"
        f"{legal_context if legal_context.strip() else '(Không có điều luật nào liên quan được tìm thấy)'}\n"
    )

    llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash", temperature=0.2)
    messages = [("system", system_instruction), ("human", user_question)]

    print("\n🔍 Đang tra cứu kho dữ liệu nhà đất và pháp lý...")
    response = llm.invoke(messages)

    answer_text = extract_text(response.content)

    print("\n==================== AI TƯ VẤN ====================")
    print(answer_text)
    print("===================================================")

    # Debug: in số lượng property tìm được, giúp kiểm tra retrieval có đúng không
    print(f"\n[debug] Tìm thấy {len(property_docs)} property liên quan, "
          f"{len(legal_docs)} điều luật liên quan.")
    print("[debug] Nội dung property_context THỰC TẾ gửi cho AI:")
    print("-" * 40)
    print(property_context if property_context.strip() else "(rỗng)")
    print("-" * 40)


if __name__ == "__main__":
    while True:
        query = input("\nNhập câu hỏi (Gõ 'exit' để thoát): ")
        if query.lower() == 'exit':
            break
        generate_full_answer(query)