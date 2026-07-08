import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getAllergens } from "@/lib/allergens";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    const saves = await prisma.userRecipeSave.findMany({
      where: { userId },
      orderBy: { savedAt: "desc" },
      include: {
        recipe: {
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
        },
      },
    });

    return Response.json({
      recipes: saves.map((s) => ({
        id: s.recipe.id,
        title: s.recipe.title,
        prepTimeMin: s.recipe.prepTimeMin,
        avgRating: s.recipe.avgRating,
        photoUrl: s.recipe.photoUrl,
        saveCount: s.recipe.saveCount,
        creatorUsername: s.recipe.creator.username,
        savedAt: s.savedAt,
        allergens: getAllergens(s.recipe),
      })),
    });
  } catch (error) {
    console.error("Saved recipes fetch error:", error);
    return Response.json({ error: "Failed to fetch saved" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { recipeId } = await request.json();
    if (!recipeId || typeof recipeId !== "number") {
      return Response.json({ error: "Invalid recipe ID" }, { status: 400 });
    }

    const userId = parseInt(session.user.id, 10);

    // Check recipe exists
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true },
    });
    if (!recipe) {
      return Response.json({ error: "Recipe not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.userRecipeSave.create({
        data: { userId, recipeId },
      });
      await tx.recipe.update({
        where: { id: recipeId },
        data: {
          saveCount: { increment: 1 },
          lastEngagementAt: new Date(),
        },
      });
    });

    return Response.json({ saved: true }, { status: 201 });
  } catch (error) {
    // Handle duplicate save gracefully
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return Response.json({ saved: true });
    }
    console.error("Save recipe error:", error);
    return Response.json({ error: "Failed to save recipe" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { recipeId } = await request.json();
    if (!recipeId || typeof recipeId !== "number") {
      return Response.json({ error: "Invalid recipe ID" }, { status: 400 });
    }

    const userId = parseInt(session.user.id, 10);

    await prisma.$transaction(async (tx) => {
      const deleted = await tx.userRecipeSave.deleteMany({
        where: { userId, recipeId },
      });
      if (deleted.count > 0) {
        await tx.recipe.update({
          where: { id: recipeId },
          data: {
            saveCount: { decrement: 1 },
            lastEngagementAt: new Date(),
          },
        });
      }
    });

    return Response.json({ saved: false });
  } catch (error) {
    console.error("Unsave recipe error:", error);
    return Response.json({ error: "Failed to unsave recipe" }, { status: 500 });
  }
}
