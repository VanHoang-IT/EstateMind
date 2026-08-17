import json

import numpy as np
from datasets import Dataset
from seqeval.metrics import f1_score, precision_score, recall_score
from transformers import (
    AutoModelForTokenClassification,
    DataCollatorForTokenClassification,
    Trainer,
    TrainingArguments,
)

from .dataset_utils import load_tokenizer, tokenize_and_align_labels
from .label_schema import ID2LABEL, LABEL2ID, LABELS


def load_jsonl(path):
    examples = {"tokens": [], "tags": []}
    with open(path, encoding="utf-8") as f:
        for line in f:
            record = json.loads(line)
            examples["tokens"].append(record["tokens"])
            examples["tags"].append(record["tags"])
    return Dataset.from_dict(examples)


def compute_metrics(eval_pred):
    predictions, labels = eval_pred
    predictions = np.argmax(predictions, axis=2)

    true_predictions = [
        [ID2LABEL[p] for p, l in zip(pred, label) if l != -100]
        for pred, label in zip(predictions, labels)
    ]
    true_labels = [
        [ID2LABEL[l] for p, l in zip(pred, label) if l != -100]
        for pred, label in zip(predictions, labels)
    ]

    return {
        "precision": precision_score(true_labels, true_predictions),
        "recall": recall_score(true_labels, true_predictions),
        "f1": f1_score(true_labels, true_predictions),
    }


def main():
    model_name = "vinai/phobert-base-v2"
    tokenizer = load_tokenizer(model_name)

    train_dataset = load_jsonl("training/ner/data/train.jsonl")
    val_dataset = load_jsonl("training/ner/data/val.jsonl")
    test_dataset = load_jsonl("training/ner/data/test.jsonl")

    def tokenize_fn(examples):
        return tokenize_and_align_labels(examples, tokenizer)

    train_tokenized = train_dataset.map(tokenize_fn, batched=True)
    val_tokenized = val_dataset.map(tokenize_fn, batched=True)
    test_tokenized = test_dataset.map(tokenize_fn, batched=True)

    model = AutoModelForTokenClassification.from_pretrained(
        model_name,
        num_labels=len(LABELS),
        id2label=ID2LABEL,
        label2id=LABEL2ID,
    )

    data_collator = DataCollatorForTokenClassification(tokenizer)

    training_args = TrainingArguments(
        output_dir="training/ner/models/estatemind-ner-phobert",
        eval_strategy="epoch",
        save_strategy="epoch",
        learning_rate=3e-5,
        per_device_train_batch_size=16,
        per_device_eval_batch_size=16,
        num_train_epochs=10,
        weight_decay=0.01,
        load_best_model_at_end=True,
        metric_for_best_model="f1",
        logging_steps=20,
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_tokenized,
        eval_dataset=val_tokenized,
        tokenizer=tokenizer,
        data_collator=data_collator,
        compute_metrics=compute_metrics,
    )

    trainer.train()

    test_results = trainer.evaluate(test_tokenized)
    print("Kết quả trên test set:")
    print(test_results)

    trainer.save_model("training/ner/models/estatemind-ner-phobert/final")
    tokenizer.save_pretrained("training/ner/models/estatemind-ner-phobert/final")


if __name__ == "__main__":
    main()