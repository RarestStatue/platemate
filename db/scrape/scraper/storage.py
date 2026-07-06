from __future__ import annotations

import logging
import secrets
import string
import re

import psycopg
from rapidfuzz import fuzz

from scraper.ingredient_matcher import IngredientMatcher
from scraper.models import ParsedRecipe, RedditPost, StoreResult

logger = logging.getLogger("scraper")


def _sanitize_username(author: str) -> str:
    sanitized = re.sub(r"[^a-zA-Z0-9_.-]", "_", author)
    return sanitized[:50] if sanitized else "reddit_unknown"


def _generate_password_hash() -> str:
    chars = string.ascii_letters + string.digits
    return "$2b$12$" + "".join(secrets.choice(chars) for _ in range(53))


def find_or_create_user(conn: psycopg.Connection, reddit_author: str) -> int:
    username = f"reddit_{_sanitize_username(reddit_author)}"
    email = f"reddit_{_sanitize_username(reddit_author)}@scraped.platemate.invalid"

    with conn.cursor() as cur:
        cur.execute("SELECT id FROM users WHERE username = %s", (username,))
        row = cur.fetchone()
        if row:
            return row[0]

        password_hash = _generate_password_hash()
        cur.execute(
            """INSERT INTO users (email, username, password_hash, updated_at)
               VALUES (%s, %s, %s, NOW())
               ON CONFLICT (username) DO UPDATE SET username = EXCLUDED.username
               RETURNING id""",
            (email, username, password_hash),
        )
        user_id = cur.fetchone()[0]  # type: ignore[index]

        cur.execute(
            """INSERT INTO user_profiles (user_id, is_public, updated_at)
               VALUES (%s, false, NOW())
               ON CONFLICT (user_id) DO NOTHING""",
            (user_id,),
        )
        logger.debug("Created shadow user '%s' (id=%d)", username, user_id)
        return user_id


def _check_duplicate(conn: psycopg.Connection, creator_id: int, title: str) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT title FROM recipes WHERE creator_id = %s",
            (creator_id,),
        )
        for (existing_title,) in cur.fetchall():
            if fuzz.ratio(title.lower(), existing_title.lower()) >= 85:
                return True
        return False


CROSS_CREATOR_FUZZY_THRESHOLD = 85


