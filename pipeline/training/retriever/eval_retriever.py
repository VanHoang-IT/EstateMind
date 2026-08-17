import json

import numpy as np
from sentence_transformers import SentenceTransformer


def load_pairs(path):
    pairs = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            pairs.append(json.loads(line))
    return pairs


def build_corpus(pairs):
    corpus_texts = []
    doc_id_for_query = []
    for pair in pairs:
        doc_id_for_query.append(len(corpus_texts))
        corpus_texts.append(pair["positive"])
        if "hard_negative" in pair:
            corpus_texts.append(pair["hard_negative"])
    return corpus_texts, doc_id_for_query


def recall_and_mrr(query_embeddings, corpus_embeddings, correct_doc_ids, k_values=(1, 3, 5)):
    similarities = query_embeddings @ corpus_embeddings.T
    ranked = np.argsort(-similarities, axis=1)

    recall_at_k = {k: 0 for k in k_values}
    reciprocal_ranks = []

    for i, correct_id in enumerate(correct_doc_ids):
        rank_positions = np.where(ranked[i] == correct_id)[0]
        if len(rank_positions) == 0:
            reciprocal_ranks.append(0.0)
            continue
        rank = rank_positions[0] + 1
        reciprocal_ranks.append(1.0 / rank)
        for k in k_values:
            if rank <= k:
                recall_at_k[k] += 1

    n = len(correct_doc_ids)
    recall_at_k = {k: v / n for k, v in recall_at_k.items()}
    mrr = float(np.mean(reciprocal_ranks))
    return recall_at_k, mrr


def evaluate_model(model_name_or_path, pairs, label):
    print(f"\n=== Đánh giá: {label} ({model_name_or_path}) ===")
    model = SentenceTransformer(model_name_or_path)

    corpus_texts, correct_doc_ids = build_corpus(pairs)
    query_texts = [pair["query"] for pair in pairs]

    corpus_embeddings = model.encode(corpus_texts, show_progress_bar=True, convert_to_numpy=True, normalize_embeddings=True)
    query_embeddings = model.encode(query_texts, show_progress_bar=True, convert_to_numpy=True, normalize_embeddings=True)

    recall_at_k, mrr = recall_and_mrr(query_embeddings, corpus_embeddings, correct_doc_ids)

    for k, value in recall_at_k.items():
        print(f"Recall@{k}: {value:.4f}")
    print(f"MRR: {mrr:.4f}")

    return {"recall_at_k": recall_at_k, "mrr": mrr}


def main():
    test_pairs = load_pairs("training/retriever/data/test.jsonl")
    print(f"Số câu test: {len(test_pairs)}")

    baseline_results = evaluate_model(
        "keepitreal/vietnamese-sbert",
        test_pairs,
        label="Baseline (chưa fine-tune)",
    )

    finetuned_results = evaluate_model(
        "training/retriever/models/estatemind-sbert",
        test_pairs,
        label="Fine-tuned (estatemind-sbert)",
    )

    print("\n=== So sánh tổng hợp ===")
    print(f"{'Metric':<12} {'Baseline':<12} {'Fine-tuned':<12}")
    for k in baseline_results["recall_at_k"]:
        b = baseline_results["recall_at_k"][k]
        f = finetuned_results["recall_at_k"][k]
        print(f"Recall@{k:<5} {b:<12.4f} {f:<12.4f}")
    print(f"{'MRR':<12} {baseline_results['mrr']:<12.4f} {finetuned_results['mrr']:<12.4f}")


if __name__ == "__main__":
    main()