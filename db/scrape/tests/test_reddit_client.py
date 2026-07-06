from __future__ import annotations

from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock

import prawcore
import pytest

from scraper.reddit_client import fetch_posts


def make_submission(id_, title="T", selftext="body", author="someone",
                     created_utc=1700000000.0, removed=None, score=1):
    return SimpleNamespace(
        id=id_,
        fullname=f"t3_{id_}",
        title=title,
        selftext=selftext,
        author=SimpleNamespace(name=author) if author else None,
        created_utc=created_utc,
        permalink=f"/r/test/comments/{id_}",
        score=score,
        removed_by_category=removed,
    )


def make_response(status_code, headers=None, text=""):
    return SimpleNamespace(status_code=status_code, headers=headers or {}, text=text)


class FakeSubreddit:
    """Mimics praw's subreddit.new(): each call to .new() consumes one
    scripted item: either a list of submissions to iterate, or an
    exception to raise."""

    def __init__(self, script):
        self.script = list(script)
        self.calls = 0

    def new(self, limit=None, params=None):
        self.calls += 1
        item = self.script.pop(0)
        if isinstance(item, BaseException):
            raise item
        return iter(item)


class FakeReddit:
    def __init__(self, subreddit):
        self._subreddit = subreddit

    def subreddit(self, name):
        return self._subreddit


@pytest.fixture(autouse=True)
def no_sleep(monkeypatch):
    monkeypatch.setattr("scraper.reddit_client.time.sleep", lambda s: None)


class TestFetchPosts:
    def test_yields_valid_posts(self):
        subs = [make_submission("a"), make_submission("b")]
        reddit = FakeReddit(FakeSubreddit([subs]))
        posts = list(fetch_posts(reddit, "test"))
        assert [p.id for p in posts] == ["a", "b"]

    def test_skips_removed(self):
        subs = [make_submission("a", removed="moderator"), make_submission("b")]
        reddit = FakeReddit(FakeSubreddit([subs]))
        posts = list(fetch_posts(reddit, "test"))
        assert [p.id for p in posts] == ["b"]

    def test_skips_empty_or_removed_selftext(self):
        subs = [
            make_submission("a", selftext=""),
            make_submission("b", selftext="[deleted]"),
            make_submission("c", selftext="[removed]"),
            make_submission("d"),
        ]
        reddit = FakeReddit(FakeSubreddit([subs]))
        posts = list(fetch_posts(reddit, "test"))
        assert [p.id for p in posts] == ["d"]

    def test_skips_deleted_author(self):
        subs = [make_submission("a", author=None), make_submission("b")]
        reddit = FakeReddit(FakeSubreddit([subs]))
        posts = list(fetch_posts(reddit, "test"))
        assert [p.id for p in posts] == ["b"]

    def test_until_date_filters_newer_posts(self):
        old = make_submission("old", created_utc=1000)
        new = make_submission("new", created_utc=2_000_000_000)
        reddit = FakeReddit(FakeSubreddit([[old, new]]))
        until = datetime.fromtimestamp(1_500_000_000, tz=timezone.utc)
        posts = list(fetch_posts(reddit, "test", until_date=until))
        assert [p.id for p in posts] == ["old"]

    def test_stop_at_fullname_halts_before_match(self):
        subs = [make_submission("a"), make_submission("b"), make_submission("c")]
        reddit = FakeReddit(FakeSubreddit([subs]))
        posts = list(fetch_posts(reddit, "test", stop_at_fullname="t3_b"))
        assert [p.id for p in posts] == ["a"]

    def test_no_stop_at_fullname_yields_everything(self):
        subs = [make_submission("a"), make_submission("b")]
        reddit = FakeReddit(FakeSubreddit([subs]))
        posts = list(fetch_posts(reddit, "test", stop_at_fullname=None))
        assert [p.id for p in posts] == ["a", "b"]

    def test_retries_on_server_error_then_succeeds(self):
        fake_sub = FakeSubreddit([
            prawcore.exceptions.ServerError(make_response(500)),
            [make_submission("a")],
        ])
        reddit = FakeReddit(fake_sub)
        posts = list(fetch_posts(reddit, "test"))
        assert [p.id for p in posts] == ["a"]
        assert fake_sub.calls == 2

    def test_raises_after_max_server_error_retries(self):
        # MAX_RETRIES=5 -> 6 total calls all raising ServerError
        fake_sub = FakeSubreddit([prawcore.exceptions.ServerError(make_response(500))] * 6)
        reddit = FakeReddit(fake_sub)
        with pytest.raises(prawcore.exceptions.ServerError):
            list(fetch_posts(reddit, "test"))

    def test_honors_retry_after_on_429_then_succeeds(self):
        resp = make_response(429, headers={"retry-after": "5"})
        fake_sub = FakeSubreddit([
            prawcore.exceptions.TooManyRequests(resp),
            [make_submission("a")],
        ])
        reddit = FakeReddit(fake_sub)
        posts = list(fetch_posts(reddit, "test"))
        assert [p.id for p in posts] == ["a"]

    def test_raises_after_max_429_retries(self):
        resp = make_response(429, headers={})
        fake_sub = FakeSubreddit([prawcore.exceptions.TooManyRequests(resp)] * 11)
        reddit = FakeReddit(fake_sub)
        with pytest.raises(prawcore.exceptions.TooManyRequests):
            list(fetch_posts(reddit, "test"))

    def test_after_fullname_passed_through_as_param(self):
        captured_params = {}

        class ParamCapturingSubreddit(FakeSubreddit):
            def new(self, limit=None, params=None):
                captured_params.update(params or {})
                return super().new(limit=limit, params=params)

        subs = [make_submission("a")]
        fake_sub = ParamCapturingSubreddit([subs])
        reddit = FakeReddit(fake_sub)
        list(fetch_posts(reddit, "test", after_fullname="t3_seed"))
        assert captured_params["after"] == "t3_seed"
