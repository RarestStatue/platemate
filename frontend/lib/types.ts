export interface SessionUser {
  id: number;
  email: string;
  username: string;
  userRole: string;
}

export interface RecipeCardData {
  id: number;
  title: string;
  prepTimeMin: number;
  avgRating: number;
  photoUrl: string | null;
  saveCount: number;
  creatorUsername: string;
  missingCount?: number;
  isSafe?: boolean;
  isPopular?: boolean;
}

export interface RecipeDetail {
  id: number;
  title: string;
  description: string | null;
  prepTimeMin: number;
  servings: number;
  photoUrl: string | null;
  avgRating: number;
  reviewCount: number;
  ratingCount: number;
  commentCount: number;
  saveCount: number;
  hasPeanuts: boolean;
  hasTreeNuts: boolean;
  hasShellfish: boolean;
  hasDairy: boolean;
  hasGluten: boolean;
  hasEggs: boolean;
  createdAt: string;
  creator: {
    id: number;
    username: string;
    avatarUrl: string | null;
  };
  ingredients: IngredientData[];
  steps: StepData[];
}

export interface IngredientData {
  id: number;
  ingredient: string;
  quantity: number;
  unit: string;
  notes: string | null;
  sortOrder: number;
}

export interface StepData {
  id: number;
  stepNumber: number;
  instruction: string;
  durationMin: number | null;
}

export interface ReviewData {
  id: number;
  text: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
  };
  rating?: number;
}

export interface CommentData {
  id: number;
  text: string;
  createdAt: string;
  parentCommentId: number | null;
  user: {
    id: number;
    username: string;
  };
  replies?: CommentData[];
}

export interface ProfileData {
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
  recipeCount: number;
  reviewCount: number;
  createdAt: string;
}

export interface DietaryFilters {
  vegetarian?: boolean;
  vegan?: boolean;
  glutenFree?: boolean;
  halal?: boolean;
  peanutFree?: boolean;
  dairyFree?: boolean;
}

export type SortOption = "newest" | "rating" | "prep_time" | "popular";
export type PrepTimeFilter = 15 | 30 | 60 | null;
