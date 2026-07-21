"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { IconSearch, IconAdjustmentsHorizontal, IconX } from "@tabler/icons-react";
import RecipeCard from "@/components/common/RecipeCard";
import FilterPanel from "@/components/common/FilterPanel";
import { useHaveIngredientsStore } from "@/stores/useHaveIngredientsStore";
import type {
  RecipeCardData,
  DietaryFilters,
  SortOption,
  PrepTimeFilter,
} from "@/lib/types";

export default function SearchClient() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQ);
  const [recipes, setRecipes] = useState<RecipeCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [dietaryFilters, setDietaryFilters] = useState<DietaryFilters>({});
  const [maxPrepTime, setMaxPrepTime] = useState<PrepTimeFilter>(null);
  const [sort, setSort] = useState<SortOption>("newest");
  const [sheetOpen, setSheetOpen] = useState(false);

  const setHave = useHaveIngredientsStore((s) => s.setHave);
  useEffect(() => {
    setHave(ingredients);
  }, [ingredients, setHave]);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (maxPrepTime) params.set("maxPrepTime", String(maxPrepTime));
    if (sort !== "newest") params.set("sort", sort);
    Object.entries(dietaryFilters).forEach(([key, val]) => {
      if (val) params.set(key, "true");
    });
    ingredients.forEach((ingredient) => {
      params.append("ingredient", ingredient);
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
  }, [query, maxPrepTime, sort, dietaryFilters, ingredients]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch re-runs when search/filter deps change, not a render-then-setState loop
    fetchRecipes();
  }, [fetchRecipes]);

  // Lock scroll when mobile sheet open
  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchRecipes();
  }

  const activeCount =
    ingredients.length +
    Object.values(dietaryFilters).filter(Boolean).length +
    (maxPrepTime ? 1 : 0) +
    (sort !== "newest" ? 1 : 0);

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

  const filterPanelProps = {
    ingredients,
    onAddIngredient: (ing: string) =>
      setIngredients((prev) => [...prev, ing]),
    onRemoveIngredient: (ing: string) =>
      setIngredients((prev) => prev.filter((i) => i !== ing)),
    dietaryFilters,
    onToggleDietary: (key: string) =>
      setDietaryFilters((prev) => ({
        ...prev,
        [key]: !prev[key as keyof DietaryFilters],
      })),
    maxPrepTime,
    onSetPrepTime: setMaxPrepTime,
    sort,
    onSetSort: setSort,
    activeDietaryInfo,
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-4 sm:px-8">
      {/* Sticky search + filter row */}
      <div className="sticky top-[env(safe-area-inset-top)] z-30 -mx-4 mb-4 border-b border-hairline bg-cream/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1">
            <IconSearch
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search recipes..."
              className="w-full rounded-full border border-ink/15 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-ink focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="relative inline-flex h-10 min-w-[44px] items-center justify-center gap-1.5 rounded-full border border-ink/15 bg-white px-3 text-sm text-ink transition active:scale-95 hover:border-ink lg:hidden"
            aria-label="Filters"
          >
            <IconAdjustmentsHorizontal size={18} />
            {activeCount > 0 && (
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-ink px-1.5 text-[10px] font-medium text-cream">
                {activeCount}
              </span>
            )}
          </button>
        </form>
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:gap-6">
        {/* Desktop inline filter rail */}
        <aside className="hidden lg:col-span-3 lg:block">
          <div className="sticky top-24 rounded-2xl border border-hairline bg-white p-4">
            <FilterPanel {...filterPanelProps} />
          </div>
        </aside>

        {/* Results */}
        <div className="lg:col-span-9">
          {loading ? (
            <p className="py-8 text-center text-ink-mute">Searching...</p>
          ) : recipes.length === 0 ? (
            <p className="py-8 text-center text-ink-mute">
              No recipes found. Try different filters.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  id={recipe.id}
                  title={recipe.title}
                  prepTimeMin={recipe.prepTimeMin}
                  avgRating={recipe.avgRating}
                  photoUrl={recipe.photoUrl}
                  missingCount={recipe.missingCount}
                  allergens={recipe.allergens}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter bottom sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            aria-label="Close filters"
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-hairline bg-cream pb-safe shadow-2xl animate-slideup">
            <div className="sticky top-0 flex items-center justify-between border-b border-hairline bg-cream px-4 py-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                  Refine
                </div>
                <h2 className="font-serif text-xl leading-tight">Filters</h2>
              </div>
              <button
                onClick={() => setSheetOpen(false)}
                aria-label="Close"
                className="rounded-full p-2 text-ink-soft hover:bg-ink/5"
              >
                <IconX size={20} />
              </button>
            </div>
            <div className="px-4 py-4">
              <FilterPanel {...filterPanelProps} />
            </div>
            <div className="sticky bottom-0 border-t border-hairline bg-cream px-4 py-3">
              <button
                onClick={() => setSheetOpen(false)}
                className="w-full rounded-full bg-ink py-3 text-sm font-medium text-cream transition active:scale-[0.99]"
              >
                Show {recipes.length} recipes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
