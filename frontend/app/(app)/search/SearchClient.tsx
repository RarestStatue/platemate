"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { IconSearch } from "@tabler/icons-react";
import RecipeCard from "@/components/common/RecipeCard";
import FilterPanel from "@/components/common/FilterPanel";
import type {
  RecipeCardData,
  DietaryFilters,
  SortOption,
  PrepTimeFilter,
} from "@/lib/types";

export default function SearchClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQ);
  const [recipes, setRecipes] = useState<RecipeCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [dietaryFilters, setDietaryFilters] = useState<DietaryFilters>({});
  const [maxPrepTime, setMaxPrepTime] = useState<PrepTimeFilter>(null);
  const [sort, setSort] = useState<SortOption>("newest");

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (maxPrepTime) params.set("maxPrepTime", String(maxPrepTime));
    if (sort !== "newest") params.set("sort", sort);
    Object.entries(dietaryFilters).forEach(([key, val]) => {
      if (val) params.set(key, "true");
    });

    try {
      const res = await fetch(`/api/recipes?${params.toString()}`);
      const data = await res.json();
      setRecipes(data.recipes || []);
    } catch {
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, [query, maxPrepTime, sort, dietaryFilters]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchRecipes();
  }

  // Build active dietary info string
  const activeDietaryLabels = Object.entries(dietaryFilters)
    .filter(([, v]) => v)
    .map(([k]) => {
      const map: Record<string, string> = {
        peanutFree: "Peanut allergy",
        glutenFree: "Gluten-free",
        dairyFree: "Dairy-free",
        vegetarian: "Vegetarian",
        vegan: "Vegan",
        halal: "Halal",
      };
      return map[k] || k;
    });

  const activeDietaryInfo =
    activeDietaryLabels.length > 0
      ? `${activeDietaryLabels.join(" · ")} active · unsafe recipes hidden`
      : undefined;

  return (
    <div className="px-4 py-4">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="relative mb-4">
        <IconSearch
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search recipes..."
          className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-red focus:border-transparent text-sm"
        />
      </form>

      {/* Filters */}
      <FilterPanel
        ingredients={ingredients}
        onAddIngredient={(ing) =>
          setIngredients((prev) => [...prev, ing])
        }
        onRemoveIngredient={(ing) =>
          setIngredients((prev) => prev.filter((i) => i !== ing))
        }
        dietaryFilters={dietaryFilters}
        onToggleDietary={(key) =>
          setDietaryFilters((prev) => ({
            ...prev,
            [key]: !prev[key as keyof DietaryFilters],
          }))
        }
        maxPrepTime={maxPrepTime}
        onSetPrepTime={setMaxPrepTime}
        sort={sort}
        onSetSort={setSort}
        activeDietaryInfo={activeDietaryInfo}
      />

      {/* Results */}
      <div className="mt-4">
        {loading ? (
          <p className="text-center text-muted py-8">Searching...</p>
        ) : recipes.length === 0 ? (
          <p className="text-center text-muted py-8">
            No recipes found. Try different filters.
          </p>
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
                missingCount={recipe.missingCount}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
