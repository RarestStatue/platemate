/**
 * Attach each reviewer's star rating to their review.
 *
 * Ratings and reviews are separate tables keyed by (recipeId, userId), so a
 * review can exist without a rating. Missing ratings become `null` rather than
 * dropping the review.
 */
export function attachRatings<R extends { recipeId: number }>(
  reviews: R[],
  ratings: { recipeId: number; rating: number }[]
): (R & { rating: number | null })[] {
  const byRecipe = new Map(ratings.map((r) => [r.recipeId, r.rating]));
  return reviews.map((r) => ({ ...r, rating: byRecipe.get(r.recipeId) ?? null }));
}
