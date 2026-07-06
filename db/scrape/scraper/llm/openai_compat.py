from __future__ import annotations

import logging
import time

import httpx

from scraper.llm.base import LLMError, LLMProvider

logger = logging.getLogger("scraper")

DEFAULT_BASES = {
    "openai": "https://api.openai.com",
    "ollama": "http://localhost:11434",
}

MAX_RETRIES = 3
BACKOFF_BASE = 2
TIMEOUT = 120


class OpenAICompatProvider(LLMProvider):
    def __init__(self, model: str, api_key: str | None = None, api_base: str | None = None,
                 provider_name: str = "openai"):
        super().__init__(model, api_key, api_base)
        self._provider_name = provider_name
        if not self.api_base:
            self.api_base = DEFAULT_BASES.get(provider_name, "")
        if not self.api_base:
            raise LLMError(f"--api-base required for provider '{provider_name}'")
        self.api_base = self.api_base.rstrip("/")
        self._client = httpx.Client(timeout=TIMEOUT)

    def close(self) -> None:
        self._client.close()

    def complete(
        self,
        system: str,
        user: str,
        *,
        json_mode: bool = True,
        max_tokens: int = 2048,
        temperature: float = 0.0,
    ) -> str:
        url = f"{self.api_base}/v1/chat/completions"
        headers: dict[str, str] = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        body: dict = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        use_json_mode = json_mode
        if json_mode:
            body["response_format"] = {"type": "json_object"}

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                resp = self._client.post(url, json=body, headers=headers)

                if resp.status_code == 400 and use_json_mode:
                    logger.debug("Server rejected response_format, retrying without")
                    body.pop("response_format", None)
                    use_json_mode = False
                    resp = self._client.post(url, json=body, headers=headers)

                if resp.status_code == 429 or resp.status_code >= 500:
                    raise httpx.HTTPStatusError(
                        f"HTTP {resp.status_code}", request=resp.request, response=resp
                    )
                resp.raise_for_status()
                data = resp.json()
                return data["choices"][0]["message"]["content"]
            except (httpx.HTTPStatusError, httpx.TransportError) as e:
                if attempt == MAX_RETRIES:
                    raise LLMError(f"OpenAI-compat failed after {MAX_RETRIES} retries: {e}") from e
                retry_after = None
                if isinstance(e, httpx.HTTPStatusError) and e.response is not None:
                    ra_val = e.response.headers.get("retry-after")
                    if ra_val:
                        try:
                            retry_after = int(ra_val)
                        except ValueError:
                            pass
                wait = retry_after if retry_after else BACKOFF_BASE ** attempt
                logger.warning("LLM request failed (attempt %d/%d), retry in %ds: %s",
                               attempt, MAX_RETRIES, wait, e)
                time.sleep(wait)
        raise LLMError("unreachable")
