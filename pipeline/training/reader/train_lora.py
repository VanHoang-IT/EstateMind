import json

import torch
from datasets import Dataset
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    DataCollatorForLanguageModeling,
    Trainer,
    TrainingArguments,
)

MODEL_NAME = "vinai/PhoGPT-4B-Chat"


def load_sft_examples(path):
    examples = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            examples.append(json.loads(line))
    return examples


def build_prompt(system_instruction, question, answer=None):
    prompt = (
        f"### Hệ thống:\n{system_instruction}\n\n"
        f"### Câu hỏi:\n{question}\n\n"
        f"### Trả lời:\n"
    )
    if answer is not None:
        prompt += answer
    return prompt


def tokenize_examples(examples, tokenizer, max_length=1024):
    input_ids_list = []
    labels_list = []
    attention_mask_list = []

    for example in examples:
        prompt_only = build_prompt(example["system_instruction"], example["question"])
        full_text = build_prompt(example["system_instruction"], example["question"], example["answer"])

        prompt_ids = tokenizer.encode(prompt_only, add_special_tokens=False)
        full_ids = tokenizer.encode(full_text, add_special_tokens=False)
        full_ids = full_ids[:max_length]

        labels = list(full_ids)
        prompt_len = min(len(prompt_ids), len(full_ids))
        for i in range(prompt_len):
            labels[i] = -100

        input_ids_list.append(full_ids)
        labels_list.append(labels)
        attention_mask_list.append([1] * len(full_ids))

    return Dataset.from_dict({
        "input_ids": input_ids_list,
        "attention_mask": attention_mask_list,
        "labels": labels_list,
    })


def main():
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    quant_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16,
        bnb_4bit_use_double_quant=True,
    )

    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        quantization_config=quant_config,
        device_map="auto",
        trust_remote_code=True,
    )
    model = prepare_model_for_kbit_training(model)

    lora_config = LoraConfig(
        r=16,
        lora_alpha=32,
        target_modules=["q_proj", "v_proj"],
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    examples = load_sft_examples("training/reader/data/sft_dataset.jsonl")
    dataset = tokenize_examples(examples, tokenizer)

    data_collator = DataCollatorForLanguageModeling(tokenizer, mlm=False)

    output_dir = "training/reader/models/estatemind-reader-lora"

    training_args = TrainingArguments(
        output_dir=output_dir,
        per_device_train_batch_size=1,
        gradient_accumulation_steps=8,
        num_train_epochs=3,
        learning_rate=2e-4,
        logging_steps=5,
        save_strategy="epoch",
        bf16=True,
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=dataset,
        data_collator=data_collator,
    )

    trainer.train()

    final_dir = f"{output_dir}/final"
    model.save_pretrained(final_dir)
    tokenizer.save_pretrained(final_dir)
    print(f"Đã lưu LoRA adapter vào: {final_dir}")


if __name__ == "__main__":
    main()