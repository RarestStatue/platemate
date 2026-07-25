import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

async function resolve(
  params: Promise<{ id: string; commentId: string }>
): Promise<{ recipeId: number; commentId: number } | null> {
  const { id, commentId } = await params;
  const recipeId = parseInt(id, 10);
  const cid = parseInt(commentId, 10);
  if (isNaN(recipeId) || isNaN(cid)) return null;
  return { recipeId, commentId: cid };
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ids = await resolve(params);
    if (!ids) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const userId = parseInt(session.user.id, 10);

    const comment = await prisma.recipeComment.findUnique({
      where: { id: ids.commentId },
      select: { id: true, recipeId: true, likeCount: true },
    });
    if (!comment || comment.recipeId !== ids.recipeId) {
      return Response.json({ error: "Comment not found" }, { status: 404 });
    }

    const existing = await prisma.recipeCommentLike.findUnique({
      where: { commentId_userId: { commentId: ids.commentId, userId } },
      select: { commentId: true },
    });
    if (existing) {
      // Idempotent: already liked, do not double-count
      return Response.json({ liked: true, likeCount: comment.likeCount });
    }

    try {
      const updated = await prisma.$transaction(async (tx) => {
        await tx.recipeCommentLike.create({
          data: { commentId: ids.commentId, userId },
        });
        const c = await tx.recipeComment.update({
          where: { id: ids.commentId },
          data: { likeCount: { increment: 1 } },
          select: { likeCount: true },
        });
        await tx.recipe.update({
          where: { id: ids.recipeId },
          data: { lastEngagementAt: new Date() },
        });
        return c;
      });

      return Response.json(
        { liked: true, likeCount: updated.likeCount },
        { status: 201 }
      );
    } catch (error) {
      // Two simultaneous first likes race past the findUnique check; the
      // primary key rejects the loser, which is still a liked comment.
      if (
        typeof error === "object" &&
        error !== null &&
        (error as { code?: string }).code === "P2002"
      ) {
        const current = await prisma.recipeComment.findUnique({
          where: { id: ids.commentId },
          select: { likeCount: true },
        });
        return Response.json({
          liked: true,
          likeCount: current?.likeCount ?? comment.likeCount,
        });
      }
      throw error;
    }
  } catch (error) {
    console.error("Comment like error:", error);
    return Response.json({ error: "Failed to like comment" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ids = await resolve(params);
    if (!ids) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const userId = parseInt(session.user.id, 10);

    const comment = await prisma.recipeComment.findUnique({
      where: { id: ids.commentId },
      select: { id: true, recipeId: true, likeCount: true },
    });
    if (!comment || comment.recipeId !== ids.recipeId) {
      return Response.json({ error: "Comment not found" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const removed = await tx.recipeCommentLike.deleteMany({
        where: { commentId: ids.commentId, userId },
      });
      // Nothing removed means the caller had not liked it: leave the count alone.
      if (removed.count === 0) {
        return { likeCount: comment.likeCount };
      }
      return await tx.recipeComment.update({
        where: { id: ids.commentId },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true },
      });
    });

    return Response.json({ liked: false, likeCount: result.likeCount });
  } catch (error) {
    console.error("Comment unlike error:", error);
    return Response.json({ error: "Failed to unlike comment" }, { status: 500 });
  }
}
