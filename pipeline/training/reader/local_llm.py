import torch
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

BASE_MODEL_NAME = "Qwen/Qwen2.5-7B-Instruct"
ADAPTER_DIR = "training/reader/models/estatemind-reader-lora/final"

_tokenizer = None
_model = None


def _load():
    global _tokenizer, _model
    if _model is None:
        _tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_NAME)
        if _tokenizer.pad_token is None:
            _tokenizer.pad_token = _tokenizer.eos_token

        quant_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16,
            bnb_4bit_use_double_quant=True,
        )

        base_model = AutoModelForCausalLM.from_pretrained(
            BASE_MODEL_NAME,
            quantization_config=quant_config,
            device_map="auto",
        )
        _model = PeftModel.from_pretrained(base_model, ADAPTER_DIR)
        _model.eval()
        _model.config.use_cache = True
    return _tokenizer, _model


def build_prompt(system_instruction, question, answer=None):
    prompt = (
        f"### Hệ thống:\n{system_instruction}\n\n"
        f"### Câu hỏi:\n{question}\n\n"
        f"### Trả lời:\n"
    )
    if answer is not None:
        prompt += answer
    return prompt


def generate(system_instruction, question, max_new_tokens=512):
    tokenizer, model = _load()

    prompt = build_prompt(system_instruction, question)
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

    with torch.no_grad():
        output_ids = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            temperature=0.3,
            do_sample=True,
            pad_token_id=tokenizer.pad_token_id or tokenizer.eos_token_id,
        )

    generated_text = tokenizer.decode(
        output_ids[0][inputs["input_ids"].shape[1]:],
        skip_special_tokens=True,
    )
    return generated_text.strip()


if __name__ == "__main__":
    sample_system = "Bạn là trợ lý tư vấn bất động sản. Trả lời ngắn gọn, chính xác."
    sample_question = "Căn hộ 2 phòng ngủ ở quận 7 giá khoảng bao nhiêu?"
    print(generate(sample_system, sample_question))