def _flag_cross_creator_duplicate(
    conn: psycopg.Connection, new_recipe_id: int, title: str, creator_id: int
) -> None:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, title FROM recipes WHERE creator_id != %s AND id != %s",
            (creator_id, new_recipe_id),
        )
        rows = cur.fetchall()

    best_id: int | None = None
    best_score = 0
    for other_id, other_title in rows:
        score = fuzz.ratio(title.lower(), other_title.lower())
        if score > best_score:
            best_score = score
            best_id = other_id

    if best_id is not None and best_score >= CROSS_CREATOR_FUZZY_THRESHOLD:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO recipe_duplicate_flags
                   (original_recipe_id, candidate_recipe_id, similarity_score, flagged_reason)
                   VALUES (%s, %s, %s, %s)""",
                (best_id, new_recipe_id, best_score / 100.0, "scraper title similarity"),
            )
            logger.info("Flagged potential duplicate: recipe %d ↔ %d (score=%d)",
                        best_id, new_recipe_id, best_score)


def store_recipe(
    conn: psycopg.Connection,
    post: RedditPost,
    recipe: ParsedRecipe,
    matcher: IngredientMatcher,
) -> StoreResult:
    if not recipe.title:
        logger.warning("No title for post %s, skipping", post.id)
        return StoreResult.NO_TITLE

    username = f"reddit_{_sanitize_username(post.author)}"
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM users WHERE username = %s", (username,))
        existing_user = cur.fetchone()

    if existing_user and _check_duplicate(conn, existing_user[0], recipe.title):
        logger.info("Duplicate recipe skipped: '%s' by user %d", recipe.title, existing_user[0])
        return StoreResult.DUPLICATE

    description = recipe.description or ""
    description = f"{description}\n\nSource: {post.url}".strip()

    prep_time = max(recipe.prep_time_min or 0, 0)
    servings = max(recipe.servings or 1, 1)

    with conn.cursor() as cur:
        cur.execute("SAVEPOINT recipe_insert")
        matcher.begin_savepoint()
        try:
            creator_id = find_or_create_user(conn, post.author)

            cur.execute(
                """INSERT INTO recipes
                   (creator_id, title, description, prep_time_min, servings,
                    has_peanuts, has_tree_nuts, has_shellfish, has_dairy, has_gluten, has_eggs,
                    updated_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                   RETURNING id""",
                (
                    creator_id, recipe.title[:200], description, prep_time, servings,
                    recipe.allergens.has_peanuts, recipe.allergens.has_tree_nuts,
                    recipe.allergens.has_shellfish, recipe.allergens.has_dairy,
                    recipe.allergens.has_gluten, recipe.allergens.has_eggs,
                ),
            )
            recipe_id = cur.fetchone()[0]  # type: ignore[index]

            seen_ingredients: dict[int, tuple[float, str, str | None, int]] = {}
            for idx, ing in enumerate(recipe.ingredients):
                ingredient_id = matcher.match_or_create(ing.name, ing.unit)

                quantity = ing.quantity if ing.quantity and ing.quantity > 0 else 1.0
                unit = ing.unit or "unit"
                notes = ing.notes or ""
                if not ing.quantity:
                    notes = f"{notes} (quantity unspecified)".strip()

                if ingredient_id in seen_ingredients:
                    prev_qty, prev_unit, prev_notes, prev_idx = seen_ingredients[ingredient_id]
                    if prev_unit == unit:
                        new_qty = prev_qty + quantity
                        new_notes = "; ".join(filter(None, [prev_notes, notes or None]))
                        seen_ingredients[ingredient_id] = (new_qty, prev_unit, new_notes or None, prev_idx)
                    else:
                        extra = f"{quantity} {unit} {ing.name}"
                        new_notes = "; ".join(filter(None, [prev_notes, f"also {extra}"]))
                        seen_ingredients[ingredient_id] = (prev_qty, prev_unit, new_notes, prev_idx)
                    continue
                seen_ingredients[ingredient_id] = (quantity, unit, notes or None, idx)

            for ingredient_id, (qty, unit, notes, sort_order) in seen_ingredients.items():
                cur.execute(
                    """INSERT INTO recipe_ingredients
                       (recipe_id, ingredient_id, quantity, unit, notes, sort_order)
                       VALUES (%s, %s, %s, %s, %s, %s)
                       ON CONFLICT (recipe_id, ingredient_id) DO NOTHING""",
                    (recipe_id, ingredient_id, qty, unit, notes, sort_order),
                )

            for i, step in enumerate(recipe.steps, start=1):
                cur.execute(
                    """INSERT INTO recipe_steps
                       (recipe_id, step_number, instruction, duration_min)
                       VALUES (%s, %s, %s, %s)""",
                    (recipe_id, i, step.instruction, step.duration_min),
                )

            _flag_cross_creator_duplicate(conn, recipe_id, recipe.title, creator_id)

            cur.execute("RELEASE SAVEPOINT recipe_insert")
            matcher.commit_savepoint()

            logger.info("Stored recipe '%s' (id=%d) with %d ingredients, %d steps",
                        recipe.title, recipe_id, len(seen_ingredients), len(recipe.steps))
            return StoreResult.INSERTED

        except Exception:
            cur.execute("ROLLBACK TO SAVEPOINT recipe_insert")
            matcher.rollback_savepoint()
            logger.error("Failed to store recipe for post %s", post.id, exc_info=True)
            return StoreResult.ERROR
        except BaseException:
            try:
                cur.execute("ROLLBACK TO SAVEPOINT recipe_insert")
            except Exception:
                pass
            matcher.rollback_savepoint()
            raise
