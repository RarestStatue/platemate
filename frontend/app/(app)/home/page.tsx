import { prisma } from "@/lib/db";
import TrendingHero from "@/components/sections/TrendingHero";
import NewFromCommunity from "@/components/sections/NewFromCommunity";
import HomeSearch from "./HomeSearch";
import type { RecipeCardData } from "@/lib/types";

async function getTrendingRecipes(): Promise<RecipeCardData[]> {
  const recipes = await prisma.recipe.findMany({
    take: 10,
    orderBy: { lastEngagementAt: "desc" },
    select: {
      id: true,
      title: true,
      prepTimeMin: true,
      avgRating: true,
      photoUrl: true,
      saveCount: true,
      creator: { select: { username: true } },
    },
  });

  return recipes.map((r) => ({
    id: r.id,
    title: r.title,
    prepTimeMin: r.prepTimeMin,
    avgRating: r.avgRating,
    photoUrl: r.photoUrl,
    saveCount: r.saveCount,
    creatorUsername: r.creator.username,
    isPopular: true,
  }));
}

async function getNewRecipes(): Promise<RecipeCardData[]> {
  const recipes = await prisma.recipe.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      prepTimeMin: true,
      avgRating: true,
      photoUrl: true,
      saveCount: true,
      creator: { select: { username: true } },
    },
  });

  return recipes.map((r) => ({
    id: r.id,
    title: r.title,
    prepTimeMin: r.prepTimeMin,
    avgRating: r.avgRating,
    photoUrl: r.photoUrl,
    saveCount: r.saveCount,
    creatorUsername: r.creator.username,
  }));
}

export default async function HomePage() {
  const [trending, newest] = await Promise.all([
    getTrendingRecipes(),
    getNewRecipes(),
  ]);

  return (
    <div className="py-4">
      <div className="px-4 mb-4">
        <HomeSearch />
      </div>
      <TrendingHero recipes={trending} />
      <NewFromCommunity recipes={newest} />
    </div>
  );
}
