from __future__ import annotations

from scraper.llm.base import LLMError, LLMProvider


def get_provider(
    name: str,
    model: str,
    api_key: str | None = None,
    api_base: str | None = None,
) -> LLMProvider:
    if name in ("openai", "ollama", "openai-compatible"):
        from scraper.llm.openai_compat import OpenAICompatProvider
        return OpenAICompatProvider(model, api_key, api_base, provider_name=name)
    elif name == "anthropic":
        from scraper.llm.anthropic import AnthropicProvider
        return AnthropicProvider(model, api_key, api_base)
    elif name == "huggingface":
        from scraper.llm.huggingface import HuggingFaceProvider
        return HuggingFaceProvider(model, api_key, api_base)
    else:
        raise LLMError(f"Unknown LLM provider: {name}")


__all__ = ["get_provider", "LLMProvider", "LLMError"]
