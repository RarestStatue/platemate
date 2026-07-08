"use client";

import { useState, useEffect } from "react";
import { IconSearch } from "@tabler/icons-react";
import RecipeCard from "@/components/common/RecipeCard";
import type { RecipeCardData } from "@/lib/types";

export default function DiscoverPage() {
  const [recipes, setRecipes] = useState<RecipeCardData[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecipes() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ sort: "newest" });
        if (query.trim()) params.set("q", query.trim());
        const res = await fetch(`/api/recipes?${params.toString()}`);
        const data = await res.json();
        setRecipes(data.recipes || []);
      } catch {
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    }
    fetchRecipes();
  }, [query]);

  return (
    <div className="px-4 py-4">
      <p className="text-sm text-muted mb-3">
        Discover &middot; newest first
      </p>

      <div className="relative mb-4">
        <IconSearch
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search community recipes..."
          className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-red text-sm"
        />
      </div>

      {loading ? (
        <p className="text-center text-muted py-8">Loading...</p>
      ) : recipes.length === 0 ? (
        <p className="text-center text-muted py-8">No recipes found</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              id={recipe.id}
              title={recipe.title}
              prepTimeMin={recipe.prepTimeMin}
              avgRating={recipe.avgRating}
              photoUrl={recipe.photoUrl}
              allergens={recipe.allergens}
            />
          ))}
        </div>
      )}
    </div>
  );
}
