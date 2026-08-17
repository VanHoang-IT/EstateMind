import argparse
import json
import os
import random
import re

import pandas as pd
from underthesea import word_tokenize

DISTRICT_KEYWORDS = [
    "quận 1", "quận 2", "quận 3", "quận 4", "quận 5", "quận 6", "quận 7",
    "quận 8", "quận 9", "quận 10", "quận 11", "quận 12",
    "tân bình", "phú nhuận", "bình thạnh", "gò vấp", "thủ đức",
    "nhà bè", "bình chánh", "hóc môn", "củ chi", "cần giờ",
    "bình tân", "tân phú",
]

LEGAL_KEYWORDS = [
    "sổ hồng riêng", "sổ hồng", "sổ đỏ", "sang tên", "công chứng",
    "giấy tờ pháp lý", "pháp lý rõ ràng", "sổ chung",
]

PRICE_PATTERN = re.compile(r"(\d+(?:[.,]\d+)?)\s*(tỷ|tỉ|triệu)", re.IGNORECASE)
AREA_PATTERN = re.compile(r"(\d+(?:[.,]\d+)?)\s*(?:m2|m²|mét vuông)", re.IGNORECASE)
BEDROOM_PATTERN = re.compile(r"(\d+)\s*(?:pn|phòng ngủ|ngủ|n\+|phòng)", re.IGNORECASE)


def preprocess_spacing(text):
    text = re.sub(r"([\-\|/])", r" \1 ", text)
    text = re.sub(r"([()])", r" \1 ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def build_char_offsets(segmented_text):
    offsets = []
    cursor = 0
    for token in segmented_text.split():
        start = segmented_text.index(token, cursor)
        end = start + len(token)
        offsets.append((start, end))
        cursor = end
    return offsets


def find_span_tokens(char_offsets, start_char, end_char):
    matched = []
    for idx, (tok_start, tok_end) in enumerate(char_offsets):
        if tok_end > start_char and tok_start < end_char:
            matched.append(idx)
    return matched


def auto_label(raw_text):
    raw_text = preprocess_spacing(raw_text)
    segmented = word_tokenize(raw_text, format="text")
    tokens = segmented.split()
    char_offsets = build_char_offsets(segmented)
    tags = ["O"] * len(tokens)

    def apply_span(start_char, end_char, entity):
        span_tokens = find_span_tokens(char_offsets, start_char, end_char)
        if not span_tokens:
            return
        if any(tags[i] != "O" for i in span_tokens):
            return
        for i, tok_idx in enumerate(span_tokens):
            tags[tok_idx] = f"B-{entity}" if i == 0 else f"I-{entity}"

    for match in PRICE_PATTERN.finditer(segmented):
        apply_span(match.start(), match.end(), "PRICE")

    for match in AREA_PATTERN.finditer(segmented):
        apply_span(match.start(), match.end(), "AREA")

    for match in BEDROOM_PATTERN.finditer(segmented):
        apply_span(match.start(), match.end(), "BEDROOM")

    lowered = segmented.lower()
    for keyword in DISTRICT_KEYWORDS:
        idx = lowered.find(keyword)
        if idx != -1:
            apply_span(idx, idx + len(keyword), "DISTRICT")

    for keyword in LEGAL_KEYWORDS:
        idx = lowered.find(keyword)
        if idx != -1:
            apply_span(idx, idx + len(keyword), "LEGAL")

    return tokens, tags


def build_examples(df):
    examples = []
    for _, row in df.iterrows():
        title = str(row.get("title", ""))
        desc = str(row.get("description", ""))
        text = f"{title}. {desc}".strip()
        if not text or text == ".":
            continue
        tokens, tags = auto_label(text)
        examples.append({
            "tokens": tokens,
            "tags": tags,
            "source_url": row.get("url", ""),
        })
    return examples


def split_examples(examples, train_ratio=0.7, val_ratio=0.15, seed=42):
    shuffled = list(examples)
    random.Random(seed).shuffle(shuffled)
    n = len(shuffled)
    n_train = int(n * train_ratio)
    n_val = int(n * val_ratio)
    return shuffled[:n_train], shuffled[n_train:n_train + n_val], shuffled[n_train + n_val:]


def write_jsonl(examples, path):
    with open(path, "w", encoding="utf-8") as f:
        for example in examples:
            f.write(json.dumps(example, ensure_ascii=False) + "\n")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input_csv", default="data/batdongsan_live_1.csv")
    parser.add_argument("--output_dir", default="pipeline/training/ner/data")
    args = parser.parse_args()

    df = pd.read_csv(args.input_csv)
    examples = build_examples(df)

    train, val, test = split_examples(examples)

    os.makedirs(args.output_dir, exist_ok=True)
    write_jsonl(train, os.path.join(args.output_dir, "train.jsonl"))
    write_jsonl(val, os.path.join(args.output_dir, "val.jsonl"))
    write_jsonl(test, os.path.join(args.output_dir, "test.jsonl"))

    print(f"Tổng số mẫu: {len(examples)}")
    print(f"Train: {len(train)} | Val: {len(val)} | Test: {len(test)}")
    print("Nhãn được auto-label bằng regex/keyword — nên review lại thủ công trước khi train thật.")


if __name__ == "__main__":
    main()