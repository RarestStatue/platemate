import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(1, "Username is required")
      .max(30, "Username must be 30 characters or less")
      .regex(
        /^[a-zA-Z0-9_.-]+$/,
        "Username can only contain letters, numbers, underscores, dots, and hyphens"
      ),
    email: z.email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be 128 characters or less"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const recipeUploadSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .max(2000, "Description must be 2000 characters or less")
    .optional(),
  prepTimeMin: z
    .number()
    .int()
    .min(0, "Prep time must be 0 or more")
    .max(1440, "Prep time must be 24 hours or less"),
  servings: z
    .number()
    .int()
    .min(1, "Must have at least 1 serving")
    .max(100, "Servings must be 100 or less"),
  ingredients: z
    .array(
      z.object({
        ingredient: z.string().min(1, "Ingredient name is required"),
        quantity: z.number().positive("Quantity must be positive"),
        unit: z.string().min(1, "Unit is required"),
        notes: z.string().optional(),
      })
    )
    .min(1, "At least one ingredient is required"),
  steps: z
    .array(
      z.object({
        instruction: z.string().min(1, "Instruction is required"),
        durationMin: z.number().int().min(0).optional(),
      })
    )
    .min(1, "At least one step is required"),
});

export const recipeUpdateSchema = recipeUploadSchema
  .pick({ title: true, description: true, prepTimeMin: true, servings: true })
  .partial();

export const reviewSchema = z.object({
  text: z
    .string()
    .min(1, "Review text is required")
    .max(5000, "Review must be 5000 characters or less"),
  rating: z.number().int().min(1).max(5),
});

export const commentSchema = z.object({
  text: z
    .string()
    .min(1, "Comment is required")
    .max(2000, "Comment must be 2000 characters or less"),
  parentCommentId: z.number().int().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RecipeUploadInput = z.infer<typeof recipeUploadSchema>;
export type RecipeUpdateInput = z.infer<typeof recipeUpdateSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
