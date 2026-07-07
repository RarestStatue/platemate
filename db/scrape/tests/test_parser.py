import json

import pytest
from unittest.mock import MagicMock

from scraper.llm.base import LLMError, LLMProvider
from scraper.models import RedditPost
from scraper.parser import _heuristic_fallback, _strip_fences, parse_post

SAMPLE_POST = RedditPost(
    id="abc123",
    fullname="t3_abc123",
    title="Easy Pasta",
    selftext=(
        "Ingredients:\n"
        "- 2 cups pasta\n"
        "- 1 cup tomato sauce\n"
        "- salt to taste\n\n"
        "1. Boil pasta\n"
        "2. Add sauce\n"
        "3. Season with salt\n"
    ),
    author="chef42",
    created_utc=1700000000.0,
    url="https://reddit.com/r/recipes/comments/abc123",
    score=50,
)

VALID_RESPONSE = json.dumps({
    "is_recipe": True,
    "title": "Easy Pasta",
    "description": "Simple pasta dish",
    "prep_time_min": 15,
    "servings": 2,
    "ingredients": [
        {"name": "pasta", "quantity": 2.0, "unit": "cup", "notes": None},
        {"name": "tomato sauce", "quantity": 1.0, "unit": "cup", "notes": None},
        {"name": "salt", "quantity": None, "unit": None, "notes": "to taste"},
    ],
    "steps": [
        {"step_number": 1, "instruction": "Boil pasta", "duration_min": 10},
        {"step_number": 2, "instruction": "Add sauce", "duration_min": None},
        {"step_number": 3, "instruction": "Season with salt", "duration_min": None},
    ],
    "allergens": {
        "has_peanuts": False, "has_tree_nuts": False, "has_shellfish": False,
        "has_dairy": False, "has_gluten": True, "has_eggs": False,
    },
})


class TestStripFences:
    def test_with_fences(self):
        assert _strip_fences('```json\n{"a":1}\n```') == '{"a":1}'

    def test_without_fences(self):
        assert _strip_fences('{"a":1}') == '{"a":1}'

    def test_plain_fences(self):
        assert _strip_fences('```\n{"a":1}\n```') == '{"a":1}'


class TestParsePost:
    def test_valid_response(self):
        provider = MagicMock(spec=LLMProvider)
        provider.complete.return_value = VALID_RESPONSE
        result = parse_post(provider, SAMPLE_POST)
        assert result is not None
        assert result.is_recipe is True
        assert result.title == "Easy Pasta"
        assert len(result.ingredients) == 3
        assert len(result.steps) == 3
        assert result.allergens.has_gluten is True

    def test_not_recipe(self):
        provider = MagicMock(spec=LLMProvider)
        provider.complete.return_value = json.dumps({"is_recipe": False})
        result = parse_post(provider, SAMPLE_POST)
        assert result is not None
        assert result.is_recipe is False

    def test_invalid_then_repair(self):
        provider = MagicMock(spec=LLMProvider)
        provider.complete.side_effect = ["not json at all{{{", VALID_RESPONSE]
        result = parse_post(provider, SAMPLE_POST)
        assert result is not None
        assert result.title == "Easy Pasta"
        assert provider.complete.call_count == 2

    def test_llm_error_propagates(self):
        provider = MagicMock(spec=LLMProvider)
        provider.complete.side_effect = LLMError("provider down")
        with pytest.raises(LLMError):
            parse_post(provider, SAMPLE_POST)

    def test_llm_error_on_repair_propagates(self):
        provider = MagicMock(spec=LLMProvider)
        provider.complete.side_effect = [
            "not json{{{",
            LLMError("provider down"),
        ]
        with pytest.raises(LLMError):
            parse_post(provider, SAMPLE_POST)


class TestHeuristicFallback:
    def test_extracts_ingredients_and_steps(self):
        result = _heuristic_fallback(SAMPLE_POST)
        assert result is not None
        assert result.is_recipe is True
        assert len(result.ingredients) >= 2
        assert len(result.steps) >= 1

    def test_parses_quantities_from_bullet_lines(self):
        post = RedditPost(
            id="q", fullname="t3_q", title="Test",
            selftext="- 2 cups flour\n- 1 tsp salt\n1. Mix\n",
            author="u", created_utc=0, url="", score=0,
        )
        result = _heuristic_fallback(post)
        assert result is not None
        flour = result.ingredients[0]
        assert flour.name == "flour"
        assert flour.quantity == 2.0
        assert flour.unit == "cup"

    def test_insufficient_data_returns_none(self):
        post = RedditPost(
            id="x", fullname="t3_x", title="hi", selftext="nothing here",
            author="u", created_utc=0, url="", score=0,
        )
        assert _heuristic_fallback(post) is None
