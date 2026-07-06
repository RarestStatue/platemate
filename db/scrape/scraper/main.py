from __future__ import annotations

import argparse
import json
import logging
from dataclasses import dataclass

import psycopg
from dotenv import load_dotenv

from scraper.checkpoint import load_checkpoint, save_checkpoint
from scraper.config import Config
from scraper.heuristics import is_likely_recipe
from scraper.ingredient_matcher import IngredientMatcher
from scraper.llm import get_provider
from scraper.llm.base import LLMError, LLMProvider
from scraper.logging_setup import setup_logging
from scraper.models import StoreResult
from scraper.parser import parse_post
from scraper.reddit_client import create_reddit, fetch_posts
from scraper.storage import store_recipe


@dataclass
class RunStats:
    fetched: int = 0
    prefilter_skipped: int = 0
    not_recipe: int = 0
    parsed: int = 0
    inserted: int = 0
    duplicates: int = 0
    failed: int = 0


@dataclass
class RunState:
    """Tracks progress through one pass of posts (pickup pass or resume pass)."""
    last_fullname: str | None = None
    first_fullname: str | None = None
    batch_count: int = 0
    skips_since_checkpoint: int = 0
    track_newest: bool = False


CHECKPOINT_SKIP_INTERVAL = 50


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="platemate-scrape",
        description="Scrape Reddit for recipes and store in PlateMate DB",
    )
    p.add_argument("--subreddit", required=True, help="Subreddit name (no r/ prefix)")
    p.add_argument("--until-date", help="Scrape posts before this ISO 8601 date")
    p.add_argument("--llm-provider", default="openai",
                   choices=["openai", "anthropic", "ollama", "huggingface", "openai-compatible"])
    p.add_argument("--llm-model", default="gpt-4o")
    p.add_argument("--api-key", help="LLM API key (falls back to env)")
    p.add_argument("--api-base", help="Base URL for LLM endpoint")
    p.add_argument("--batch-size", type=int, default=5)
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--log-level", default="info",
                   choices=["debug", "info", "warning", "error"])
    return p


def _checkpoint_save(config: Config, state: RunState) -> None:
    if state.last_fullname:
        save_checkpoint(
            config.subreddit,
            state.last_fullname,
            newest_seen=state.first_fullname if state.track_newest else None,
            until_date=config.until_date,
        )


def _do_commit(conn, config: Config, state: RunState) -> None:
    conn.commit()
    _checkpoint_save(config, state)


def _process_posts(
    posts_iter,
    provider: LLMProvider,
    conn,
    matcher,
    config: Config,
    stats: RunStats,
    state: RunState,
    logger: logging.Logger,
) -> None:
    """Drain an iterable of posts, updating stats/state. Propagates LLMError
    and KeyboardInterrupt so the caller can decide what to persist."""
    for post in posts_iter:
        stats.fetched += 1
        if state.first_fullname is None:
            state.first_fullname = post.fullname

        if not is_likely_recipe(post.title, post.selftext):
            stats.prefilter_skipped += 1
            logger.debug("Prefilter skip: %s", post.id)
            state.last_fullname = post.fullname
            state.skips_since_checkpoint += 1
            if state.skips_since_checkpoint >= CHECKPOINT_SKIP_INTERVAL and state.batch_count == 0:
                _checkpoint_save(config, state)
                state.skips_since_checkpoint = 0
            continue

        recipe = parse_post(provider, post)
        if recipe is None or not recipe.is_recipe:
            stats.not_recipe += 1
            state.last_fullname = post.fullname
            state.skips_since_checkpoint += 1
            continue

        stats.parsed += 1

        if config.dry_run:
            print(json.dumps(recipe.model_dump(), indent=2, default=str))
            state.last_fullname = post.fullname
            continue

        assert conn is not None and matcher is not None
        result = store_recipe(conn, post, recipe, matcher)
        if result == StoreResult.INSERTED:
            stats.inserted += 1
        elif result == StoreResult.DUPLICATE:
            stats.duplicates += 1
        else:
            stats.failed += 1

        state.last_fullname = post.fullname
        state.batch_count += 1
        state.skips_since_checkpoint = 0

        if state.batch_count >= config.batch_size:
            _do_commit(conn, config, state)
            state.batch_count = 0
            logger.info("Batch committed. Stats so far: %s", stats)


