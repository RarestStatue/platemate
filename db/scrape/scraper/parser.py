from __future__ import annotations

import json
import logging
import re
from fractions import Fraction

from pydantic import ValidationError

from scraper.llm.base import LLMError, LLMProvider
from scraper.models import ParsedRecipe, RedditPost

logger = logging.getLogger("scraper")

SYSTEM_PROMPT = """\
You extract structured recipe data from Reddit posts. Respond with ONLY a JSON
object matching the provided schema. If the post does not contain an actual
recipe (ingredients and preparation), return {"is_recipe": false}.
Rules:
- Quantities as decimal numbers (1/2 → 0.5). Unknown quantity → null.
- Units lowercase singular (cup, tbsp, tsp, g, ml, oz, lb, piece, clove...).
- Ingredient names lowercase, singular, no quantities or adjectives that
  don't change the ingredient ("chopped onion" → "onion").
- allergens: mark true only if an ingredient clearly contains it.
- dietary: mark true only if the recipe clearly qualifies. is_vegetarian: no
  meat, poultry, or fish. is_vegan: vegetarian and also no dairy, eggs, honey,
  or other animal products. is_halal: no pork, no alcohol, and no ambiguous
  meat (meat only if explicitly halal). When in doubt, leave false.
- prep_time_min: total minutes; estimate from steps if unstated; null if no basis.

JSON Schema:
{
  "is_recipe": bool,
  "title": "string (required, ≤200 chars)",
  "description": "string | null",
  "prep_time_min": "int >= 0 | null",
  "servings": "int >= 1 | null",
  "ingredients": [
    {"name": "string", "quantity": "number > 0 | null", "unit": "string | null", "notes": "string | null"}
  ],
  "steps": [
    {"step_number": "int, 1-based", "instruction": "string", "duration_min": "int | null"}
  ],
  "allergens": {
    "has_peanuts": false, "has_tree_nuts": false, "has_shellfish": false,
    "has_dairy": false, "has_gluten": false, "has_eggs": false
  },
  "dietary": {
    "is_vegetarian": false, "is_vegan": false, "is_halal": false
  }
}"""

FENCE_RE = re.compile(r"```(?:json)?\s*\n?(.*?)\n?\s*```", re.DOTALL)

QUANTITY_UNIT_RE = re.compile(
    r"^(\d+(?:[./]\d+)?)\s+"
    r"(?:(cups?|tbsp|tsp|g|oz|ml|lbs?|cloves?|pieces?|each)\s+)?"
    r"(.+)",
    re.IGNORECASE,
)


def _strip_fences(text: str) -> str:
    m = FENCE_RE.search(text)
    return m.group(1).strip() if m else text.strip()


def _parse_json(raw: str) -> ParsedRecipe:
    cleaned = _strip_fences(raw)
    data = json.loads(cleaned)
    return ParsedRecipe.model_validate(data)


def parse_post(provider: LLMProvider, post: RedditPost) -> ParsedRecipe | None:
    """Parse a Reddit post into a recipe. Raises LLMError if provider is down."""
    user_msg = f"Title: {post.title}\n\n{post.selftext}"
    raw: str | None = None

    try:
        raw = provider.complete(SYSTEM_PROMPT, user_msg)
        return _parse_json(raw)
    except LLMError:
        raise
    except (json.JSONDecodeError, ValidationError) as first_err:
        logger.debug("First parse failed for %s, attempting repair: %s", post.id, first_err)

        truncated_raw = (raw[:500] + "...") if raw and len(raw) > 500 else (raw or "<empty>")
        repair_msg = (
            f"Your previous response was invalid JSON. Error: {first_err}\n"
            f"Your response was:\n{truncated_raw}\n\n"
            f"Please re-extract the recipe from this post as valid JSON.\n\n"
            f"Title: {post.title}\n\n{post.selftext}"
        )
        try:
            raw = provider.complete(SYSTEM_PROMPT, repair_msg)
            return _parse_json(raw)
        except LLMError:
            raise
        except (json.JSONDecodeError, ValidationError) as e:
            logger.debug("Repair parse also failed for %s: %s", post.id, e)

    result = _heuristic_fallback(post)
    if result:
        logger.info("Heuristic fallback used for post %s", post.id)
    else:
        logger.warning("All parsing failed for post %s, skipping", post.id)
    return result


def _heuristic_fallback(post: RedditPost) -> ParsedRecipe | None:
    from scraper.models import ParsedIngredient, ParsedStep

    lines = post.selftext.split("\n")
    ingredients: list[ParsedIngredient] = []
    steps: list[ParsedStep] = []
    step_num = 0

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if re.match(r"^[-*•]\s+", stripped):
            text = re.sub(r"^[-*•]\s+", "", stripped).strip()
            if text:
                m = QUANTITY_UNIT_RE.match(text)
                if m:
                    qty_str, unit, name = m.group(1), m.group(2), m.group(3)
                    try:
                        qty = float(Fraction(qty_str))
                    except (ValueError, ZeroDivisionError):
                        qty = None
                    ingredients.append(ParsedIngredient(
                        name=name.lower().strip(),
                        quantity=qty if qty and qty > 0 else None,
                        unit=unit.lower().rstrip("s") if unit else None,
                    ))
                else:
                    ingredients.append(ParsedIngredient(name=text.lower()))
        elif re.match(r"^\d+[.)]\s+", stripped):
            step_num += 1
            instruction = re.sub(r"^\d+[.)]\s+", "", stripped).strip()
            if instruction:
                steps.append(ParsedStep(step_number=step_num, instruction=instruction))

    if len(ingredients) < 2 or len(steps) < 1:
        return None

    return ParsedRecipe(
        is_recipe=True,
        title=post.title[:200],
        ingredients=ingredients,
        steps=steps,
    )
