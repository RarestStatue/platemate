import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { getAllergens } from "@/lib/allergens";

const CACHE_KEY = "platemate:trending";
const CACHE_TTL = 3600; // 1 hour

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

    const recipes = await prisma.recipe.findMany({
      take: 10,
      orderBy: [
        { lastEngagementAt: "desc" },
        { saveCount: "desc" },
      ],
      select: {
        id: true,
        title: true,
        prepTimeMin: true,
        avgRating: true,
        photoUrl: true,
        saveCount: true,
        ratingCount: true,
        creator: { select: { username: true } },
        hasPeanuts: true,
        hasTreeNuts: true,
        hasShellfish: true,
        hasDairy: true,
        hasGluten: true,
        hasEggs: true,
      },
    });

    const result = {
      recipes: recipes.map((r) => ({
        id: r.id,
        title: r.title,
        prepTimeMin: r.prepTimeMin,
        avgRating: r.avgRating,
        photoUrl: r.photoUrl,
        saveCount: r.saveCount,
        creatorUsername: r.creator.username,
        isPopular: true,
        allergens: getAllergens(r),
      })),
    };

    // Cache the result
    try {
      await redis.set(CACHE_KEY, JSON.stringify(result), "EX", CACHE_TTL);
    } catch {
      // Redis write failed, non-fatal
    }

    return Response.json(result);
  } catch (error) {
    console.error("Trending fetch error:", error);
    return Response.json({ error: "Failed to fetch trending" }, { status: 500 });
  }
}
