import os
from unittest.mock import patch

import pytest

from scraper.config import Config


class TestConfig:
    def test_missing_reddit_creds_raises(self):
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(ValueError, match="REDDIT_CLIENT_ID"):
                Config(subreddit="test")

    def test_flag_overrides_env_api_key(self):
        with patch.dict(os.environ, {
            "REDDIT_CLIENT_ID": "id",
            "REDDIT_CLIENT_SECRET": "secret",
            "LLM_API_KEY": "env_key",
        }):
            config = Config(subreddit="test", api_key="flag_key")
            assert config.api_key == "flag_key"

    def test_provider_specific_env_key(self):
        with patch.dict(os.environ, {
            "REDDIT_CLIENT_ID": "id",
            "REDDIT_CLIENT_SECRET": "secret",
            "OPENAI_API_KEY": "openai_key",
        }):
            config = Config(subreddit="test", llm_provider="openai")
            assert config.api_key == "openai_key"

    def test_generic_llm_api_key_fallback(self):
        with patch.dict(os.environ, {
            "REDDIT_CLIENT_ID": "id",
            "REDDIT_CLIENT_SECRET": "secret",
            "LLM_API_KEY": "generic_key",
        }):
            config = Config(subreddit="test", llm_provider="openai")
            assert config.api_key == "generic_key"

    def test_parse_until_date_naive_gets_utc(self):
        dt = Config.parse_until_date("2026-01-01")
        assert dt.tzinfo is not None

    def test_parse_until_date_preserves_tz(self):
        dt = Config.parse_until_date("2026-01-01T00:00:00+05:00")
        assert dt.tzinfo is not None
        assert dt.utcoffset().total_seconds() == 5 * 3600
