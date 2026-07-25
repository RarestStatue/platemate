import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { commentSchema } from "@/lib/validators";

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
    const parsed = commentSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id, 10);
    const { text, parentCommentId } = parsed.data;

    // If replying, verify parent exists and is top-level (1-level threading only)
    if (parentCommentId) {
      const parent = await prisma.recipeComment.findUnique({
        where: { id: parentCommentId },
        select: { recipeId: true, parentCommentId: true },
      });
      if (!parent || parent.recipeId !== recipeId) {
        return Response.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }
      // Only allow replies to top-level comments
      if (parent.parentCommentId !== null) {
        return Response.json(
          { error: "Cannot reply to a reply" },
          { status: 400 }
        );
      }
    }

    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.recipeComment.create({
        data: {
          recipeId,
          userId,
          text,
          parentCommentId: parentCommentId || null,
        },
        include: {
          user: { select: { id: true, username: true } },
        },
      });

      await tx.recipe.update({
        where: { id: recipeId },
        data: {
          commentCount: { increment: 1 },
          lastEngagementAt: new Date(),
        },
      });

      return newComment;
    });

    return Response.json(comment, { status: 201 });
  } catch (error) {
    console.error("Comment creation error:", error);
    return Response.json({ error: "Failed to create comment" }, { status: 500 });
  }
}

export async function DELETE(
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

    const commentId = parseInt(
      request.nextUrl.searchParams.get("commentId") ?? "",
      10
    );
    if (isNaN(commentId)) {
      return Response.json({ error: "Invalid comment ID" }, { status: 400 });
    }

    const userId = parseInt(session.user.id, 10);

    const comment = await prisma.recipeComment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        userId: true,
        recipeId: true,
        _count: { select: { replies: true } },
      },
    });
    if (!comment || comment.recipeId !== recipeId) {
      return Response.json({ error: "Comment not found" }, { status: 404 });
    }
    if (comment.userId !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Replies cascade at the DB level, so the counter drops by comment + replies
    const removed = 1 + comment._count.replies;

    await prisma.$transaction(async (tx) => {
      await tx.recipeComment.delete({ where: { id: commentId } });

      await tx.recipe.update({
        where: { id: recipeId },
        data: {
          commentCount: { decrement: removed },
          lastEngagementAt: new Date(),
        },
      });
    });

    return Response.json({ message: "Comment deleted", removed });
  } catch (error) {
    console.error("Comment deletion error:", error);
    return Response.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
