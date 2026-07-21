import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import RecipeDetailClient from "./RecipeDetailClient";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipeId = parseInt(id, 10);
  if (isNaN(recipeId)) notFound();

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
        include: {
          ingredient: {
            include: {
              substitutionsFrom: {
                include: {
                  substituteIngredient: { select: { displayName: true } },
                },
              },
            },
          },
        },
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

  if (!recipe) notFound();

  const session = await auth();
  let isSaved = false;
  let userRating: number | null = null;
  let shoppingListIngredientIds: number[] = [];

  if (session?.user?.id) {
    const userId = parseInt(session.user.id, 10);
    const recipeIngredientIds = recipe.ingredients.map((i) => i.ingredient.id);
    const [save, rating, shoppingItems] = await Promise.all([
      prisma.userRecipeSave.findUnique({
        where: { userId_recipeId: { userId, recipeId } },
      }),
      prisma.recipeRating.findUnique({
        where: { recipeId_userId: { recipeId, userId } },
        select: { rating: true },
      }),
      prisma.shoppingListItem.findMany({
        where: {
          userId,
          isChecked: false,
          ingredientId: { in: recipeIngredientIds },
        },
        select: { ingredientId: true },
      }),
    ]);
    isSaved = !!save;
    userRating = rating?.rating ?? null;
    shoppingListIngredientIds = shoppingItems
      .map((i) => i.ingredientId)
      .filter((id): id is number => id !== null);
  }

  // Serialize for client
  const serialized = {
    ...recipe,
    createdAt: recipe.createdAt.toISOString(),
    updatedAt: recipe.updatedAt.toISOString(),
    lastEngagementAt: recipe.lastEngagementAt.toISOString(),
    creator: {
      id: recipe.creator.id,
      username: recipe.creator.username,
      avatarUrl: recipe.creator.profile?.avatarUrl ?? null,
    },
    ingredients: recipe.ingredients.map((i) => ({
      id: i.id,
      ingredientId: i.ingredient.id,
      ingredient: i.ingredient.displayName,
      name: i.ingredient.name,
      quantity: i.quantity,
      unit: i.unit,
      notes: i.notes,
      sortOrder: i.sortOrder,
      isPantryStaple: i.ingredient.isPantryStaple,
      substitutes: i.ingredient.substitutionsFrom.map((s) => ({
        name: s.substituteIngredient.displayName,
        flavorImpact: s.flavorImpact,
      })),
    })),
    steps: recipe.steps.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
    })),
    reviews: recipe.reviews.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    comments: recipe.comments.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      replies: c.replies.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    })),
  };

  return (
    <RecipeDetailClient
      recipe={serialized}
      isSaved={isSaved}
      userRating={userRating}
      currentUserId={session?.user?.id ? parseInt(session.user.id, 10) : null}
      shoppingListIngredientIds={shoppingListIngredientIds}
    />
  );
}
