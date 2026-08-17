import json

from sentence_transformers import InputExample, SentenceTransformer, losses
from sentence_transformers.evaluation import InformationRetrievalEvaluator
from torch.utils.data import DataLoader


def load_pairs(path):
    pairs = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            pairs.append(json.loads(line))
    return pairs


def build_train_examples(pairs):
    examples = []
    for pair in pairs:
        examples.append(InputExample(texts=[pair["query"], pair["positive"]]))
    return examples


def build_ir_evaluator(pairs, name="val"):
    queries = {}
    corpus = {}
    relevant_docs = {}

    for i, pair in enumerate(pairs):
        query_id = f"q{i}"
        doc_id = f"d{i}"
        queries[query_id] = pair["query"]
        corpus[doc_id] = pair["positive"]
        relevant_docs[query_id] = {doc_id}

        if "hard_negative" in pair:
            neg_id = f"dneg{i}"
            corpus[neg_id] = pair["hard_negative"]

    return InformationRetrievalEvaluator(
        queries=queries,
        corpus=corpus,
        relevant_docs=relevant_docs,
        name=name,
        show_progress_bar=True,
    )


def main():
    base_model_name = "keepitreal/vietnamese-sbert"
    model = SentenceTransformer(base_model_name)

    train_pairs = load_pairs("training/retriever/data/train.jsonl")
    val_pairs = load_pairs("training/retriever/data/val.jsonl")

    train_examples = build_train_examples(train_pairs)
    train_dataloader = DataLoader(train_examples, shuffle=True, batch_size=16)

    train_loss = losses.MultipleNegativesRankingLoss(model)
    evaluator = build_ir_evaluator(val_pairs, name="val")

    output_dir = "training/retriever/models/estatemind-sbert"

    model.fit(
        train_objectives=[(train_dataloader, train_loss)],
        evaluator=evaluator,
        epochs=5,
        warmup_steps=int(len(train_dataloader) * 0.1),
        output_path=output_dir,
        evaluation_steps=max(len(train_dataloader) // 2, 1),
        save_best_model=True,
        show_progress_bar=True,
    )

    print(f"Đã lưu model fine-tune vào: {output_dir}")


if __name__ == "__main__":
    main()