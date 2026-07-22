import { NextRequest, after } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { recipeUpdateSchema } from "@/lib/validators";

/** Bump the lifetime counter and today's bucket, which trending sums over its window. */
async function recordView(recipeId: number) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  await prisma.$transaction([
    prisma.recipe.update({
      where: { id: recipeId },
      data: { viewCount: { increment: 1 } },
      select: { id: true },
    }),
    prisma.recipeViewDaily.upsert({
      where: { recipeId_day: { recipeId, day: today } },
      create: { recipeId, day: today, count: 1 },
      update: { count: { increment: 1 } },
    }),
  ]);
}

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
            deletedAt: true,
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
          orderBy: { createdAt: "asc" },
          take: 50,
        },
      },
    });

    // SECURITY: hide recipes belonging to soft-deleted users, same as their profile
    if (!recipe || recipe.creator.deletedAt) {
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

    // Runs after the response is sent, but is still awaited by the runtime, so
    // it can't be cut short the way a bare floating promise can.
    after(() =>
      recordView(recipeId).catch((error) =>
        console.error("View count update failed:", error)
      )
    );

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
    const parsed = recipeUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.recipe.update({
      where: { id: recipeId },
      data: parsed.data,
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
