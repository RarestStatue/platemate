import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

async function resolveTarget(username: string) {
  return prisma.user.findUnique({
    where: { username },
    select: { id: true, deletedAt: true },
  });
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const followerId = parseInt(session.user.id, 10);
    const { username } = await params;

    const target = await resolveTarget(username);
    if (!target || target.deletedAt) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    if (target.id === followerId) {
      return Response.json({ error: "You cannot follow yourself" }, { status: 400 });
    }

    await prisma.userFollow.create({
      data: { followerId, followingId: target.id },
    });
    return Response.json({ following: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return Response.json({ following: true });
    }
    console.error("Follow error:", error);
    return Response.json({ error: "Failed to follow" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const followerId = parseInt(session.user.id, 10);
    const { username } = await params;

    const target = await resolveTarget(username);
    if (!target) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.userFollow.deleteMany({
      where: { followerId, followingId: target.id },
    });
    return Response.json({ following: false });
  } catch (error) {
    console.error("Unfollow error:", error);
    return Response.json({ error: "Failed to unfollow" }, { status: 500 });
  }
}
