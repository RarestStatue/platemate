import Link from "next/link";
import RecipeCard from "@/components/common/RecipeCard";
import type { RecipeCardData } from "@/lib/types";

interface NewFromCommunityProps {
  recipes: RecipeCardData[];
}

export default function NewFromCommunity({ recipes }: NewFromCommunityProps) {
  if (recipes.length === 0) return null;

  return (
    <section className="px-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">New from community</h2>
        <Link
          href="/discover"
          className="text-sm text-red font-medium hover:underline"
        >
          See all &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
    </section>
  );
}
