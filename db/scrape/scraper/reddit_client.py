from __future__ import annotations

import logging
import time
from datetime import datetime, timezone
from typing import Generator

import praw
import prawcore

from scraper.config import Config
from scraper.models import RedditPost

logger = logging.getLogger("scraper")

MAX_RETRIES = 5
MAX_429_RETRIES = 10
BACKOFF_BASE = 2


def create_reddit(config: Config) -> praw.Reddit:
    return praw.Reddit(
        client_id=config.reddit_client_id,
        client_secret=config.reddit_client_secret,
        user_agent=config.reddit_user_agent,
    )


def fetch_posts(
    reddit: praw.Reddit,
    subreddit_name: str,
    until_date: datetime | None = None,
    after_fullname: str | None = None,
    stop_at_fullname: str | None = None,
) -> Generator[RedditPost, None, None]:
    """Yield recipe-candidate posts, newest-first.

    If `stop_at_fullname` is given, iteration halts (without yielding) the
    moment a submission with that fullname is seen: used to pick up only
    posts newer than a previously recorded high-water mark.
    """
    subreddit = reddit.subreddit(subreddit_name)

    params: dict = {}
    if after_fullname:
        params["after"] = after_fullname

    retries = 0
    rate_limit_retries = 0
    post_count = 0

    while True:
        try:
            for submission in subreddit.new(limit=None, params=params):
                retries = 0
                rate_limit_retries = 0

                if stop_at_fullname and submission.fullname == stop_at_fullname:
                    return

                if submission.removed_by_category is not None:
                    continue
                if not submission.selftext or submission.selftext in ("[removed]", "[deleted]"):
                    continue
                author_name = submission.author.name if submission.author else "[deleted]"
                if author_name == "[deleted]":
                    continue

                if until_date:
                    post_ts = datetime.fromtimestamp(submission.created_utc, tz=timezone.utc)
                    if post_ts >= until_date:
                        continue

                post = RedditPost(
                    id=submission.id,
                    fullname=submission.fullname,
                    title=submission.title,
                    selftext=submission.selftext,
                    author=author_name,
                    created_utc=submission.created_utc,
                    url=f"https://reddit.com{submission.permalink}",
                    score=submission.score,
                )
                params["after"] = submission.fullname
                post_count += 1
                yield post

            logger.info(
                "Reddit listing complete: %d post(s) yielded (Reddit/PRAW caps listings at ~1000)",
                post_count,
            )
            return

        except prawcore.exceptions.TooManyRequests as e:
            rate_limit_retries += 1
            if rate_limit_retries > MAX_429_RETRIES:
                raise
            retry_after_val = getattr(e, "retry_after", None)
            retry_after = int(retry_after_val) if retry_after_val is not None else 60
            logger.warning("Reddit 429: sleeping %ds (attempt %d/%d)",
                           retry_after, rate_limit_retries, MAX_429_RETRIES)
            time.sleep(retry_after)

        except prawcore.exceptions.ServerError:
            retries += 1
            if retries > MAX_RETRIES:
                raise
            wait = BACKOFF_BASE ** retries
            logger.warning("Reddit 5xx: retry %d/%d in %ds", retries, MAX_RETRIES, wait)
            time.sleep(wait)
