from __future__ import annotations

import re

INGREDIENT_LINE = re.compile(r"^[-*•]\s", re.MULTILINE)
QUANTITY_LINE = re.compile(
    r"^\d+([./]\d+)?\s*(cups?|tbsp|tsp|g|oz|ml|lbs?|cloves?|pieces?)\b",
    re.MULTILINE | re.IGNORECASE,
)
NUMBERED_STEP = re.compile(r"^\d+[.)]\s", re.MULTILINE)
SECTION_HEADER = re.compile(
    r"\b(ingredients|instructions|directions|method|steps)\b", re.IGNORECASE
)
TIMING_TERMS = re.compile(
    r"\b(minutes?|mins?|°[FC]|degrees|bake|simmer|preheat|roast|sauté|boil)\b",
    re.IGNORECASE,
)
TITLE_KEYWORDS = re.compile(
    r"\b(recipe|homemade|how i make|from scratch)\b", re.IGNORECASE
)

THRESHOLD = 2


def score_post(title: str, selftext: str) -> int:
    score = 0
    ingredient_lines = len(INGREDIENT_LINE.findall(selftext))
    quantity_lines = len(QUANTITY_LINE.findall(selftext))
    if ingredient_lines >= 3 or quantity_lines >= 3:
        score += 2

    if len(NUMBERED_STEP.findall(selftext)) >= 2:
        score += 1

    if SECTION_HEADER.search(selftext):
        score += 2

    if TIMING_TERMS.search(selftext):
        score += 1

    if TITLE_KEYWORDS.search(title):
        score += 1

    if len(selftext) >= 300:
        score += 1

    return score


def is_likely_recipe(title: str, selftext: str) -> bool:
    return score_post(title, selftext) >= THRESHOLD
