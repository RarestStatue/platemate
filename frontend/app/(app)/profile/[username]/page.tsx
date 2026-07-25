import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import ProfileClient from "./ProfileClient";
import { getAllergens } from "@/lib/allergens";
import { attachRatings } from "@/lib/profile";
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
      saves: {
        orderBy: { savedAt: "desc" },
        take: 20,
        select: {
          savedAt: true,
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
      },
      comments: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          text: true,
          createdAt: true,
          recipe: { select: { id: true, title: true } },
        },
      },
      ratings: {
        select: { recipeId: true, rating: true },
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

  // SECURITY: strip internal deletedAt field before sending to the client.
  // saves/comments/ratings are re-shaped below, so keep the raw Prisma objects
  // (which carry Date values) out of the client payload.
  const {
    deletedAt: _deleted,
    saves: _saves,
    comments: _comments,
    ratings: _ratings,
    ...publicUser
  } = user;
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
    reviews: attachRatings(user.reviews, user.ratings).map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    favourites: user.saves.map((s) => ({
      id: s.recipe.id,
      title: s.recipe.title,
      prepTimeMin: s.recipe.prepTimeMin,
      avgRating: s.recipe.avgRating,
      photoUrl: s.recipe.photoUrl,
      saveCount: s.recipe.saveCount,
      creatorUsername: s.recipe.creator.username,
      allergens: getAllergens(s.recipe),
    })),
    comments: user.comments.map((c) => ({
      id: c.id,
      text: c.text,
      createdAt: c.createdAt.toISOString(),
      recipe: c.recipe,
    })),
  };

  return <ProfileClient user={serialized} />;
}
