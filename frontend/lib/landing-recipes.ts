export type Variant = "eggs" | "greens" | "citrus" | "grain" | "beans" | "cheese";

export interface WeeklyRecipe {
  id: number;
  title: string;
  prepTimeMin: number;
  time: string;
  photoUrl: string | null;
  hint: string;
  variant: Variant;
  ingredients: string[];
}

const DEFAULT_HINTS = [
  "straight from the fridge.",
  "what you had, made dinner.",
  "no receipts, just plates.",
  "the fridge-door special.",
  "twenty minutes, tops.",
  "one pan, zero fuss.",
];

const VARIANTS: Variant[] = ["eggs", "greens", "citrus", "grain", "beans", "cheese"];

export function pickVariant(r: {
  id: number;
  hasEggs?: boolean;
  ingredients: string[];
}): Variant {
  const hay = r.ingredients.join(" ").toLowerCase();
  if (r.hasEggs || hay.includes("egg")) return "eggs";
  if (hay.includes("lemon") || hay.includes("citrus")) return "citrus";
  if (hay.includes("cheese") || hay.includes("cheddar") || hay.includes("feta")) return "cheese";
  if (hay.includes("bean") || hay.includes("lentil")) return "beans";
  if (hay.includes("spinach") || hay.includes("green") || hay.includes("herb")) return "greens";
  if (hay.includes("rice") || hay.includes("potato") || hay.includes("grain")) return "grain";
  return VARIANTS[r.id % VARIANTS.length];
}

function deriveHint(id: number, description: string | null | undefined): string {
  const trimmed = description?.trim();
  if (trimmed) {
    return trimmed.length > 60 ? `${trimmed.slice(0, 57)}…` : trimmed;
  }
  return DEFAULT_HINTS[id % DEFAULT_HINTS.length];
}

export interface WeeklyRecipeRow {
  id: number;
  title: string;
  prepTimeMin: number;
  description: string | null;
  photoUrl: string | null;
  isVegetarian?: boolean;
  isVegan?: boolean;
  hasDairy?: boolean;
  hasEggs?: boolean;
}

export function mapToWeeklyRecipe(
  row: WeeklyRecipeRow,
  ingredients: string[]
): WeeklyRecipe {
  const deduped = Array.from(new Set(ingredients)).slice(0, 6);
  return {
    id: row.id,
    title: row.title,
    prepTimeMin: row.prepTimeMin,
    time: `${row.prepTimeMin} min`,
    photoUrl: row.photoUrl,
    hint: deriveHint(row.id, row.description),
    variant: pickVariant({ id: row.id, hasEggs: row.hasEggs, ingredients: deduped }),
    ingredients: deduped,
  };
}
