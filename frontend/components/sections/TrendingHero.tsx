import RecipeCard from "@/components/common/RecipeCard";
import type { RecipeCardData } from "@/lib/types";

interface TrendingHeroProps {
  recipes: RecipeCardData[];
}

export default function TrendingHero({ recipes }: TrendingHeroProps) {
  if (recipes.length === 0) return null;

  return (
    <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide">
      {recipes.map((recipe, i) => (
        <div key={recipe.id} className="min-w-[240px] max-w-[240px]">
          <RecipeCard
            id={recipe.id}
            title={recipe.title}
            prepTimeMin={recipe.prepTimeMin}
            avgRating={recipe.avgRating}
            photoUrl={recipe.photoUrl}
            isPopular={recipe.isPopular}
            rank={i + 1}
          />
        </div>
      ))}
    </div>
  );
}
