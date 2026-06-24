import Link from "next/link";
import RecipeCard from "@/components/common/RecipeCard";
import type { RecipeCardData } from "@/lib/types";

interface TrendingHeroProps {
  recipes: RecipeCardData[];
}

export default function TrendingHero({ recipes }: TrendingHeroProps) {
  if (recipes.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3 px-4">
        <h2 className="text-lg font-bold flex items-center gap-1">
          Trending <span>&#128293;</span>
        </h2>
        <Link
          href="/trending"
          className="text-sm text-red font-medium hover:underline"
        >
          See all &rarr;
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="min-w-[200px] max-w-[200px]">
            <RecipeCard
              id={recipe.id}
              title={recipe.title}
              prepTimeMin={recipe.prepTimeMin}
              avgRating={recipe.avgRating}
              photoUrl={recipe.photoUrl}
              isPopular={recipe.isPopular}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
