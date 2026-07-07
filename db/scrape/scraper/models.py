from __future__ import annotations

from enum import Enum, auto

from pydantic import BaseModel, Field


class ParsedIngredient(BaseModel):
    name: str
    quantity: float | None = Field(default=None, gt=0)
    unit: str | None = None
    notes: str | None = None


class ParsedStep(BaseModel):
    step_number: int = Field(ge=1)
    instruction: str
    duration_min: int | None = None


class ParsedAllergens(BaseModel):
    has_peanuts: bool = False
    has_tree_nuts: bool = False
    has_shellfish: bool = False
    has_dairy: bool = False
    has_gluten: bool = False
    has_eggs: bool = False


class ParsedDietary(BaseModel):
    is_vegetarian: bool = False
    is_vegan: bool = False
    is_halal: bool = False


class ParsedRecipe(BaseModel):
    is_recipe: bool
    title: str | None = Field(default=None, max_length=200)
    description: str | None = None
    prep_time_min: int | None = Field(default=None, ge=0)
    servings: int | None = Field(default=None, ge=1)
    ingredients: list[ParsedIngredient] = Field(default_factory=list)
    steps: list[ParsedStep] = Field(default_factory=list)
    allergens: ParsedAllergens = Field(default_factory=ParsedAllergens)
    dietary: ParsedDietary = Field(default_factory=ParsedDietary)


class StoreResult(Enum):
    INSERTED = auto()
    DUPLICATE = auto()
    NO_TITLE = auto()
    ERROR = auto()


class RedditPost(BaseModel):
    id: str
    fullname: str
    title: str
    selftext: str
    author: str
    created_utc: float
    url: str
    score: int
