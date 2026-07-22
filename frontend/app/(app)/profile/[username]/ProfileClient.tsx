"use client";

import { useState } from "react";
import RecipeCard from "@/components/common/RecipeCard";
import FollowButton from "@/components/common/FollowButton";
import clsx from "clsx";

interface ProfileUser {
  id: number;
  username: string;
  createdAt: string;
  isSelf: boolean;
  isFollowing: boolean;
  viewerIsAuthed: boolean;
  profile: {
    bio: string | null;
    avatarUrl: string | null;
    isPublic: boolean;
    recipeCount: number;
    reviewCount: number;
  } | null;
  recipes: {
    id: number;
    title: string;
    prepTimeMin: number;
    avgRating: number;
    photoUrl: string | null;
    saveCount: number;
    creatorUsername: string;
    allergens: string[];
  }[];
  reviews: {
    id: number;
    text: string;
    createdAt: string;
    updatedAt: string;
    recipe: { id: number; title: string };
  }[];
}

export default function ProfileClient({ user }: { user: ProfileUser }) {
  const [tab, setTab] = useState<"recipes" | "reviews">("recipes");

  return (
    <div className="px-4 py-6">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element -- plain img so a broken/absent avatar can fall back to the bundled default via onError (next/image can't swap src on error) */}
          <img
            src={user.profile?.avatarUrl || "/default-avatar.svg"}
            alt={user.username}
            width={64}
            height={64}
            className="w-full h-full object-cover"
            onError={(e) => {
              const img = e.currentTarget;
              if (!img.src.endsWith("/default-avatar.svg")) {
                img.src = "/default-avatar.svg";
              }
            }}
          />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">@{user.username}</h1>
            {!user.isSelf && user.viewerIsAuthed && (
              <FollowButton username={user.username} initialFollowing={user.isFollowing} />
            )}
            {user.isSelf && (
              <a
                href="/settings"
                className="rounded-full border border-border px-4 py-1.5 text-sm text-muted hover:text-foreground"
              >
                Edit profile
              </a>
            )}
          </div>
          {user.profile?.bio && (
            <p className="text-sm text-muted mt-1">{user.profile.bio}</p>
          )}
          <p className="text-xs text-muted mt-1">
            Joined {new Date(user.createdAt).toLocaleDateString("en-CA", { year: "numeric", month: "long" })}
          </p>
          <div className="flex gap-4 mt-2 text-sm text-muted">
            <span>
              <strong className="text-foreground">
                {user.profile?.recipeCount ?? 0}
              </strong>{" "}
              recipes
            </span>
            <span>
              <strong className="text-foreground">
                {user.profile?.reviewCount ?? 0}
              </strong>{" "}
              reviews
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-4">
        <button
          onClick={() => setTab("recipes")}
          className={clsx(
            "flex-1 py-2 text-sm font-medium text-center border-b-2 transition-colors",
            tab === "recipes"
              ? "border-red text-red"
              : "border-transparent text-muted hover:text-foreground"
          )}
        >
          Recipes
        </button>
        <button
          onClick={() => setTab("reviews")}
          className={clsx(
            "flex-1 py-2 text-sm font-medium text-center border-b-2 transition-colors",
            tab === "reviews"
              ? "border-red text-red"
              : "border-transparent text-muted hover:text-foreground"
          )}
        >
          Reviews
        </button>
      </div>

      {/* Tab content */}
      {tab === "recipes" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {user.recipes.length === 0 ? (
            <p className="col-span-full text-center text-muted py-8">
              No recipes yet
            </p>
          ) : (
            user.recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                id={recipe.id}
                title={recipe.title}
                prepTimeMin={recipe.prepTimeMin}
                avgRating={recipe.avgRating}
                photoUrl={recipe.photoUrl}
                allergens={recipe.allergens}
              />
            ))
          )}
        </div>
      )}

      {tab === "reviews" && (
        <div className="space-y-3">
          {user.reviews.length === 0 ? (
            <p className="text-center text-muted py-8">No reviews yet</p>
          ) : (
            user.reviews.map((review) => (
              <div
                key={review.id}
                className="border border-border rounded-lg p-3"
              >
                <a
                  href={`/recipe/${review.recipe.id}`}
                  className="text-sm font-medium text-red hover:underline"
                >
                  {review.recipe.title}
                </a>
                <p className="text-sm mt-1">{review.text}</p>
                <p className="text-xs text-muted mt-1">
                  {new Date(review.createdAt).toLocaleDateString()}
                  {review.updatedAt !== review.createdAt && (
                    <span className="italic ml-1">(edited)</span>
                  )}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
