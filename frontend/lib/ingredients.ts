export const normalizeIngredientName = (s: string) =>
  s.trim().toLowerCase().replace(/\s+/g, " ");
