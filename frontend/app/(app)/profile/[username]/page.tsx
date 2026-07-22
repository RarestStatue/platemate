import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import ProfileClient from "./ProfileClient";
import { getAllergens } from "@/lib/allergens";
import { auth } from "@/lib/auth";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
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
      recipes: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          title: true,
          prepTimeMin: true,
          avgRating: true,
          photoUrl: true,
          saveCount: true,
          hasPeanuts: true,
          hasTreeNuts: true,
          hasShellfish: true,
          hasDairy: true,
          hasGluten: true,
          hasEggs: true,
        },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          recipe: { select: { id: true, title: true } },
        },
      },
    },
  });

  // SECURITY: treat deleted users as not found, and block private profiles
  if (!user || user.deletedAt) notFound();
  if (user.profile && !user.profile.isPublic) notFound();

  const session = await auth();
  const viewerId = session?.user?.id ? parseInt(session.user.id, 10) : null;
  const isSelf = viewerId === user.id;
  let isFollowing = false;
  if (viewerId && !isSelf) {
    const rel = await prisma.userFollow.findUnique({
      where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
      select: { followerId: true },
    });
    isFollowing = !!rel;
  }

  // SECURITY: strip internal deletedAt field before sending to the client
  const { deletedAt: _deleted, ...publicUser } = user;
  const serialized = {
    ...publicUser,
    createdAt: user.createdAt.toISOString(),
    isSelf,
    isFollowing,
    viewerIsAuthed: viewerId !== null,
    recipes: user.recipes.map((r) => {
      const {
        hasPeanuts: _hasPeanuts,
        hasTreeNuts: _hasTreeNuts,
        hasShellfish: _hasShellfish,
        hasDairy: _hasDairy,
        hasGluten: _hasGluten,
        hasEggs: _hasEggs,
        ...rest
      } = r;
      return {
        ...rest,
        creatorUsername: user.username,
        allergens: getAllergens(r),
      };
    }),
    reviews: user.reviews.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  };

  return <ProfileClient user={serialized} />;
}
