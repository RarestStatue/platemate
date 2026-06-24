export const DIETARY_OPTIONS = [
  { key: "vegetarian", label: "Vegetarian" },
  { key: "vegan", label: "Vegan" },
  { key: "glutenFree", label: "Gluten-free" },
  { key: "halal", label: "Halal" },
  { key: "peanutFree", label: "Peanut-free" },
  { key: "dairyFree", label: "Dairy-free" },
] as const;

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "rating", label: "Highest rated" },
  { value: "prep_time", label: "Quickest" },
  { value: "popular", label: "Most popular" },
] as const;

export const PREP_TIME_FILTERS = [
  { value: 15, label: "Under 15 min" },
  { value: 30, label: "Under 30 min" },
  { value: 60, label: "Under 60 min" },
  { value: null, label: "Any" },
] as const;

export const PAGE_SIZE = 12;
