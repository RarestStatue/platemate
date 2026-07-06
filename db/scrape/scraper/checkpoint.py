from __future__ import annotations

import json
import logging
import os
import tempfile
from datetime import datetime
from pathlib import Path

logger = logging.getLogger("scraper")

CHECKPOINT_FILE = Path(__file__).parent.parent / "checkpoint.json"


def load_checkpoint(subreddit: str) -> dict:
    if not CHECKPOINT_FILE.exists():
        return {"last_fullname": None, "newest_seen": None, "until_date": None}
    try:
        data = json.loads(CHECKPOINT_FILE.read_text())
        entry = data.get(subreddit, {})
        return {
            "last_fullname": entry.get("last_fullname"),
            "newest_seen": entry.get("newest_seen"),
            "until_date": entry.get("until_date"),
        }
    except (json.JSONDecodeError, KeyError):
        return {"last_fullname": None, "newest_seen": None, "until_date": None}


def save_checkpoint(
    subreddit: str,
    last_fullname: str,
    newest_seen: str | None = None,
    until_date: datetime | None = None,
) -> None:
    data: dict = {}
    if CHECKPOINT_FILE.exists():
        try:
            data = json.loads(CHECKPOINT_FILE.read_text())
        except json.JSONDecodeError:
            data = {}

    existing = data.get(subreddit, {})
    entry: dict = {"last_fullname": last_fullname}

    if newest_seen:
        entry["newest_seen"] = newest_seen
    elif existing.get("newest_seen"):
        entry["newest_seen"] = existing["newest_seen"]

    if until_date:
        entry["until_date"] = until_date.isoformat()
    elif existing.get("until_date"):
        entry["until_date"] = existing["until_date"]

    data[subreddit] = entry

    fd, tmp_path = tempfile.mkstemp(dir=CHECKPOINT_FILE.parent, suffix=".tmp")
    try:
        with os.fdopen(fd, "w") as f:
            json.dump(data, f, indent=2)
        os.replace(tmp_path, CHECKPOINT_FILE)
    except BaseException:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
        raise
    logger.debug("Checkpoint saved: %s → %s", subreddit, last_fullname)
