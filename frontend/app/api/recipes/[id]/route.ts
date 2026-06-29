import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recipeId = parseInt(id, 10);
    if (isNaN(recipeId)) {
      return Response.json({ error: "Invalid recipe ID" }, { status: 400 });
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            profile: { select: { avatarUrl: true } },
          },
        },
        ingredients: {
          orderBy: { sortOrder: "asc" },
          include: { ingredient: true },
        },
        steps: { orderBy: { stepNumber: "asc" } },
        reviews: {
          include: {
            user: { select: { id: true, username: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        comments: {
          where: { parentCommentId: null },
          include: {
            user: { select: { id: true, username: true } },
            replies: {
              include: {
                user: { select: { id: true, username: true } },
              },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!recipe) {
      return Response.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Check if current user has saved this recipe
    const session = await auth();
    let isSaved = false;
    let userRating: number | null = null;

    if (session?.user?.id) {
      const userId = parseInt(session.user.id, 10);
      const [save, rating] = await Promise.all([
        prisma.userRecipeSave.findUnique({
          where: { userId_recipeId: { userId, recipeId } },
        }),
        prisma.recipeRating.findUnique({
          where: { recipeId_userId: { recipeId, userId } },
          select: { rating: true },
        }),
      ]);
      isSaved = !!save;
      userRating = rating?.rating ?? null;
    }

    return Response.json({
      ...recipe,
      creator: {
        id: recipe.creator.id,
        username: recipe.creator.username,
        avatarUrl: recipe.creator.profile?.avatarUrl ?? null,
      },
      ingredients: recipe.ingredients.map((i) => ({
        id: i.id,
        ingredient: i.ingredient.displayName,
        quantity: i.quantity,
        unit: i.unit,
        notes: i.notes,
        sortOrder: i.sortOrder,
      })),
      isSaved,
      userRating,
    });
  } catch (error) {
    console.error("Recipe fetch error:", error);
    return Response.json({ error: "Failed to fetch recipe" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const recipeId = parseInt(id, 10);
    if (isNaN(recipeId)) {
      return Response.json({ error: "Invalid recipe ID" }, { status: 400 });
    }

    // SECURITY: Check ownership
    const existing = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { creatorId: true },
    });

    if (!existing) {
      return Response.json({ error: "Recipe not found" }, { status: 404 });
    }

    if (existing.creatorId !== parseInt(session.user.id, 10)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, prepTimeMin, servings } = body;

    const updated = await prisma.recipe.update({
      where: { id: recipeId },
      data: {
        ...(title && { title: String(title).slice(0, 200) }),
        ...(description !== undefined && {
          description: description ? String(description).slice(0, 2000) : null,
        }),
        ...(prepTimeMin !== undefined && {
          prepTimeMin: Math.max(0, Math.min(1440, Number(prepTimeMin))),
        }),
        ...(servings !== undefined && {
          servings: Math.max(1, Math.min(100, Number(servings))),
        }),
      },
      select: { id: true, title: true },
    });

    return Response.json(updated);
  } catch (error) {
    console.error("Recipe update error:", error);
    return Response.json({ error: "Failed to update recipe" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const recipeId = parseInt(id, 10);
    if (isNaN(recipeId)) {
      return Response.json({ error: "Invalid recipe ID" }, { status: 400 });
    }

    const existing = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { creatorId: true },
    });

    if (!existing) {
      return Response.json({ error: "Recipe not found" }, { status: 404 });
    }

    const userId = parseInt(session.user.id, 10);
    if (existing.creatorId !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.recipe.delete({ where: { id: recipeId } });
      await tx.userProfile.updateMany({
        where: { userId },
        data: { recipeCount: { decrement: 1 } },
      });
    });

    return Response.json({ message: "Recipe deleted" });
  } catch (error) {
    console.error("Recipe delete error:", error);
    return Response.json({ error: "Failed to delete recipe" }, { status: 500 });
  }
}
