import { useEffect, useState } from "react";
import type { WeeklyRecipe } from "@/lib/landing-recipes";

/**
 * Starts on the caller's hardcoded fallback (SSR-safe, no empty-state flash),
 * swaps to DB data only on a successful non-empty fetch, and stays on the
 * fallback forever on any error so the landing page never breaks.
 */
export function useWeeklyRecipes(fallback: WeeklyRecipe[]) {
  const [recipes, setRecipes] = useState<WeeklyRecipe[]>(fallback);
  const [source, setSource] = useState<"fallback" | "db">("fallback");

  useEffect(() => {
    let alive = true;
    fetch("/api/landing/weekly")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (alive && Array.isArray(d.recipes) && d.recipes.length > 0) {
          setRecipes(d.recipes);
          setSource("db");
        }
      })
      .catch(() => {
        // keep fallback
      });
    return () => {
      alive = false;
    };
  }, []);

  return { recipes, source };
}
