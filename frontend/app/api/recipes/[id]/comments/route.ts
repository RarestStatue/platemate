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
