"use client";

import { useState, useEffect } from "react";
import { IconHeart } from "@tabler/icons-react";
import RecipeCard from "@/components/common/RecipeCard";
import type { RecipeCardData } from "@/lib/types";

export default function SavedPage() {
  const [recipes, setRecipes] = useState<RecipeCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSaved() {
      try {
        const res = await fetch("/api/saved");
        if (res.ok) {
          const data = await res.json();
          setRecipes(data.recipes || []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchSaved();
  }, []);

  if (loading) {
    return (
      <div className="px-4 py-8 text-center text-muted">Loading...</div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="px-4 py-16 text-center">
        <IconHeart size={48} className="mx-auto text-muted mb-4" />
        <h2 className="text-lg font-semibold mb-2">No saved recipes yet</h2>
        <p className="text-sm text-muted">
          Tap the heart icon on any recipe to save it here.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
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
    </div>
  );
}
