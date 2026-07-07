from __future__ import annotations

import logging
import re

import psycopg
from rapidfuzz import fuzz, process

logger = logging.getLogger("scraper")

DESCRIPTOR_WORDS = {
    "fresh", "chopped", "diced", "minced", "sliced", "large", "small",
    "medium", "finely", "roughly", "frozen", "canned", "dried", "ground",
    "whole", "crushed", "melted", "softened", "cooked", "raw", "boneless",
    "skinless", "peeled", "grated", "shredded", "packed", "unsalted",
    "salted", "extra-virgin", "light", "dark", "sweet", "sour",
}

IRREGULAR_PLURALS = {
    "tomatoes": "tomato", "potatoes": "potato", "leaves": "leaf",
    "halves": "half", "berries": "berry", "cherries": "cherry",
    "anchovies": "anchovy", "mangoes": "mango",
}

NO_STRIP_S = {
    "hummus", "couscous", "asparagus", "molasses", "anise",
    "lemongrass", "bass", "floss", "moss", "swiss", "citrus",
}

FUZZY_THRESHOLD = 90


def normalize_name(name: str) -> str:
    name = name.lower().strip()
    name = re.sub(r"[,;(].*", "", name).strip()
    words = name.split()
    words = [w for w in words if w not in DESCRIPTOR_WORDS]
    name = " ".join(words) if words else name

    if name in IRREGULAR_PLURALS:
        return IRREGULAR_PLURALS[name]
    if name in NO_STRIP_S:
        return name

    if name.endswith("ies") and len(name) > 3:
        name = name[:-3] + "y"
    elif name.endswith("sses"):
        name = name[:-2]
    elif name.endswith("ches") or name.endswith("shes"):
        name = name[:-2]
    elif name.endswith("xes") or name.endswith("zes"):
        name = name[:-2]
    elif name.endswith("oes"):
        name = name[:-2]
    elif name.endswith("s") and not name.endswith("ss"):
        name = name[:-1]

    return name.strip()


class IngredientMatcher:
    def __init__(self, conn: psycopg.Connection):
        self.conn = conn
        self._cache: dict[str, int] = {}
        self._pending_creates: set[str] = set()
        self._load_cache()

    def _load_cache(self) -> None:
        with self.conn.cursor() as cur:
            cur.execute("SELECT id, name FROM ingredients")
            self._cache = {row[1]: row[0] for row in cur.fetchall()}
        logger.debug("Loaded %d ingredients into cache", len(self._cache))

    def begin_savepoint(self) -> None:
        self._pending_creates = set()

    def rollback_savepoint(self) -> None:
        for name in self._pending_creates:
            self._cache.pop(name, None)
        self._pending_creates = set()

    def commit_savepoint(self) -> None:
        self._pending_creates = set()

    def match_or_create(self, raw_name: str, default_unit: str | None = None) -> int:
        normalized = normalize_name(raw_name)

        if normalized in self._cache:
            return self._cache[normalized]

        result = process.extractOne(
            normalized,
            self._cache.keys(),
            scorer=fuzz.token_set_ratio,
            score_cutoff=FUZZY_THRESHOLD,
        )
        if result is not None:
            matched_name, score, _ = result
            logger.debug("Fuzzy matched '%s' → '%s' (score=%d)", normalized, matched_name, score)
            return self._cache[matched_name]

        display = raw_name.strip().title()
        with self.conn.cursor() as cur:
            cur.execute(
                """INSERT INTO ingredients (name, display_name, default_unit)
                   VALUES (%s, %s, %s)
                   ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                   RETURNING id""",
                (normalized, display, default_unit),
            )
            row = cur.fetchone()
            assert row is not None
            ingredient_id = row[0]
        self._cache[normalized] = ingredient_id
        self._pending_creates.add(normalized)
        logger.debug("Created ingredient '%s' (id=%d)", normalized, ingredient_id)
        return ingredient_id
