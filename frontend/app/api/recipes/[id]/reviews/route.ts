import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { reviewSchema } from "@/lib/validators";

export async function POST(
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

    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id, 10);
    const { text, rating } = parsed.data;

    // Create review and rating in transaction, update counters
    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.recipeReview.create({
        data: { recipeId, userId, text },
        select: { id: true, text: true, createdAt: true },
      });

      // Upsert rating
      await tx.recipeRating.upsert({
        where: { recipeId_userId: { recipeId, userId } },
        create: { recipeId, userId, rating },
        update: { rating },
      });

      // Recalculate average rating
      const agg = await tx.recipeRating.aggregate({
        where: { recipeId },
        _avg: { rating: true },
        _count: true,
      });

      await tx.recipe.update({
        where: { id: recipeId },
        data: {
          avgRating: agg._avg.rating ?? 0,
          ratingCount: agg._count,
          reviewCount: { increment: 1 },
          lastEngagementAt: new Date(),
        },
      });

      // Update user profile review count
      await tx.userProfile.updateMany({
        where: { userId },
        data: { reviewCount: { increment: 1 } },
      });

      return newReview;
    });

    return Response.json(review, { status: 201 });
  } catch (error) {
    // Handle duplicate review
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return Response.json(
        { error: "You have already reviewed this recipe" },
        { status: 409 }
      );
    }
    console.error("Review creation error:", error);
    return Response.json({ error: "Failed to create review" }, { status: 500 });
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

    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id, 10);
    const { text, rating } = parsed.data;

    const existing = await prisma.recipeReview.findUnique({
      where: { recipeId_userId: { recipeId, userId } },
      select: { id: true },
    });
    if (!existing) {
      return Response.json({ error: "Review not found" }, { status: 404 });
    }

    const review = await prisma.$transaction(async (tx) => {
      const updated = await tx.recipeReview.update({
        where: { recipeId_userId: { recipeId, userId } },
        data: { text },
        select: { id: true, text: true, createdAt: true, updatedAt: true },
      });

      await tx.recipeRating.upsert({
        where: { recipeId_userId: { recipeId, userId } },
        create: { recipeId, userId, rating },
        update: { rating },
      });

      const agg = await tx.recipeRating.aggregate({
        where: { recipeId },
        _avg: { rating: true },
        _count: true,
      });

      await tx.recipe.update({
        where: { id: recipeId },
        data: {
          avgRating: agg._avg.rating ?? 0,
          ratingCount: agg._count,
          lastEngagementAt: new Date(),
        },
      });

      return updated;
    });

    return Response.json(review, { status: 200 });
  } catch (error) {
    console.error("Review update error:", error);
    return Response.json({ error: "Failed to update review" }, { status: 500 });
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

    const userId = parseInt(session.user.id, 10);

    const existing = await prisma.recipeReview.findUnique({
      where: { recipeId_userId: { recipeId, userId } },
      select: { id: true },
    });
    if (!existing) {
      return Response.json({ error: "Review not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.recipeReview.delete({
        where: { recipeId_userId: { recipeId, userId } },
      });
      await tx.recipeRating.deleteMany({ where: { recipeId, userId } });

      const agg = await tx.recipeRating.aggregate({
        where: { recipeId },
        _avg: { rating: true },
        _count: true,
      });

      await tx.recipe.update({
        where: { id: recipeId },
        data: {
          avgRating: agg._avg.rating ?? 0,
          ratingCount: agg._count,
          reviewCount: { decrement: 1 },
          lastEngagementAt: new Date(),
        },
      });

      await tx.userProfile.updateMany({
        where: { userId },
        data: { reviewCount: { decrement: 1 } },
      });
    });

    return Response.json({ message: "Review deleted" }, { status: 200 });
  } catch (error) {
    console.error("Review deletion error:", error);
    return Response.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
