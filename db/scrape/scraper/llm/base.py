from __future__ import annotations

from abc import ABC, abstractmethod


class LLMError(Exception):
    pass


class LLMProvider(ABC):
    def __init__(self, model: str, api_key: str | None = None, api_base: str | None = None):
        self.model = model
        self.api_key = api_key
        self.api_base = api_base

    @abstractmethod
    def complete(
        self,
        system: str,
        user: str,
        *,
        json_mode: bool = True,
        max_tokens: int = 2048,
        temperature: float = 0.0,
    ) -> str:
        """Return raw model text. Raise LLMError on failure after internal retries."""

    def close(self) -> None:
        """Release resources. Override in subclasses that hold connections."""
