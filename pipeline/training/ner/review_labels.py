import argparse
import json


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", default="training/ner/data/train.jsonl")
    parser.add_argument("--n", type=int, default=30)
    parser.add_argument("--only_with_entities", action="store_true")
    args = parser.parse_args()

    shown = 0
    with open(args.file, encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            record = json.loads(line)
            tokens = record["tokens"]
            tags = record["tags"]

            has_entity = any(tag != "O" for tag in tags)
            if args.only_with_entities and not has_entity:
                continue

            print(f"\n--- Dòng {line_num} ---")
            line_str = " ".join(
                f"{tok}[{tag}]" if tag != "O" else tok
                for tok, tag in zip(tokens, tags)
            )
            print(line_str)

            shown += 1
            if shown >= args.n:
                break


if __name__ == "__main__":
    main()