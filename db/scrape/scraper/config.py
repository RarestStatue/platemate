from __future__ import annotations

import os
from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass
class Config:
    subreddit: str
    llm_provider: str = "openai"
    llm_model: str = "gpt-4o"
    api_key: str | None = None
    api_base: str | None = None
    until_date: datetime | None = None
    batch_size: int = 5
    dry_run: bool = False
    log_level: str = "info"

    reddit_client_id: str = field(default_factory=lambda: os.environ.get("REDDIT_CLIENT_ID", ""))
    reddit_client_secret: str = field(default_factory=lambda: os.environ.get("REDDIT_CLIENT_SECRET", ""))
    reddit_user_agent: str = field(
        default_factory=lambda: os.environ.get("REDDIT_USER_AGENT") or (
            f"platemate-scraper/0.1 by {os.environ.get('REDDIT_USERNAME', 'unknown')}"
        )
    )

    database_url: str = field(
        default_factory=lambda: os.environ.get("DATABASE_URL", "postgresql://localhost:5432/platemate")
    )

    def __post_init__(self) -> None:
        if not self.api_key:
            self.api_key = self._resolve_api_key()
        if not self.reddit_client_id or not self.reddit_client_secret:
            raise ValueError(
                "REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET must be set "
                "(via env vars or .env file)"
            )

    def _resolve_api_key(self) -> str | None:
        provider_env_map = {
            "openai": "OPENAI_API_KEY",
            "anthropic": "ANTHROPIC_API_KEY",
            "huggingface": "HF_API_TOKEN",
        }
        specific = provider_env_map.get(self.llm_provider)
        if specific and os.environ.get(specific):
            return os.environ[specific]
        return os.environ.get("LLM_API_KEY")

    @staticmethod
    def parse_until_date(value: str) -> datetime:
        dt = datetime.fromisoformat(value)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
