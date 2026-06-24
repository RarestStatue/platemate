import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import ProfileClient from "./ProfileClient";

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

  const serialized = {
    ...user,
    createdAt: user.createdAt.toISOString(),
    recipes: user.recipes.map((r) => ({
      ...r,
      creatorUsername: user.username,
    })),
    reviews: user.reviews.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  };

  return <ProfileClient user={serialized} />;
}
