"use client";

import { useState } from "react";
import RecipeCard from "@/components/common/RecipeCard";
import FollowButton from "@/components/common/FollowButton";
import { IconStar, IconStarFilled } from "@tabler/icons-react";
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
    rating: number | null;
    recipe: { id: number; title: string };
  }[];
  favourites: {
    id: number;
    title: string;
    prepTimeMin: number;
    avgRating: number;
    photoUrl: string | null;
    saveCount: number;
    creatorUsername: string;
    allergens: string[];
  }[];
  comments: {
    id: number;
    text: string;
    createdAt: string;
    recipe: { id: number; title: string };
  }[];
}

type Tab = "recipes" | "favourites" | "reviews" | "comments";

const TABS: [Tab, string][] = [
  ["recipes", "Recipes"],
  ["favourites", "Favourites"],
  ["reviews", "Reviews"],
  ["comments", "Comments"],
];

export default function ProfileClient({ user }: { user: ProfileUser }) {
  const [tab, setTab] = useState<Tab>("recipes");

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
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={clsx(
              "flex-1 py-2 text-sm font-medium text-center border-b-2 transition-colors",
              tab === key
                ? "border-red text-red"
                : "border-transparent text-muted hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
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

      {tab === "favourites" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {user.favourites.length === 0 ? (
            <p className="col-span-full text-center text-muted py-8">
              No favourites yet
            </p>
          ) : (
            user.favourites.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                id={recipe.id}
                title={recipe.title}
                prepTimeMin={recipe.prepTimeMin}
                avgRating={recipe.avgRating}
                photoUrl={recipe.photoUrl}
                allergens={recipe.allergens}
                isSaved={user.isSelf ? true : undefined}
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
                {review.rating != null && (
                  <span
                    className="flex items-center gap-0.5 mt-1"
                    aria-label={`${review.rating} out of 5 stars`}
                  >
                    {[1, 2, 3, 4, 5].map((s) =>
                      s <= review.rating! ? (
                        <IconStarFilled
                          key={s}
                          size={13}
                          className="text-yellow-500"
                        />
                      ) : (
                        <IconStar key={s} size={13} className="text-gray-300" />
                      )
                    )}
                  </span>
                )}
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

      {tab === "comments" && (
        <div className="space-y-3">
          {user.comments.length === 0 ? (
            <p className="text-center text-muted py-8">No comments yet</p>
          ) : (
            user.comments.map((comment) => (
              <div
                key={comment.id}
                className="border border-border rounded-lg p-3"
              >
                <a
                  href={`/recipe/${comment.recipe.id}`}
                  className="text-sm font-medium text-red hover:underline"
                >
                  {comment.recipe.title}
                </a>
                <p className="text-sm mt-1">{comment.text}</p>
                <p className="text-xs text-muted mt-1">
                  {new Date(comment.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
