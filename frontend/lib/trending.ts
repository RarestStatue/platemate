import { prisma } from "@/lib/db";
import { getAllergens } from "@/lib/allergens";
import type { RecipeCardData } from "@/lib/types";

export const TRENDING_WINDOW_DAYS = 7;

// Engagement score weights: saves are the strongest signal of intent to cook,
// ratings reflect quality, views are the weakest/noisiest signal. Ratings are
// summed rather than averaged so a 5-star recipe with 50 ratings outranks a
// 5-star recipe with one.
const VIEW_WEIGHT = 1;
const SAVE_WEIGHT = 3;
const RATING_WEIGHT = 2;

type TrendingRow = {
  id: number;
  title: string;
  prepTimeMin: number;
  avgRating: number;
  photoUrl: string | null;
  saveCount: number;
  viewCount: number;
  creatorUsername: string;
  score: number;
  hasPeanuts: boolean;
  hasTreeNuts: boolean;
  hasShellfish: boolean;
  hasDairy: boolean;
  hasGluten: boolean;
  hasEggs: boolean;
};

/**
 * Recipes ranked by a rolling-window engagement score (views/saves/ratings).
 * Shared by /api/trending and the home page's "Trending now" section so both
 * stay in sync with one scoring query instead of drifting apart.
 */
export async function getEngagementTrendingRecipes(
  limit: number
): Promise<RecipeCardData[]> {
  const windowStart = new Date(
    Date.now() - TRENDING_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );

  // Engagement is counted *within the window* from the event tables, not from
  // the recipes table's lifetime counters — otherwise an old recipe with a
  // large all-time count would outrank a genuinely hot new one.
  const rows = await prisma.$queryRaw<TrendingRow[]>`
    WITH windowed_views AS (
      SELECT recipe_id, SUM(count)::int AS views
      FROM recipe_view_daily
      WHERE day >= ${windowStart}::date
      GROUP BY recipe_id
    ),
    windowed_saves AS (
      SELECT recipe_id, COUNT(*)::int AS saves
      FROM user_recipe_saves
      WHERE saved_at >= ${windowStart}
      GROUP BY recipe_id
    ),
    windowed_ratings AS (
      SELECT recipe_id, SUM(rating)::int AS rating_sum
      FROM recipe_ratings
      WHERE created_at >= ${windowStart}
      GROUP BY recipe_id
    ),
    scored AS (
      SELECT
        r.id,
        r.title,
        r.prep_time_min AS "prepTimeMin",
        r.avg_rating AS "avgRating",
        r.photo_url AS "photoUrl",
        r.save_count AS "saveCount",
        r.view_count AS "viewCount",
        u.username AS "creatorUsername",
        r.has_peanuts AS "hasPeanuts",
        r.has_tree_nuts AS "hasTreeNuts",
        r.has_shellfish AS "hasShellfish",
        r.has_dairy AS "hasDairy",
        r.has_gluten AS "hasGluten",
        r.has_eggs AS "hasEggs",
        (
          COALESCE(v.views, 0) * ${VIEW_WEIGHT}
          + COALESCE(s.saves, 0) * ${SAVE_WEIGHT}
          + COALESCE(rt.rating_sum, 0) * ${RATING_WEIGHT}
        )::float AS score
      FROM recipes r
      JOIN users u ON u.id = r.creator_id
      LEFT JOIN windowed_views v ON v.recipe_id = r.id
      LEFT JOIN windowed_saves s ON s.recipe_id = r.id
      LEFT JOIN windowed_ratings rt ON rt.recipe_id = r.id
      WHERE u.deleted_at IS NULL
    )
    SELECT * FROM scored
    WHERE score > 0
    ORDER BY score DESC, id ASC
    LIMIT ${limit}
  `;

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    prepTimeMin: r.prepTimeMin,
    avgRating: r.avgRating,
    photoUrl: r.photoUrl,
    saveCount: r.saveCount,
    creatorUsername: r.creatorUsername,
    isPopular: true,
    allergens: getAllergens(r),
  }));
}
