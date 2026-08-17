import re

import torch
from transformers import AutoModelForTokenClassification, AutoTokenizer
from underthesea import word_tokenize

MODEL_DIR = "training/ner/models/estatemind-ner-phobert/final"

_tokenizer = None
_model = None


def _load():
    global _tokenizer, _model
    if _model is None:
        _tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
        _model = AutoModelForTokenClassification.from_pretrained(MODEL_DIR)
        _model.eval()
    return _tokenizer, _model


def _group_entities(tokens, tags):
    entities = {}
    current_entity = None
    current_tokens = []

    for token, tag in zip(tokens, tags):
        if tag.startswith("B-"):
            if current_entity:
                entities.setdefault(current_entity, []).append(" ".join(current_tokens))
            current_entity = tag[2:]
            current_tokens = [token]
        elif tag.startswith("I-") and current_entity == tag[2:]:
            current_tokens.append(token)
        else:
            if current_entity:
                entities.setdefault(current_entity, []).append(" ".join(current_tokens))
            current_entity = None
            current_tokens = []

    if current_entity:
        entities.setdefault(current_entity, []).append(" ".join(current_tokens))

    return entities


def _clean_number(text_value):
    match = re.search(r"\d+(?:[.,]\d+)?", text_value.replace("_", " "))
    if not match:
        return None
    return float(match.group(0).replace(",", "."))


def extract_fields(raw_text, max_length=256):
    tokenizer, model = _load()
    segmented = word_tokenize(raw_text, format="text")
    tokens = segmented.split()

    if not tokens:
        return {
            "price_raw": [], "area_raw": [], "bedroom_raw": [],
            "district_raw": [], "legal_raw": [],
            "price_value": None, "area_value": None, "bedroom_value": None,
        }

    input_ids = [tokenizer.cls_token_id]
    word_first_piece_pos = []

    for token in tokens:
        piece_ids = tokenizer.encode(token, add_special_tokens=False)
        if not piece_ids:
            word_first_piece_pos.append(None)
            continue
        word_first_piece_pos.append(len(input_ids))
        input_ids.extend(piece_ids)

    input_ids.append(tokenizer.sep_token_id)
    input_ids = input_ids[:max_length]

    input_tensor = torch.tensor([input_ids])
    attention_mask = torch.ones_like(input_tensor)

    with torch.no_grad():
        logits = model(input_ids=input_tensor, attention_mask=attention_mask).logits

    predictions = torch.argmax(logits, dim=2)[0].tolist()

    word_tags = ["O"] * len(tokens)
    for i, pos in enumerate(word_first_piece_pos):
        if pos is not None and pos < len(predictions):
            word_tags[i] = model.config.id2label[predictions[pos]]

    entities = _group_entities(tokens, word_tags)

    price_values = [v for v in (_clean_number(t) for t in entities.get("PRICE", [])) if v is not None]
    area_values = [v for v in (_clean_number(t) for t in entities.get("AREA", [])) if v is not None]
    bedroom_values = [v for v in (_clean_number(t) for t in entities.get("BEDROOM", [])) if v is not None]

    return {
        "price_raw": entities.get("PRICE", []),
        "area_raw": entities.get("AREA", []),
        "bedroom_raw": entities.get("BEDROOM", []),
        "district_raw": entities.get("DISTRICT", []),
        "legal_raw": entities.get("LEGAL", []),
        "price_value": price_values[0] if price_values else None,
        "area_value": area_values[0] if area_values else None,
        "bedroom_value": int(bedroom_values[0]) if bedroom_values else None,
    }


if __name__ == "__main__":
    sample = "Bán căn hộ 2 phòng ngủ tại quận 7, diện tích 75m2, giá thỏa thuận, sổ hồng riêng."
    print(extract_fields(sample))