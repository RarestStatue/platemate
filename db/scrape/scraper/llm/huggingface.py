from __future__ import annotations

import logging
import time

import httpx

from scraper.llm.base import LLMError, LLMProvider

logger = logging.getLogger("scraper")

API_BASE = "https://router.huggingface.co"
MAX_RETRIES = 3
BACKOFF_BASE = 2
TIMEOUT = 120


class HuggingFaceProvider(LLMProvider):
    def __init__(self, model: str, api_key: str | None = None, api_base: str | None = None):
        super().__init__(model, api_key, api_base or API_BASE)
        if not self.api_key:
            raise LLMError("HuggingFace provider requires --api-key or HF_API_TOKEN env var")
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
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        body: dict = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "max_tokens": max_tokens,
            "temperature": max(temperature, 0.01),
            "stream": False,
        }

        for attempt in range(1, MAX_RETRIES + 1):
            try:
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
                    raise LLMError(f"HuggingFace failed after {MAX_RETRIES} retries: {e}") from e
                retry_after = None
                if isinstance(e, httpx.HTTPStatusError) and e.response is not None:
                    ra_val = e.response.headers.get("retry-after")
                    if ra_val:
                        try:
                            retry_after = int(ra_val)
                        except ValueError:
                            pass
                wait = retry_after if retry_after else BACKOFF_BASE ** attempt
                logger.warning("HF request failed (attempt %d/%d), retry in %ds: %s",
                               attempt, MAX_RETRIES, wait, e)
                time.sleep(wait)
        raise LLMError("unreachable")
