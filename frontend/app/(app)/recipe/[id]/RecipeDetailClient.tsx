"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  IconHeart,
  IconHeartFilled,
  IconClock,
  IconStar,
  IconStarFilled,
  IconAlertTriangle,
  IconMinus,
  IconPlus,
} from "@tabler/icons-react";
import { useServingStore } from "@/stores/useServingStore";
import clsx from "clsx";

interface Substitute {
  name: string;
  flavorImpact: string;
}

interface Ingredient {
  id: number;
  ingredientId: number;
  ingredient: string;
  quantity: number;
  unit: string;
  notes: string | null;
  sortOrder: number;
  isPantryStaple: boolean;
  substitutes: Substitute[];
}

interface Step {
  id: number;
  stepNumber: number;
  instruction: string;
  durationMin: number | null;
}

interface Review {
  id: number;
  text: string;
  createdAt: string;
  user: { id: number; username: string };
}

interface CommentReply {
  id: number;
  text: string;
  createdAt: string;
  parentCommentId: number | null;
  user: { id: number; username: string };
}

interface Comment {
  id: number;
  text: string;
  createdAt: string;
  parentCommentId: number | null;
  user: { id: number; username: string };
  replies: CommentReply[];
}

interface RecipeProps {
  recipe: {
    id: number;
    title: string;
    description: string | null;
    prepTimeMin: number;
    servings: number;
    photoUrl: string | null;
    createdAt: string;
    avgRating: number;
    reviewCount: number;
    ratingCount: number;
    commentCount: number;
    saveCount: number;
    hasPeanuts: boolean;
    hasTreeNuts: boolean;
    hasShellfish: boolean;
    hasDairy: boolean;
    hasGluten: boolean;
    hasEggs: boolean;
    creator: { id: number; username: string; avatarUrl: string | null };
    ingredients: Ingredient[];
    steps: Step[];
    reviews: Review[];
    comments: Comment[];
  };
  isSaved: boolean;
  userRating: number | null;
  currentUserId: number | null;
  shoppingListIngredientIds: number[];
}

