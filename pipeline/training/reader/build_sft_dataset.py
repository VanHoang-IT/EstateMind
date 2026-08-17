import json
import os

from ai_server import (
    TOP_K_LEGAL,
    TOP_K_PROPERTY,
    build_legal_context,
    build_property_context,
    build_system_instruction,
    extract_text,
    legal_store,
    llm,
    property_store,
)

SAMPLE_QUESTIONS = [
    "Tìm căn hộ 2 phòng ngủ ở quận 7 giá khoảng 5 tỷ",
    "Có căn nào ở Bình Thạnh dưới 4 tỷ không",
    "Tôi muốn mua căn hộ 3 phòng ngủ view sông ở quận 2",
    "Căn hộ nào ở quận 9 diện tích trên 70m2 giá dưới 6 tỷ",
    "Có căn studio giá rẻ ở khu Bình Tân không",
    "Tìm nhà 1 phòng ngủ gần trung tâm quận 1",
    "Căn hộ Vinhomes Grand Park giá bao nhiêu",
    "Có căn hộ nào đã có sổ hồng ở Thủ Đức không",
    "Tôi cần căn 4 phòng ngủ cho gia đình đông người",
    "Căn hộ nào view đẹp gần sông Sài Gòn giá dưới 10 tỷ",
    "Tìm căn hộ gần trường quốc tế ở quận 2",
    "Có dự án nào mới mở bán ở khu Đông TP HCM không",
    "Căn hộ nào có hồ bơi, gym trong khu vực quận 7",
    "Tôi muốn đầu tư căn hộ cho thuê, khu nào tốt",
    "Có căn hộ nào giá dưới 3 tỷ phù hợp cho người mới mua nhà không",
    "Thủ tục sang tên sổ hồng căn hộ như thế nào",
    "Mua căn hộ chưa có sổ hồng có rủi ro gì không",
    "Quy định về đặt cọc mua bán căn hộ ra sao",
    "Thuế phí khi mua bán căn hộ chung cư gồm những gì",
    "Hợp đồng mua bán căn hộ cần lưu ý điều khoản nào",
    "Vay ngân hàng mua căn hộ cần chuẩn bị giấy tờ gì",
    "Căn hộ đang thế chấp ngân hàng có mua được không",
    "Phí quản lý chung cư được tính như thế nào",
    "Sổ hồng riêng và sổ hồng chung khác nhau ra sao",
    "Tìm căn hộ 2 phòng ngủ gần Phú Mỹ Hưng",
    "Căn hộ nào ở quận Bình Thạnh view thành phố đẹp",
    "Có căn hộ nào phù hợp cho cặp vợ chồng trẻ mới cưới không",
    "Tôi muốn tìm căn hộ có ban công rộng, thoáng mát",
    "Căn hộ nào gần bệnh viện quốc tế ở khu vực quận 2",
    "Có dự án nào bàn giao trong năm nay không",
]


def generate_example(question):
    property_documents = property_store.similarity_search(question, k=TOP_K_PROPERTY)
    legal_documents = legal_store.similarity_search(question, k=TOP_K_LEGAL)

    property_context = build_property_context(property_documents)
    legal_context = build_legal_context(legal_documents)

    system_instruction = build_system_instruction(property_context, legal_context)

    messages = [("system", system_instruction), ("human", question)]
    response = llm.invoke(messages)
    answer_text = extract_text(response.content)

    return {
        "system_instruction": system_instruction,
        "question": question,
        "answer": answer_text,
    }


def main():
    examples = []
    for question in SAMPLE_QUESTIONS:
        print(f"Đang sinh câu trả lời cho: {question}")
        try:
            example = generate_example(question)
            examples.append(example)
        except Exception as e:
            print(f"⚠️ Lỗi với câu hỏi '{question}': {e}")

    os.makedirs("training/reader/data", exist_ok=True)
    output_path = "training/reader/data/sft_dataset.jsonl"
    with open(output_path, "w", encoding="utf-8") as f:
        for example in examples:
            f.write(json.dumps(example, ensure_ascii=False) + "\n")

    print(f"\nĐã sinh {len(examples)} mẫu, lưu vào {output_path}")
    print("QUAN TRỌNG: đây là câu trả lời do Gemini sinh (kỹ thuật distillation) — "
          "nên đọc lại và sửa tay một phần trước khi train, tránh học theo lỗi/lan man của Gemini.")


if __name__ == "__main__":
    main()