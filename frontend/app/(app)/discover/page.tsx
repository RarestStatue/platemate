"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { IconSearch } from "@tabler/icons-react";
import RecipeCard from "@/components/common/RecipeCard";
import type { RecipeCardData } from "@/lib/types";

export default function DiscoverPage() {
  const [recipes, setRecipes] = useState<RecipeCardData[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset and load first page whenever the search query changes
  useEffect(() => {
    async function fetchRecipes() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ sort: "newest" });
        if (query.trim()) params.set("q", query.trim());
        const res = await fetch(`/api/recipes?${params.toString()}`);
        const data = await res.json();
        setRecipes(data.recipes || []);
        setCursor(data.nextCursor ?? null);
        setHasMore(Boolean(data.nextCursor));
      } catch {
        setRecipes([]);
        setCursor(null);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    }
    fetchRecipes();
  }, [query]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore || !cursor) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ sort: "newest", cursor });
      if (query.trim()) params.set("q", query.trim());
      const res = await fetch(`/api/recipes?${params.toString()}`);
      const data = await res.json();
      setRecipes((prev) => [...prev, ...(data.recipes || [])]);
      setCursor(data.nextCursor ?? null);
      setHasMore(Boolean(data.nextCursor));
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, hasMore, loading, loadingMore, query]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

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
        <>
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
          <div ref={sentinelRef} className="h-1" />
          {loadingMore && (
            <p className="text-center text-muted py-4">Loading more...</p>
          )}
        </>
      )}
    </div>
  );
}
