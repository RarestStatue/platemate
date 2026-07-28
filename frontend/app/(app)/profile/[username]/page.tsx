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

  // Phase 1: identity + privacy only. No activity is queried until the viewer
  // has been cleared, so a private profile can't leak through a serialization slip.
  const base = await prisma.user.findUnique({
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
  if (!base || base.deletedAt) notFound();

  const session = await auth();
  const viewerId = session?.user?.id ? parseInt(session.user.id, 10) : null;
  const isSelf = viewerId === base.id;

  let isFollowing = false;
  if (viewerId && !isSelf) {
    const rel = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: { followerId: viewerId, followingId: base.id },
      },
      select: { followerId: true },
    });
    isFollowing = !!rel;
  }

  // SOC-1.2: a private profile is visible to its owner in full; everyone else
  // gets the shell (avatar, name, bio, follow button) with no activity and no counts.
  const isPrivateView = !isSelf && base.profile !== null && !base.profile.isPublic;

  const shell = {
    id: base.id,
    username: base.username,
    createdAt: base.createdAt.toISOString(),
    isSelf,
    isFollowing,
    viewerIsAuthed: viewerId !== null,
  };

  if (isPrivateView) {
    return (
      <ProfileClient
        user={{
          ...shell,
          isPrivateView: true,
          profile: base.profile
            ? {
                bio: base.profile.bio,
                avatarUrl: base.profile.avatarUrl,
                isPublic: false,
                // zeroed on purpose: counts are activity aggregates and the
                // private view never renders them
                recipeCount: 0,
                reviewCount: 0,
              }
            : null,
          recipes: [],
          reviews: [],
          favourites: [],
          comments: [],
        }}
      />
    );
  }

  // Phase 2: the viewer is the owner or the profile is public — load the activity.
  const activity = await prisma.user.findUnique({
    where: { id: base.id },
    select: {
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

  if (!activity) notFound();

  // Fields are listed explicitly (rather than spread-and-strip) so internal
  // columns like deletedAt can never reach the client payload.
  const serialized = {
    ...shell,
    isPrivateView: false,
    profile: base.profile,
    recipes: activity.recipes.map((r) => {
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
        creatorUsername: base.username,
        allergens: getAllergens(r),
      };
    }),
    reviews: attachRatings(activity.reviews, activity.ratings).map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    favourites: activity.saves.map((s) => ({
      id: s.recipe.id,
      title: s.recipe.title,
      prepTimeMin: s.recipe.prepTimeMin,
      avgRating: s.recipe.avgRating,
      photoUrl: s.recipe.photoUrl,
      saveCount: s.recipe.saveCount,
      creatorUsername: s.recipe.creator.username,
      allergens: getAllergens(s.recipe),
    })),
    comments: activity.comments.map((c) => ({
      id: c.id,
      text: c.text,
      createdAt: c.createdAt.toISOString(),
      recipe: c.recipe,
    })),
  };

  return <ProfileClient user={serialized} />;
}
