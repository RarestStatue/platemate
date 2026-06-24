"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { IconClock, IconStar, IconFlame } from "@tabler/icons-react";
import type { RecipeCardData } from "@/lib/types";

export default function TrendingPage() {
  const [recipes, setRecipes] = useState<RecipeCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrending() {
      try {
        const res = await fetch("/api/trending");
        const data = await res.json();
        setRecipes(data.recipes || []);
      } catch {
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    }
    fetchTrending();
  }, []);

  return (
    <div className="px-4 py-4">
      <p className="text-sm text-muted mb-4">
        This week&apos;s top picks &middot; By engagement &middot; refreshed
        today
      </p>

      {loading ? (
        <p className="text-center text-muted py-8">Loading...</p>
      ) : recipes.length === 0 ? (
        <p className="text-center text-muted py-8">No trending recipes yet</p>
      ) : (
        <div className="space-y-3">
          {recipes.map((recipe, index) => (
            <Link
              key={recipe.id}
              href={`/recipe/${recipe.id}`}
              className="flex items-center gap-3 border border-border rounded-xl p-3 hover:shadow-md transition-shadow"
            >
              <span className="text-2xl font-bold text-red min-w-[2.5rem] text-center">
                #{index + 1}
              </span>

              <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                {recipe.photoUrl ? (
                  <img
                    src={recipe.photoUrl}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <IconFlame size={24} className="text-muted" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">
                  {recipe.title}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted">
                  <span className="flex items-center gap-0.5">
                    <IconClock size={12} />
                    {recipe.prepTimeMin} min
                  </span>
                  <span className="flex items-center gap-0.5">
                    <IconStar size={12} className="text-yellow-500" />
                    {recipe.avgRating.toFixed(1)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
