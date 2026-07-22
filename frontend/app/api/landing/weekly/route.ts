import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { mapToWeeklyRecipe, type WeeklyRecipe, type WeeklyRecipeRow } from "@/lib/landing-recipes";

const RESULT_LIMIT = 6;

/** ISO week id (e.g. "2026-W30") so the weekly set is stable per-week and rotates on week change. */
function isoWeekSeed(d = new Date()): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((date.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7
    );
  return `${date.getUTCFullYear()}-W${week}`;
}

function secondsUntilUtcMidnight() {
  const now = new Date();
  const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(1, Math.ceil((midnight - now.getTime()) / 1000));
}

async function getWeeklyRecipes(seed: string): Promise<WeeklyRecipe[]> {
  const rows = await prisma.$queryRaw<WeeklyRecipeRow[]>`
    SELECT
      r.id, r.title,
      r.prep_time_min AS "prepTimeMin",
      r.description,
      r.photo_url    AS "photoUrl",
      r.is_vegetarian AS "isVegetarian",
      r.is_vegan      AS "isVegan",
      r.has_dairy     AS "hasDairy",
      r.has_eggs      AS "hasEggs"
    FROM recipes r
    JOIN users u ON u.id = r.creator_id
    WHERE u.deleted_at IS NULL
      AND EXISTS (SELECT 1 FROM recipe_ingredients ri WHERE ri.recipe_id = r.id)
    ORDER BY (r.photo_url IS NULL), md5(r.id::text || ${seed})
    LIMIT ${RESULT_LIMIT}
  `;

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const ri = await prisma.recipeIngredient.findMany({
    where: { recipeId: { in: ids } },
    include: { ingredient: true },
    orderBy: { sortOrder: "asc" },
  });

  const byRecipe = new Map<number, string[]>();
  for (const item of ri) {
    const list = byRecipe.get(item.recipeId) ?? [];
    list.push(item.ingredient.displayName);
    byRecipe.set(item.recipeId, list);
  }

  return rows.map((row) => mapToWeeklyRecipe(row, byRecipe.get(row.id) ?? []));
}

export async function GET() {
  const seed = isoWeekSeed();
  const cacheKey = `platemate:landing:weekly:${seed}`;

  try {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return Response.json(JSON.parse(cached));
      }
    } catch {
      // Redis unavailable, fall through to DB
    }

    const recipes = await getWeeklyRecipes(seed);
    const result = { recipes };

    try {
      await redis.set(cacheKey, JSON.stringify(result), "EX", secondsUntilUtcMidnight());
    } catch {
      // Redis write failed, non-fatal
    }

    return Response.json(result);
  } catch (error) {
    console.error("Landing weekly recipes fetch error:", error);
    return Response.json({ recipes: [] }, { status: 200 });
  }
}
