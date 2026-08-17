import json

from rouge_score import rouge_scorer
from sentence_transformers import SentenceTransformer, util

from local_llm import generate as local_generate


def load_test_examples(path):
    examples = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            examples.append(json.loads(line))
    return examples


def evaluate():
    examples = load_test_examples("training/reader/data/sft_dataset.jsonl")
    scorer = rouge_scorer.RougeScorer(["rouge1", "rouge2", "rougeL"], use_stemmer=False)
    embed_model = SentenceTransformer("keepitreal/vietnamese-sbert")

    rouge_scores = []
    cosine_scores = []

    for example in examples:
        reference_answer = example["answer"]
        local_answer = local_generate(example["system_instruction"], example["question"])

        scores = scorer.score(reference_answer, local_answer)
        rouge_scores.append(scores)

        embeddings = embed_model.encode([reference_answer, local_answer], convert_to_tensor=True)
        cosine = util.cos_sim(embeddings[0], embeddings[1]).item()
        cosine_scores.append(cosine)

        print(f"\nCâu hỏi: {example['question']}")
        print(f"Gemini (reference): {reference_answer[:150]}...")
        print(f"Local (LoRA)      : {local_answer[:150]}...")
        print(f"ROUGE-L: {scores['rougeL'].fmeasure:.4f} | Cosine: {cosine:.4f}")

    avg_rougeL = sum(s["rougeL"].fmeasure for s in rouge_scores) / len(rouge_scores)
    avg_cosine = sum(cosine_scores) / len(cosine_scores)

    print("\n=== Kết quả trung bình ===")
    print(f"ROUGE-L trung bình: {avg_rougeL:.4f}")
    print(f"Cosine similarity trung bình: {avg_cosine:.4f}")
    print("Lưu ý: đây chỉ là proxy tự động (so với Gemini, không phải đáp án chuẩn tuyệt đối) — "
          "nên bổ sung đánh giá thủ công (human eval) trên vài mẫu để xem tính đúng-sai thực chất.")


if __name__ == "__main__":
    evaluate()