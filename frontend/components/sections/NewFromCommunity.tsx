import RecipeCard from "@/components/common/RecipeCard";
import type { RecipeCardData } from "@/lib/types";

interface NewFromCommunityProps {
  recipes: RecipeCardData[];
}

export default function NewFromCommunity({ recipes }: NewFromCommunityProps) {
  if (recipes.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          id={recipe.id}
          title={recipe.title}
          prepTimeMin={recipe.prepTimeMin}
          avgRating={recipe.avgRating}
          photoUrl={recipe.photoUrl}
        />
      ))}
    </div>
  );
}
