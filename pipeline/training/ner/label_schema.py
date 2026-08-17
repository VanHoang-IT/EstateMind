LABELS = [
    "O",
    "B-PRICE", "I-PRICE",
    "B-AREA", "I-AREA",
    "B-BEDROOM", "I-BEDROOM",
    "B-DISTRICT", "I-DISTRICT",
    "B-LEGAL", "I-LEGAL",
]

LABEL2ID = {label: idx for idx, label in enumerate(LABELS)}
ID2LABEL = {idx: label for idx, label in enumerate(LABELS)}