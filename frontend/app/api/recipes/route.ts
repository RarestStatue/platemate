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
    const selectedIngredients = searchParams.getAll("ingredient");
    const glutenFree = searchParams.get("glutenFree") === "true";
    const peanutFree = searchParams.get("peanutFree") === "true";
    const dairyFree = searchParams.get("dairyFree") === "true";
    const vegetarian = searchParams.get("vegetarian") === "true";
    const vegan = searchParams.get("vegan") === "true";
    const halal = searchParams.get("halal") === "true";

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

    // Ingredient filters
    if (selectedIngredients.length > 0) {
      where.ingredients = {
        some: {
          ingredient: {
            name: {
              in: selectedIngredients.map((i) =>
                i.trim().toLowerCase().replace(/\s+/g, " ")
              ),
            },
          },
        },
      };
    }

    // Dietary filters: exclude recipes with allergens
    if (peanutFree) where.hasPeanuts = false;
    if (dairyFree) where.hasDairy = false;
    if (glutenFree) where.hasGluten = false;

    // Dietary filters: require positive recipe attribute
    if (vegetarian) where.isVegetarian = true;
    if (vegan) where.isVegan = true;
    if (halal) where.isHalal = true;

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

    const cursorId = cursor ? parseInt(cursor, 10) : null;
    if (cursor && (cursorId === null || isNaN(cursorId))) {
      return Response.json({ error: "Invalid cursor" }, { status: 400 });
    }

    const recipes = await prisma.recipe.findMany({
      where,
      orderBy,
      take: PAGE_SIZE + 1,
      ...(cursorId !== null ? { skip: 1, cursor: { id: cursorId } } : {}),
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

    const {
      title,
      description,
      prepTimeMin,
      servings,
      ingredients,
      steps,
      tags,
      photoUrl,
      hasPeanuts,
      hasTreeNuts,
      hasShellfish,
      hasDairy,
      hasGluten,
      hasEggs,
      isVegetarian,
      isVegan,
      isHalal,
    } = parsed.data;
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
      // Normalize and upsert ingredients first. Interactive transactions do
      // not support concurrent operations, so this must be sequential. Also
      // merge repeated ingredient names in the same payload into a single
      // row: RecipeIngredient has a @@unique([recipeId, ingredientId])
      // constraint, so two rows with the same ingredient would violate it.
      const byIngredientName = new Map<
        string,
        { ingredientId: number; quantity: number; unit: string; notes: string | null }
      >();
      for (const ing of ingredients) {
        const normalizedName = ing.ingredient
          .trim()
          .toLowerCase()
          .replace(/\s+/g, " ");

        const existing = byIngredientName.get(normalizedName);
        if (existing) {
          existing.quantity += ing.quantity;
          continue;
        }

        const ingredient = await tx.ingredient.upsert({
          where: {
            name: normalizedName,
          },
          update: {},
          create: {
            name: normalizedName,
            displayName: ing.ingredient.trim(),
            defaultUnit: ing.unit,
          },
        });

        byIngredientName.set(normalizedName, {
          ingredientId: ingredient.id,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes || null,
        });
      }
      const normalizedIngredients = Array.from(byIngredientName.values());

      // Normalize and upsert tags, same pattern as ingredients above.
      const tagIds = new Map<string, number>();
      for (const rawTag of tags) {
        const normalizedName = rawTag.trim().toLowerCase().replace(/\s+/g, " ");
        if (!normalizedName || tagIds.has(normalizedName)) continue;

        const tag = await tx.tag.upsert({
          where: { name: normalizedName },
          update: {},
          create: { name: normalizedName, displayName: rawTag.trim() },
        });
        tagIds.set(normalizedName, tag.id);
      }

      const newRecipe = await tx.recipe.create({
        data: {
          creatorId: userId,
          title,
          description: description || null,
          prepTimeMin,
          servings,
          photoUrl: photoUrl || null,

          hasPeanuts,
          hasTreeNuts,
          hasShellfish,
          hasDairy,
          hasGluten,
          hasEggs,
          isVegetarian,
          isVegan,
          isHalal,

          ingredients: {
            create: normalizedIngredients.map((ing, i) => ({
              ingredientId: ing.ingredientId,
              quantity: ing.quantity,
              unit: ing.unit,
              notes: ing.notes,
              sortOrder: i + 1,
            })),
          },

          steps: {
            create: steps.map((step, i) => ({
              stepNumber: i + 1,
              instruction: step.instruction,
              durationMin: step.durationMin || null,
            })),
          },

          tags: {
            create: Array.from(tagIds.values()).map((tagId) => ({ tagId })),
          },
        },

        select: {
          id: true,
          title: true,
        },
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
