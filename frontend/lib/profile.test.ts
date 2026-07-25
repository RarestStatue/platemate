import { describe, it, expect } from "vitest";
import { attachRatings } from "./profile";

describe("attachRatings", () => {
  it("attaches the matching rating to a review", () => {
    const result = attachRatings(
      [{ recipeId: 1, text: "great" }],
      [{ recipeId: 1, rating: 4 }]
    );
    expect(result).toEqual([{ recipeId: 1, text: "great", rating: 4 }]);
  });

  it("uses null when the review has no matching rating", () => {
    const result = attachRatings(
      [{ recipeId: 1, text: "great" }],
      [{ recipeId: 2, rating: 5 }]
    );
    expect(result[0].rating).toBeNull();
  });

  it("returns all null and preserves order and length with no ratings", () => {
    const reviews = [
      { recipeId: 3, text: "c" },
      { recipeId: 1, text: "a" },
      { recipeId: 2, text: "b" },
    ];
    const result = attachRatings(reviews, []);
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.text)).toEqual(["c", "a", "b"]);
    expect(result.every((r) => r.rating === null)).toBe(true);
  });
});