def run(config: Config) -> RunStats:
    logger = setup_logging(config.log_level)
    stats = RunStats()

    provider = get_provider(config.llm_provider, config.llm_model,
                            config.api_key, config.api_base)
    logger.info("Using LLM: %s / %s", config.llm_provider, config.llm_model)

    reddit = create_reddit(config)
    checkpoint = load_checkpoint(config.subreddit)
    after = checkpoint["last_fullname"]
    newest_seen = checkpoint["newest_seen"]
    stored_until = checkpoint["until_date"]
    if after:
        logger.info("Resuming from checkpoint: %s", after)
        current_until = config.until_date.isoformat() if config.until_date else None
        if stored_until != current_until:
            logger.warning(
                "Checkpoint --until-date differs from current: stored=%s, current=%s",
                stored_until, current_until,
            )

    conn = None
    matcher = None
    if not config.dry_run:
        conn = psycopg.connect(config.database_url, autocommit=False)
        matcher = IngredientMatcher(conn)

    # Pickup pass: posts newer than the last known top of the listing.
    pickup_state = RunState(track_newest=True)
    # Resume pass: continue the deep crawl from where the last run left off.
    resume_state = RunState(last_fullname=after, track_newest=False)

    try:
        if newest_seen:
            logger.info("Checking for new posts since last seen: %s", newest_seen)
            _process_posts(
                fetch_posts(reddit, config.subreddit, config.until_date,
                            after_fullname=None, stop_at_fullname=newest_seen),
                provider, conn, matcher, config, stats, pickup_state, logger,
            )
            if conn and pickup_state.batch_count > 0:
                _do_commit(conn, config, pickup_state)

        _process_posts(
            fetch_posts(reddit, config.subreddit, config.until_date, after_fullname=after),
            provider, conn, matcher, config, stats, resume_state, logger,
        )
        if conn and resume_state.batch_count > 0:
            _do_commit(conn, config, resume_state)

    except LLMError as e:
        logger.error("LLM provider failed, aborting run: %s", e)
        if conn:
            if pickup_state.batch_count > 0:
                _do_commit(conn, config, pickup_state)
            if resume_state.batch_count > 0:
                _do_commit(conn, config, resume_state)
        logger.info("Checkpoint saved. Resolve LLM issue and re-run to resume.")
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
        if conn:
            if pickup_state.batch_count > 0:
                _do_commit(conn, config, pickup_state)
            if resume_state.batch_count > 0:
                _do_commit(conn, config, resume_state)
    finally:
        provider.close()
        if conn:
            conn.close()

    logger.info(
        "Run complete: fetched=%d prefilter_skipped=%d not_recipe=%d "
        "parsed=%d inserted=%d duplicates=%d failed=%d",
        stats.fetched, stats.prefilter_skipped, stats.not_recipe,
        stats.parsed, stats.inserted, stats.duplicates, stats.failed,
    )
    return stats


def main() -> None:
    load_dotenv()
    parser = build_parser()
    args = parser.parse_args()

    until = Config.parse_until_date(args.until_date) if args.until_date else None

    config = Config(
        subreddit=args.subreddit,
        llm_provider=args.llm_provider,
        llm_model=args.llm_model,
        api_key=args.api_key,
        api_base=args.api_base,
        until_date=until,
        batch_size=args.batch_size,
        dry_run=args.dry_run,
        log_level=args.log_level,
    )
    run(config)


if __name__ == "__main__":
    main()
