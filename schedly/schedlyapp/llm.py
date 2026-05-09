from functools import lru_cache
import os

import dotenv
from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
from langchain_openai import ChatOpenAI


dotenv.load_dotenv()


DEFAULT_PROVIDER = "deepseek"
DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com"
DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash"
DEFAULT_HUGGINGFACE_MODEL = "Qwen/Qwen2-7B-Instruct:featherless-ai"


def get_llm_provider() -> str:
    return os.getenv("LLM_PROVIDER", DEFAULT_PROVIDER).strip().lower()


def get_llm_model() -> str:
    provider = get_llm_provider()
    if provider == "deepseek":
        return os.getenv("LLM_MODEL", DEFAULT_DEEPSEEK_MODEL).strip()
    if provider == "huggingface":
        return os.getenv("LLM_MODEL", DEFAULT_HUGGINGFACE_MODEL).strip()
    raise ValueError(f"Unsupported LLM_PROVIDER: {provider}")


def _build_deepseek_llm(temperature: float, max_tokens: int):
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        raise ValueError("Missing DEEPSEEK_API_KEY in environment variables")

    return ChatOpenAI(
        api_key=api_key,
        base_url=os.getenv("DEEPSEEK_BASE_URL", DEFAULT_DEEPSEEK_BASE_URL).strip(),
        model=get_llm_model(),
        temperature=temperature,
        max_tokens=max_tokens,
    )


def _build_huggingface_llm(temperature: float, max_tokens: int):
    api_key = os.getenv("HUGGINGFACEHUB_API_TOKEN")
    if not api_key:
        raise ValueError("Missing HUGGINGFACEHUB_API_TOKEN in environment variables")

    endpoint = HuggingFaceEndpoint(
        model=get_llm_model(),
        huggingfacehub_api_token=api_key,
        temperature=temperature,
        max_new_tokens=max_tokens,
    )
    return ChatHuggingFace(llm=endpoint)


@lru_cache(maxsize=None)
def get_chat_llm(temperature: float, max_tokens: int):
    provider = get_llm_provider()
    if provider == "deepseek":
        return _build_deepseek_llm(temperature, max_tokens)
    if provider == "huggingface":
        return _build_huggingface_llm(temperature, max_tokens)
    raise ValueError(f"Unsupported LLM_PROVIDER: {provider}")
