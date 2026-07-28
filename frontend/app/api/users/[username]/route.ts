import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        deletedAt: true,
        createdAt: true,
        profile: {
          select: {
            bio: true,
            avatarUrl: true,
            isPublic: true,
            recipeCount: true,
            reviewCount: true,
          },
        },
      },
    });

    // SECURITY: treat deleted users as not found
    if (!user || user.deletedAt) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const session = await auth();
    const viewerId = session?.user?.id ? parseInt(session.user.id, 10) : null;
    const isSelf = viewerId === user.id;

    // SOC-1.2: a private profile resolves for other viewers, but exposes the
    // shell only — recipeCount/reviewCount are activity aggregates, owner-only.
    if (!isSelf && user.profile && !user.profile.isPublic) {
      return Response.json({
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
        isPrivate: true,
        profile: {
          bio: user.profile.bio,
          avatarUrl: user.profile.avatarUrl,
          isPublic: false,
        },
      });
    }

    // Strip internal deletedAt field before sending
    const { deletedAt: _deleted, ...publicUser } = user;
    return Response.json({ ...publicUser, isPrivate: false });
  } catch (error) {
    console.error("User fetch error:", error);
    return Response.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
