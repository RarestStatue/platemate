import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { recipeUploadSchema } from "@/lib/validators";
import { PAGE_SIZE } from "@/lib/constants";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q")?.trim();
    const cursor = searchParams.get("cursor");
    const sort = searchParams.get("sort") || "newest";
    const maxPrepTime = searchParams.get("maxPrepTime");
    const vegetarian = searchParams.get("vegetarian") === "true";
    const vegan = searchParams.get("vegan") === "true";
    const glutenFree = searchParams.get("glutenFree") === "true";
    const halal = searchParams.get("halal") === "true";
    const peanutFree = searchParams.get("peanutFree") === "true";
    const dairyFree = searchParams.get("dairyFree") === "true";

    // Build WHERE clause
    const where: Prisma.RecipeWhereInput = {};

    // Full-text search using Prisma raw filter for ts_vector
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    if (maxPrepTime) {
      const parsed = parseInt(maxPrepTime, 10);
      if (!isNaN(parsed) && parsed > 0) {
        where.prepTimeMin = { lte: parsed };
      }
    }

    // Dietary filters: exclude recipes with allergens
    if (peanutFree) where.hasPeanuts = false;
    if (dairyFree) where.hasDairy = false;
    if (glutenFree) where.hasGluten = false;

    // Sort: always include a secondary `id` sort so cursor-based pagination is
    // stable and unambiguous regardless of which field is the primary sort.
    let orderBy: Prisma.RecipeOrderByWithRelationInput[];
    switch (sort) {
      case "rating":
        orderBy = [{ avgRating: "desc" }, { id: "desc" }];
        break;
      case "prep_time":
        orderBy = [{ prepTimeMin: "asc" }, { id: "desc" }];
        break;
      case "popular":
        orderBy = [{ saveCount: "desc" }, { id: "desc" }];
        break;
      default:
        orderBy = [{ createdAt: "desc" }, { id: "desc" }];
    }

    const recipes = await prisma.recipe.findMany({
      where,
      orderBy,
      take: PAGE_SIZE + 1,
      ...(cursor ? { skip: 1, cursor: { id: parseInt(cursor, 10) } } : {}),
      select: {
        id: true,
        title: true,
        prepTimeMin: true,
        avgRating: true,
        photoUrl: true,
        saveCount: true,
        creator: { select: { username: true } },
      },
    });

    const hasMore = recipes.length > PAGE_SIZE;
    const items = hasMore ? recipes.slice(0, PAGE_SIZE) : recipes;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return Response.json({
      recipes: items.map((r) => ({
        id: r.id,
        title: r.title,
        prepTimeMin: r.prepTimeMin,
        avgRating: r.avgRating,
        photoUrl: r.photoUrl,
        saveCount: r.saveCount,
        creatorUsername: r.creator.username,
      })),
      nextCursor,
    });
  } catch (error) {
    console.error("Recipe search error:", error);
    return Response.json({ error: "Failed to fetch recipes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = recipeUploadSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, description, prepTimeMin, servings, ingredients, steps } =
      parsed.data;
    const userId = parseInt(session.user.id, 10);

    // Check for duplicates by title similarity
    const duplicates = await prisma.recipe.findMany({
      where: {
        title: { contains: title, mode: "insensitive" },
        creatorId: { not: userId },
      },
      take: 3,
      select: { id: true, title: true, creator: { select: { username: true } } },
    });

    // Create recipe in transaction
    const recipe = await prisma.$transaction(async (tx) => {
      const newRecipe = await tx.recipe.create({
        data: {
          creatorId: userId,
          title,
          description: description || null,
          prepTimeMin,
          servings,
          ingredients: {
            create: ingredients.map((ing, i) => ({
              ingredient: ing.ingredient,
              quantity: ing.quantity,
              unit: ing.unit,
              notes: ing.notes || null,
              sortOrder: i,
            })),
          },
          steps: {
            create: steps.map((step, i) => ({
              stepNumber: i + 1,
              instruction: step.instruction,
              durationMin: step.durationMin || null,
            })),
          },
        },
        select: { id: true, title: true },
      });

      // Increment creator's recipe count
      await tx.userProfile.updateMany({
        where: { userId },
        data: { recipeCount: { increment: 1 } },
      });

      // If duplicates found, flag them
      if (duplicates.length > 0) {
        await tx.recipeDuplicateFlag.createMany({
          data: duplicates.map((dup) => ({
            originalRecipeId: dup.id,
            candidateRecipeId: newRecipe.id,
            similarityScore: 0.5,
            flaggedReason: `Similar title: "${dup.title}"`,
          })),
        });
      }

      return newRecipe;
    });

    return Response.json(
      {
        recipe: { id: recipe.id, title: recipe.title },
        duplicateWarnings: duplicates.map((d) => ({
          id: d.id,
          title: d.title,
          creator: d.creator.username,
        })),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Recipe creation error:", error);
    return Response.json({ error: "Failed to create recipe" }, { status: 500 });
  }
}
