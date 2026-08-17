from transformers import AutoTokenizer

from .label_schema import LABEL2ID


def load_tokenizer(model_name="vinai/phobert-base-v2"):
    return AutoTokenizer.from_pretrained(model_name)


def tokenize_and_align_labels(examples, tokenizer, max_length=256):
    all_input_ids = []
    all_attention_mask = []
    all_labels = []

    for tokens, tags in zip(examples["tokens"], examples["tags"]):
        input_ids = [tokenizer.cls_token_id]
        labels = [-100]

        for token, tag in zip(tokens, tags):
            piece_ids = tokenizer.encode(token, add_special_tokens=False)
            if not piece_ids:
                continue

            if tag == "O":
                piece_tags = ["O"] * len(piece_ids)
            elif tag.startswith("B-"):
                entity = tag[2:]
                piece_tags = [f"B-{entity}"] + [f"I-{entity}"] * (len(piece_ids) - 1)
            else:
                piece_tags = [tag] * len(piece_ids)

            input_ids.extend(piece_ids)
            labels.extend(LABEL2ID[t] for t in piece_tags)

        input_ids.append(tokenizer.sep_token_id)
        labels.append(-100)

        input_ids = input_ids[:max_length]
        labels = labels[:max_length]
        attention_mask = [1] * len(input_ids)

        all_input_ids.append(input_ids)
        all_attention_mask.append(attention_mask)
        all_labels.append(labels)

    return {
        "input_ids": all_input_ids,
        "attention_mask": all_attention_mask,
        "labels": all_labels,
    }