export default function RecipeDetailClient({
  recipe,
  isSaved: initialSaved,
  userRating: _initialRating,
  currentUserId,
  shoppingListIngredientIds,
}: RecipeProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [savingState, setSavingState] = useState(false);
  const [missingIds, setMissingIds] = useState<Set<number>>(new Set());
  const [onListIds, setOnListIds] = useState<Set<number>>(
    () => new Set(shoppingListIngredientIds)
  );
  const [addingId, setAddingId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(0);

  const {
    originalServings,
    currentServings,
    setOriginalServings,
    increment,
    decrement,
    getScale,
  } = useServingStore();

  useEffect(() => {
    setOriginalServings(recipe.servings);
  }, [recipe.servings, setOriginalServings]);

  const scale = getScale();
  const isScaled = currentServings !== originalServings;

  // Allergen warnings
  const allergens: string[] = [];
  if (recipe.hasPeanuts) allergens.push("Peanuts");
  if (recipe.hasTreeNuts) allergens.push("Tree nuts");
  if (recipe.hasShellfish) allergens.push("Shellfish");
  if (recipe.hasDairy) allergens.push("Dairy");
  if (recipe.hasGluten) allergens.push("Gluten");
  if (recipe.hasEggs) allergens.push("Eggs");

  async function toggleSave() {
    if (!currentUserId || savingState) return;
    setSavingState(true);
    const method = saved ? "DELETE" : "POST";
    try {
      await fetch("/api/saved", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId: recipe.id }),
      });
      setSaved(!saved);
    } catch {
      // silent fail
    } finally {
      setSavingState(false);
    }
  }

  async function submitReview() {
    if (!currentUserId || !reviewText.trim() || reviewRating < 1) return;
    try {
      await fetch(`/api/recipes/${recipe.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: reviewText.trim(), rating: reviewRating }),
      });
      setReviewText("");
      setReviewRating(0);
      // Optimistic: would refresh in production
    } catch {
      // silent
    }
  }

  async function submitComment(parentId?: number) {
    if (!currentUserId) return;
    const text = parentId ? replyText.trim() : commentText.trim();
    if (!text) return;
    try {
      await fetch(`/api/recipes/${recipe.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          parentCommentId: parentId || undefined,
        }),
      });
      if (parentId) {
        setReplyText("");
        setReplyTo(null);
      } else {
        setCommentText("");
      }
    } catch {
      // silent
    }
  }

  function formatQuantity(qty: number): string {
    const scaled = qty * scale;
    return scaled % 1 === 0 ? String(scaled) : scaled.toFixed(2);
  }

  function toggleMissing(ingredientId: number) {
    setMissingIds((prev) => {
      const next = new Set(prev);
      if (next.has(ingredientId)) {
        next.delete(ingredientId);
      } else {
        next.add(ingredientId);
      }
      return next;
    });
  }

  async function addToShoppingList(ing: Ingredient) {
    if (!currentUserId || addingId !== null || onListIds.has(ing.ingredientId)) {
      return;
    }
    setAddingId(ing.ingredientId);
    try {
      const res = await fetch("/api/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredientId: ing.ingredientId,
          fromRecipeId: recipe.id,
          quantity: Number((ing.quantity * scale).toFixed(2)),
          unit: ing.unit,
        }),
      });
      if (res.ok) {
        setOnListIds((prev) => new Set(prev).add(ing.ingredientId));
      }
    } catch {
      // silent fail
    } finally {
      setAddingId(null);
    }
  }

  function importance(ing: Ingredient): "staple" | "substitutable" | "essential" {
    if (ing.isPantryStaple) return "staple";
    if (ing.substitutes.length > 0) return "substitutable";
    return "essential";
  }

  return (
    <div className="pb-8">
      {/* Hero image */}
      <div className="aspect-video bg-gray-100 relative">
        {recipe.photoUrl ? (
          <Image
            src={recipe.photoUrl}
            alt={recipe.title}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-lg">
            No photo
          </div>
        )}
        {/* Save button */}
        {currentUserId && (
          <button
            onClick={toggleSave}
            disabled={savingState}
            className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
            aria-label={saved ? "Unsave recipe" : "Save recipe"}
          >
            {saved ? (
              <IconHeartFilled size={22} className="text-red" />
            ) : (
              <IconHeart size={22} className="text-muted" />
            )}
          </button>
        )}
      </div>

      <div className="px-4 pt-4">
        {/* Title & meta */}
        <h1 className="text-xl font-bold">{recipe.title}</h1>
        <div className="flex items-center gap-3 mt-1 text-sm text-muted">
          <span className="flex items-center gap-1">
            <IconClock size={16} />
            {recipe.prepTimeMin} min
          </span>
          <span>{recipe.servings} servings</span>
          <span className="flex items-center gap-1">
            <IconStar size={16} className="text-yellow-500" />
            {recipe.avgRating.toFixed(1)}
          </span>
        </div>

        {recipe.description && (
          <p className="mt-3 text-sm text-muted">{recipe.description}</p>
        )}

        <p className="mt-2 text-sm">
          by{" "}
          <a
            href={`/profile/${recipe.creator.username}`}
            className="text-red font-medium hover:underline"
          >
            @{recipe.creator.username}
          </a>
        </p>
        
        <p className="mt-1 text-sm text-muted">
          Posted{" "}
          {new Date(recipe.createdAt).toLocaleDateString("en-CA", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        
        {/* Allergen warning */}
        {allergens.length > 0 && (
          <div className="mt-4 bg-warn-bg text-warn-text px-4 py-3 rounded-lg flex items-start gap-2">
            <IconAlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <strong>Allergen warning:</strong> Contains {allergens.join(", ")}
            </div>
          </div>
        )}

        {/* Serving scaler */}
        <div className="mt-6 border-2 border-red rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="font-semibold text-sm">Servings</span>
          <div className="flex items-center gap-3">
            <button
              onClick={decrement}
              className="w-8 h-8 rounded-full border-2 border-red text-red flex items-center justify-center hover:bg-red-light transition-colors"
              aria-label="Decrease servings"
            >
              <IconMinus size={16} />
            </button>
            <span
              className={clsx(
                "text-lg font-bold min-w-[2ch] text-center",
                isScaled && "text-red"
              )}
            >
              {currentServings}
            </span>
            <button
              onClick={increment}
              className="w-8 h-8 rounded-full border-2 border-red text-red flex items-center justify-center hover:bg-red-light transition-colors"
              aria-label="Increase servings"
            >
              <IconPlus size={16} />
            </button>
          </div>
        </div>

        {/* Ingredients */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Ingredients</h2>
            {missingIds.size > 0 && (
              <span className="bg-warn-bg text-warn-text text-xs font-medium px-2 py-1 rounded-full">
                Missing {missingIds.size} of {recipe.ingredients.length}
              </span>
            )}
          </div>
          <ul className="space-y-2">
            {recipe.ingredients.map((ing) => {
              const isMissing = missingIds.has(ing.ingredientId);
              const tier = importance(ing);
              const onList = onListIds.has(ing.ingredientId);
              return (
                <li key={ing.id} className="border-b border-gray-50 py-1">
                  <div className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isMissing}
                        onChange={() => toggleMissing(ing.ingredientId)}
                        className="accent-red w-4 h-4"
                        aria-label={`Mark ${ing.ingredient} as missing`}
                      />
                      <span className={clsx(isMissing && "text-warn-text")}>
                        {ing.ingredient}
                        {ing.notes && (
                          <span className="text-muted"> ({ing.notes})</span>
                        )}
                      </span>
                    </label>
                    <span
                      className={clsx(
                        "text-sm font-medium whitespace-nowrap",
                        isScaled && "text-red"
                      )}
                    >
                      {formatQuantity(ing.quantity)} {ing.unit}
                    </span>
                  </div>

                  {isMissing && (
                    <div className="ml-6 mt-2 mb-2 space-y-1.5 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={clsx(
                            "px-2 py-0.5 rounded-full font-medium",
                            tier === "staple" && "bg-gray-100 text-muted",
                            tier === "substitutable" &&
                              "bg-red-light text-red",
                            tier === "essential" &&
                              "bg-warn-bg text-warn-text"
                          )}
                        >
                          {tier === "staple"
                            ? "Pantry staple"
                            : tier === "substitutable"
                            ? "Substitutable"
                            : "Essential"}
                        </span>

                        {onList ? (
                          <span className="text-muted">
                            On your shopping list ✓
                          </span>
                        ) : currentUserId ? (
                          <button
                            onClick={() => addToShoppingList(ing)}
                            disabled={addingId === ing.ingredientId}
                            className="text-red font-medium hover:underline disabled:opacity-50"
                          >
                            {addingId === ing.ingredientId
                              ? "Adding..."
                              : "Need to buy: add to list"}
                          </button>
                        ) : (
                          <span className="text-muted">Need to buy</span>
                        )}
                      </div>

                      {ing.substitutes.length > 0 && (
                        <p className="text-muted">
                          Swap:{" "}
                          {ing.substitutes
                            .map((s) => `${s.name} (${s.flavorImpact})`)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Steps */}
        <div className="mt-6">
          <h2 className="text-lg font-bold mb-3">Steps</h2>
          <ol className="space-y-4">
            {recipe.steps.map((step) => (
              <li key={step.id} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-red text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  {step.stepNumber}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{step.instruction}</p>
                  {step.durationMin && (
                    <p className="text-xs text-muted mt-1 flex items-center gap-1">
                      <IconClock size={12} />
                      {step.durationMin} min
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Reviews */}
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-3">
            Reviews ({recipe.reviewCount})
          </h2>

          {currentUserId && (
            <div className="mb-4 p-3 border border-border rounded-lg">
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    aria-label={`Rate ${star} stars`}
                  >
                    {star <= reviewRating ? (
                      <IconStarFilled size={20} className="text-yellow-500" />
                    ) : (
                      <IconStar size={20} className="text-gray-300" />
                    )}
                  </button>
                ))}
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Write a review..."
                className="w-full border border-border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red resize-none"
                rows={3}
                maxLength={5000}
              />
              <button
                onClick={submitReview}
                disabled={!reviewText.trim() || reviewRating < 1}
                className="mt-2 bg-red text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Submit review
              </button>
            </div>
          )}

          {recipe.reviews.map((review) => (
            <div
              key={review.id}
              className="border border-border rounded-lg p-3 mb-2"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">
                  @{review.user.username}
                </span>
                <span className="text-xs text-muted">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm">{review.text}</p>
            </div>
          ))}
        </div>

        {/* Comments */}
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-3">
            Comments ({recipe.commentCount})
          </h2>

          {currentUserId && (
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red"
                maxLength={2000}
                onKeyDown={(e) =>
                  e.key === "Enter" && submitComment()
                }
              />
              <button
                onClick={() => submitComment()}
                disabled={!commentText.trim()}
                className="bg-red text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Post
              </button>
            </div>
          )}

          {recipe.comments.map((comment) => (
            <div key={comment.id} className="mb-3">
              <div className="border border-border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    @{comment.user.username}
                  </span>
                  <span className="text-xs text-muted">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm">{comment.text}</p>
                {currentUserId && (
                  <button
                    onClick={() =>
                      setReplyTo(replyTo === comment.id ? null : comment.id)
                    }
                    className="text-xs text-red mt-1 hover:underline"
                  >
                    Reply
                  </button>
                )}
              </div>

              {/* Reply form */}
              {replyTo === comment.id && (
                <div className="ml-6 mt-2 flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    className="flex-1 border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red"
                    maxLength={2000}
                    onKeyDown={(e) =>
                      e.key === "Enter" && submitComment(comment.id)
                    }
                  />
                  <button
                    onClick={() => submitComment(comment.id)}
                    disabled={!replyText.trim()}
                    className="bg-red text-white px-3 py-1.5 rounded-lg text-sm disabled:opacity-50"
                  >
                    Reply
                  </button>
                </div>
              )}

              {/* Replies (1-level threading) */}
              {comment.replies?.map((reply) => (
                <div
                  key={reply.id}
                  className="ml-6 mt-2 border border-border rounded-lg p-3 bg-gray-50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      @{reply.user.username}
                    </span>
                    <span className="text-xs text-muted">
                      {new Date(reply.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{reply.text}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
