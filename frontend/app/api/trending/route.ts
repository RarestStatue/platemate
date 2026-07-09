import { redis } from "@/lib/redis";
import { getEngagementTrendingRecipes } from "@/lib/trending";

const CACHE_KEY = "platemate:trending";
const RESULT_LIMIT = 10;

/** Seconds until the next UTC midnight, so the cached list turns over once a day. */
function secondsUntilUtcMidnight() {
  const now = new Date();
  const midnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1
  );
  return Math.max(1, Math.ceil((midnight - now.getTime()) / 1000));
}

export async function GET() {
  try {
    // Try cache first
    try {
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        return Response.json(JSON.parse(cached));
      }
    } catch {
      // Redis unavailable, fall through to DB
    }

    const recipes = await getEngagementTrendingRecipes(RESULT_LIMIT);
    const result = { recipes };

    // Cache the result
    try {
      await redis.set(
        CACHE_KEY,
        JSON.stringify(result),
        "EX",
        secondsUntilUtcMidnight()
      );
    } catch {
      // Redis write failed, non-fatal
    }

    return Response.json(result);
  } catch (error) {
    console.error("Trending fetch error:", error);
    return Response.json({ error: "Failed to fetch trending" }, { status: 500 });
  }
}
