import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { recipeUploadSchema } from "@/lib/validators";
import { PAGE_SIZE } from "@/lib/constants";
import { Prisma } from "@prisma/client";
import { getAllergens } from "@/lib/allergens";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q")?.trim();
    // A comma-separated query ("egg, feta") is split into independent terms.
    // A recipe matches if ANY term matches (OR); matching more terms ranks it
    // higher via the summed relevance score. Empty segments are dropped, so a
    // query of only commas/whitespace is treated as no text search.
    const qTerms = q
      ? q.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
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

    // Text search (`q`) matches recipe titles, descriptions, ingredient names,
    // and tag names, ranked by relevance. Because relevance is a computed score
    // rather than an indexed column, that search runs as raw SQL below (the
    // `q` branch). The Prisma `where` built here only carries the plain filters
    // used when there is neither a text search nor an ingredient selection.

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

    // Secondary sort, expressed as SQL, shared by both raw-SQL branches below.
    // Mirrors the Prisma `orderBy` above.
    let secondarySort: Prisma.Sql;
    switch (sort) {
      case "rating":
        secondarySort = Prisma.sql`r.avg_rating DESC`;
        break;
      case "prep_time":
        secondarySort = Prisma.sql`r.prep_time_min ASC`;
        break;
      case "popular":
        secondarySort = Prisma.sql`r.save_count DESC`;
        break;
      default:
        secondarySort = Prisma.sql`r.created_at DESC`;
    }

    // Base non-text filters as SQL, shared by both raw-SQL branches below.
    const baseConditions: Prisma.Sql[] = [];
    if (maxPrepTime) {
      const parsed = parseInt(maxPrepTime, 10);
      if (!isNaN(parsed) && parsed > 0) {
        baseConditions.push(Prisma.sql`r.prep_time_min <= ${parsed}`);
      }
    }
    if (peanutFree) baseConditions.push(Prisma.sql`r.has_peanuts = false`);
    if (dairyFree) baseConditions.push(Prisma.sql`r.has_dairy = false`);
    if (glutenFree) baseConditions.push(Prisma.sql`r.has_gluten = false`);
    if (vegetarian) baseConditions.push(Prisma.sql`r.is_vegetarian = true`);
    if (vegan) baseConditions.push(Prisma.sql`r.is_vegan = true`);
    if (halal) baseConditions.push(Prisma.sql`r.is_halal = true`);

    // Text-search predicate: true when `q` matches the recipe title,
    // description, any tag name/displayName, or any ingredient name/displayName.
    // Correlated on r.id, so it composes with either raw query below.
    const qMatch = (pattern: string): Prisma.Sql => Prisma.sql`(
      r.title ILIKE ${pattern}
      OR r.description ILIKE ${pattern}
      OR EXISTS (
        SELECT 1 FROM recipe_tags rt
        JOIN tags t ON t.id = rt.tag_id
        WHERE rt.recipe_id = r.id
          AND (t.name ILIKE ${pattern} OR t.display_name ILIKE ${pattern})
      )
      OR EXISTS (
        SELECT 1 FROM recipe_ingredients ri2
        JOIN ingredients ing ON ing.id = ri2.ingredient_id
        WHERE ri2.recipe_id = r.id
          AND (ing.name ILIKE ${pattern} OR ing.display_name ILIKE ${pattern})
      )
    )`;

    // Per-term relevance contribution: title (3) > tag / ingredient (2) >
    // description (1). Summed across all query terms by qScore below.
    const termScore = (pattern: string): Prisma.Sql => Prisma.sql`(
      (CASE WHEN r.title ILIKE ${pattern} THEN 3 ELSE 0 END)
      + (CASE WHEN r.description ILIKE ${pattern} THEN 1 ELSE 0 END)
      + (CASE WHEN EXISTS (
          SELECT 1 FROM recipe_tags rt
          JOIN tags t ON t.id = rt.tag_id
          WHERE rt.recipe_id = r.id
            AND (t.name ILIKE ${pattern} OR t.display_name ILIKE ${pattern})
        ) THEN 2 ELSE 0 END)
      + (CASE WHEN EXISTS (
          SELECT 1 FROM recipe_ingredients ri
          JOIN ingredients i ON i.id = ri.ingredient_id
          WHERE ri.recipe_id = r.id
            AND (i.name ILIKE ${pattern} OR i.display_name ILIKE ${pattern})
        ) THEN 2 ELSE 0 END)
    )`;

    // ILIKE patterns, one per query term.
    const qPatterns = qTerms.map((t) => `%${t}%`);
    // Filter predicate: recipe qualifies if ANY term matches any field.
    const qWhere = (): Prisma.Sql =>
      Prisma.sql`(${Prisma.join(
        qPatterns.map((p) => qMatch(p)),
        " OR "
      )})`;
    // Relevance score: sum of every term's per-field contribution, so recipes
    // matching more terms (and stronger fields) sort first.
    const qScore = (): Prisma.Sql =>
      Prisma.join(
        qPatterns.map((p) => termScore(p)),
        " + "
      );

    // Ingredient-match prioritization: recipes matching more of the
    // selected ingredients rank above recipes matching fewer. Prisma's
    // relation orderBy only counts ALL related rows, not a filtered
    // subset, so the match count has to be computed with raw SQL.
    if (selectedIngredients.length > 0) {
      const normalizedNames = selectedIngredients.map((i) =>
        i.trim().toLowerCase().replace(/\s+/g, " ")
      );

      const conditions: Prisma.Sql[] = [...baseConditions];
      if (qTerms.length > 0) {
        conditions.push(qWhere());
      }

      const whereSql =
        conditions.length > 0 ? Prisma.join(conditions, " AND ") : Prisma.sql`TRUE`;

      // Cursor here is an offset (not a recipe id) since ordering is by a
      // computed match count rather than a stable indexed column.
      const offset = cursor ? parseInt(cursor, 10) : 0;
      if (cursor && (isNaN(offset) || offset < 0)) {
        return Response.json({ error: "Invalid cursor" }, { status: 400 });
      }

      const rows = await prisma.$queryRaw<
        Array<{
          id: number;
          title: string;
          prepTimeMin: number;
          avgRating: number;
          photoUrl: string | null;
          saveCount: number;
          creatorUsername: string;
          matchCount: number;
          hasPeanuts: boolean;
          hasTreeNuts: boolean;
          hasShellfish: boolean;
          hasDairy: boolean;
          hasGluten: boolean;
          hasEggs: boolean;
        }>
      >(Prisma.sql`
        SELECT
          r.id,
          r.title,
          r.prep_time_min AS "prepTimeMin",
          r.avg_rating AS "avgRating",
          r.photo_url AS "photoUrl",
          r.save_count AS "saveCount",
          u.username AS "creatorUsername",
          r.has_peanuts AS "hasPeanuts",
          r.has_tree_nuts AS "hasTreeNuts",
          r.has_shellfish AS "hasShellfish",
          r.has_dairy AS "hasDairy",
          r.has_gluten AS "hasGluten",
          r.has_eggs AS "hasEggs",
          COUNT(DISTINCT ri.ingredient_id)::int AS "matchCount"
        FROM recipes r
        JOIN users u ON u.id = r.creator_id
        LEFT JOIN recipe_ingredients ri ON ri.recipe_id = r.id
          AND ri.ingredient_id IN (
            SELECT id FROM ingredients WHERE name IN (${Prisma.join(normalizedNames)})
          )
        WHERE ${whereSql}
        GROUP BY r.id, u.username
        HAVING COUNT(DISTINCT ri.ingredient_id) > 0
        ORDER BY "matchCount" DESC, ${secondarySort}, r.id DESC
        LIMIT ${PAGE_SIZE + 1} OFFSET ${offset}
      `);

      const hasMore = rows.length > PAGE_SIZE;
      const items = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
      const nextCursor = hasMore ? String(offset + PAGE_SIZE) : null;

      return Response.json({
        recipes: items.map((r) => ({
          id: r.id,
          title: r.title,
          prepTimeMin: r.prepTimeMin,
          avgRating: r.avgRating,
          photoUrl: r.photoUrl,
          saveCount: r.saveCount,
          creatorUsername: r.creatorUsername,
          matchCount: r.matchCount,
          allergens: getAllergens(r),
        })),
        nextCursor,
      });
    }

    // Text search with relevance ranking: no ingredient selection, but a query
    // string is present. Matches title/description/tags/ingredients and orders
    // by a weighted relevance score — title (3) > tag / ingredient (2) >
    // description (1) — with the requested sort then id as tiebreakers.
    if (qTerms.length > 0) {
      const whereSql = Prisma.join([...baseConditions, qWhere()], " AND ");

      // Cursor is an offset (not a recipe id) since ordering is by a computed
      // relevance score rather than a stable indexed column.
      const offset = cursor ? parseInt(cursor, 10) : 0;
      if (cursor && (isNaN(offset) || offset < 0)) {
        return Response.json({ error: "Invalid cursor" }, { status: 400 });
      }

      const rows = await prisma.$queryRaw<
        Array<{
          id: number;
          title: string;
          prepTimeMin: number;
          avgRating: number;
          photoUrl: string | null;
          saveCount: number;
          creatorUsername: string;
          hasPeanuts: boolean;
          hasTreeNuts: boolean;
          hasShellfish: boolean;
          hasDairy: boolean;
          hasGluten: boolean;
          hasEggs: boolean;
        }>
      >(Prisma.sql`
        SELECT
          r.id,
          r.title,
          r.prep_time_min AS "prepTimeMin",
          r.avg_rating AS "avgRating",
          r.photo_url AS "photoUrl",
          r.save_count AS "saveCount",
          u.username AS "creatorUsername",
          r.has_peanuts AS "hasPeanuts",
          r.has_tree_nuts AS "hasTreeNuts",
          r.has_shellfish AS "hasShellfish",
          r.has_dairy AS "hasDairy",
          r.has_gluten AS "hasGluten",
          r.has_eggs AS "hasEggs"
        FROM recipes r
        JOIN users u ON u.id = r.creator_id
        WHERE ${whereSql}
        ORDER BY (${qScore()}) DESC, ${secondarySort}, r.id DESC
        LIMIT ${PAGE_SIZE + 1} OFFSET ${offset}
      `);

      const hasMore = rows.length > PAGE_SIZE;
      const items = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
      const nextCursor = hasMore ? String(offset + PAGE_SIZE) : null;

      return Response.json({
        recipes: items.map((r) => ({
          id: r.id,
          title: r.title,
          prepTimeMin: r.prepTimeMin,
          avgRating: r.avgRating,
          photoUrl: r.photoUrl,
          saveCount: r.saveCount,
          creatorUsername: r.creatorUsername,
          allergens: getAllergens(r),
        })),
        nextCursor,
      });
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
        hasPeanuts: true,
        hasTreeNuts: true,
        hasShellfish: true,
        hasDairy: true,
        hasGluten: true,
        hasEggs: true,
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
        allergens: getAllergens(r),
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
