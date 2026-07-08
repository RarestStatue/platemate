export interface AllergenFlags {
  hasPeanuts: boolean;
  hasTreeNuts: boolean;
  hasShellfish: boolean;
  hasDairy: boolean;
  hasGluten: boolean;
  hasEggs: boolean;
}

export function getAllergens(recipe: AllergenFlags): string[] {
  const allergens: string[] = [];
  if (recipe.hasPeanuts) allergens.push("Peanuts");
  if (recipe.hasTreeNuts) allergens.push("Tree nuts");
  if (recipe.hasShellfish) allergens.push("Shellfish");
  if (recipe.hasDairy) allergens.push("Dairy");
  if (recipe.hasGluten) allergens.push("Gluten");
  if (recipe.hasEggs) allergens.push("Eggs");
  return allergens;
}
