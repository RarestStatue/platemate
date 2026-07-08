import RecipeCard from "@/components/common/RecipeCard";
import type { RecipeCardData } from "@/lib/types";

interface TrendingHeroProps {
  recipes: RecipeCardData[];
}

export default function TrendingHero({ recipes }: TrendingHeroProps) {
  if (recipes.length === 0) return null;

  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 scrollbar-hide sm:mx-0 sm:gap-6 sm:px-0">
      {recipes.map((recipe, i) => (
        <div
          key={recipe.id}
          className="w-[62vw] min-w-[220px] max-w-[240px] shrink-0 snap-start"
        >
          <RecipeCard
            id={recipe.id}
            title={recipe.title}
            prepTimeMin={recipe.prepTimeMin}
            avgRating={recipe.avgRating}
            photoUrl={recipe.photoUrl}
            isPopular={recipe.isPopular}
            rank={i + 1}
            allergens={recipe.allergens}
          />
        </div>
      ))}
    </div>
  );
}
