from __future__ import annotations

import httpx
import pytest
import respx

from scraper.llm.anthropic import AnthropicProvider
from scraper.llm.base import LLMError
from scraper.llm.huggingface import HuggingFaceProvider
from scraper.llm.openai_compat import OpenAICompatProvider


@pytest.fixture(autouse=True)
def no_sleep(monkeypatch):
    monkeypatch.setattr("scraper.llm.openai_compat.time.sleep", lambda s: None)
    monkeypatch.setattr("scraper.llm.anthropic.time.sleep", lambda s: None)
    monkeypatch.setattr("scraper.llm.huggingface.time.sleep", lambda s: None)


class TestOpenAICompatProvider:
    @respx.mock
    def test_success(self):
        respx.post("https://api.openai.com/v1/chat/completions").mock(
            return_value=httpx.Response(200, json={
                "choices": [{"message": {"content": "hello"}}]
            })
        )
        provider = OpenAICompatProvider("gpt-4o", api_key="key")
        try:
            assert provider.complete("sys", "user") == "hello"
        finally:
            provider.close()

    @respx.mock
    def test_retries_then_succeeds(self):
        route = respx.post("https://api.openai.com/v1/chat/completions")
        route.side_effect = [
            httpx.Response(500),
            httpx.Response(200, json={"choices": [{"message": {"content": "ok"}}]}),
        ]
        provider = OpenAICompatProvider("gpt-4o", api_key="key")
        try:
            assert provider.complete("sys", "user") == "ok"
        finally:
            provider.close()

    @respx.mock
    def test_exhausts_retries_raises_llm_error(self):
        respx.post("https://api.openai.com/v1/chat/completions").mock(
            return_value=httpx.Response(500)
        )
        provider = OpenAICompatProvider("gpt-4o", api_key="key")
        try:
            with pytest.raises(LLMError):
                provider.complete("sys", "user")
        finally:
            provider.close()

    @respx.mock
    def test_falls_back_without_response_format_on_400(self):
        route = respx.post("https://api.openai.com/v1/chat/completions")
        route.side_effect = [
            httpx.Response(400, json={"error": "response_format not supported"}),
            httpx.Response(200, json={"choices": [{"message": {"content": "fallback"}}]}),
        ]
        provider = OpenAICompatProvider("gpt-4o", api_key="key")
        try:
            assert provider.complete("sys", "user") == "fallback"
        finally:
            provider.close()
        sent_bodies = [r.request.content for r in route.calls]
        assert b"response_format" in sent_bodies[0]
        assert b"response_format" not in sent_bodies[1]

    @respx.mock
    def test_honors_retry_after_header_on_429(self):
        route = respx.post("https://api.openai.com/v1/chat/completions")
        route.side_effect = [
            httpx.Response(429, headers={"retry-after": "3"}),
            httpx.Response(200, json={"choices": [{"message": {"content": "ok"}}]}),
        ]
        provider = OpenAICompatProvider("gpt-4o", api_key="key")
        try:
            assert provider.complete("sys", "user") == "ok"
        finally:
            provider.close()

    def test_requires_api_base_for_openai_compatible(self):
        with pytest.raises(LLMError):
            OpenAICompatProvider("model", provider_name="openai-compatible")

    def test_ollama_default_base_needs_no_key(self):
        provider = OpenAICompatProvider("mistral", provider_name="ollama")
        assert provider.api_base == "http://localhost:11434"
        provider.close()


class TestAnthropicProvider:
    @respx.mock
    def test_success(self):
        respx.post("https://api.anthropic.com/v1/messages").mock(
            return_value=httpx.Response(200, json={
                "content": [{"type": "text", "text": "hi there"}]
            })
        )
        provider = AnthropicProvider("claude-sonnet-5", api_key="key")
        try:
            assert provider.complete("sys", "user") == "hi there"
        finally:
            provider.close()

    def test_requires_api_key(self):
        with pytest.raises(LLMError):
            AnthropicProvider("model", api_key=None)

    @respx.mock
    def test_exhausts_retries_raises_llm_error(self):
        respx.post("https://api.anthropic.com/v1/messages").mock(
            return_value=httpx.Response(503)
        )
        provider = AnthropicProvider("claude-sonnet-5", api_key="key")
        try:
            with pytest.raises(LLMError):
                provider.complete("sys", "user")
        finally:
            provider.close()

    @respx.mock
    def test_no_text_block_raises_llm_error(self):
        respx.post("https://api.anthropic.com/v1/messages").mock(
            return_value=httpx.Response(200, json={"content": [{"type": "tool_use"}]})
        )
        provider = AnthropicProvider("claude-sonnet-5", api_key="key")
        try:
            with pytest.raises(LLMError):
                provider.complete("sys", "user")
        finally:
            provider.close()


class TestHuggingFaceProvider:
    @respx.mock
    def test_success(self):
        respx.post("https://router.huggingface.co/v1/chat/completions").mock(
            return_value=httpx.Response(200, json={
                "choices": [{"message": {"content": "generated"}}]
            })
        )
        provider = HuggingFaceProvider("mistral", api_key="key")
        try:
            assert provider.complete("sys", "user") == "generated"
        finally:
            provider.close()

    def test_requires_api_key(self):
        with pytest.raises(LLMError):
            HuggingFaceProvider("model", api_key=None)

    @respx.mock
    def test_exhausts_retries_raises_llm_error(self):
        respx.post("https://router.huggingface.co/v1/chat/completions").mock(
            return_value=httpx.Response(500)
        )
        provider = HuggingFaceProvider("mistral", api_key="key")
        try:
            with pytest.raises(LLMError):
                provider.complete("sys", "user")
        finally:
            provider.close()
