import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  recipeUploadSchema,
  recipeUpdateSchema,
  reviewSchema,
  commentSchema,
} from "./validators";

describe("loginSchema", () => {
  it("accepts a valid email/password", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", password: "x" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "x" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const base = {
    username: "test_user",
    email: "test@example.com",
    password: "password123",
    confirmPassword: "password123",
  };

  it("accepts a valid registration", () => {
    expect(registerSchema.safeParse(base).success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({ ...base, confirmPassword: "different" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword).toBeTruthy();
    }
  });

  it("rejects usernames with invalid characters", () => {
    const result = registerSchema.safeParse({ ...base, username: "bad username!" });
    expect(result.success).toBe(false);
  });

  it("rejects passwords shorter than 8 characters", () => {
    const result = registerSchema.safeParse({ ...base, password: "short", confirmPassword: "short" });
    expect(result.success).toBe(false);
  });
});

describe("recipeUploadSchema", () => {
  const base = {
    title: "Pasta",
    prepTimeMin: 30,
    servings: 4,
    ingredients: [{ ingredient: "Flour", quantity: 2, unit: "cups" }],
    steps: [{ instruction: "Mix it all together" }],
  };

  it("accepts a valid recipe", () => {
    expect(recipeUploadSchema.safeParse(base).success).toBe(true);
  });

  it("rejects prep time over 1440 minutes", () => {
    const result = recipeUploadSchema.safeParse({ ...base, prepTimeMin: 1441 });
    expect(result.success).toBe(false);
  });

  it("rejects negative prep time", () => {
    const result = recipeUploadSchema.safeParse({ ...base, prepTimeMin: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects recipes with no ingredients", () => {
    const result = recipeUploadSchema.safeParse({ ...base, ingredients: [] });
    expect(result.success).toBe(false);
  });

  it("rejects recipes with no steps", () => {
    const result = recipeUploadSchema.safeParse({ ...base, steps: [] });
    expect(result.success).toBe(false);
  });
});

describe("recipeUpdateSchema", () => {
  it("accepts a partial update", () => {
    expect(recipeUpdateSchema.safeParse({ title: "New title" }).success).toBe(true);
  });

  it("accepts an empty update", () => {
    expect(recipeUpdateSchema.safeParse({}).success).toBe(true);
  });

  it("rejects an out-of-range prep time even when partial", () => {
    const result = recipeUpdateSchema.safeParse({ prepTimeMin: 99999 });
    expect(result.success).toBe(false);
  });
});

describe("reviewSchema", () => {
  it("accepts a valid review", () => {
    expect(reviewSchema.safeParse({ text: "Great!", rating: 5 }).success).toBe(true);
  });

  it("rejects a rating outside 1-5", () => {
    expect(reviewSchema.safeParse({ text: "Great!", rating: 6 }).success).toBe(false);
  });
});

describe("commentSchema", () => {
  it("accepts a valid comment", () => {
    expect(commentSchema.safeParse({ text: "Nice recipe" }).success).toBe(true);
  });

  it("rejects an empty comment", () => {
    expect(commentSchema.safeParse({ text: "" }).success).toBe(false);
  });
});
