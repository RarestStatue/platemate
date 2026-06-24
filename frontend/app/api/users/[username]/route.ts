import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

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

    // SECURITY: treat deleted users and private profiles as not found
    if (!user || user.deletedAt) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    if (user.profile && !user.profile.isPublic) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Strip internal deletedAt field before sending
    const { deletedAt: _deleted, ...publicUser } = user;
    return Response.json(publicUser);
  } catch (error) {
    console.error("User fetch error:", error);
    return Response.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
