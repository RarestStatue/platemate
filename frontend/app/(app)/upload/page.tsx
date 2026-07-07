"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconCamera,
  IconPlus,
  IconX,
  IconCheck,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { recipeUploadSchema, type RecipeUploadInput } from "@/lib/validators";

type UploadState = "form" | "duplicate-warning" | "success";

interface DuplicateWarning {
  id: number;
  title: string;
  creator: string;
}

export default function UploadPage() {
  const router = useRouter();
  const [state, setState] = useState<UploadState>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [duplicates, setDuplicates] = useState<DuplicateWarning[]>([]);
  const [createdRecipeId, setCreatedRecipeId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RecipeUploadInput>({
    resolver: zodResolver(recipeUploadSchema),
    defaultValues: {
      title: "",
      description: "",
      prepTimeMin: 15,
      servings: 2,
      ingredients: [{ ingredient: "", quantity: 1, unit: "cups" }],
      steps: [{ instruction: "" }],
    },
  });

  const {
    fields: ingredientFields,
    append: addIngredient,
    remove: removeIngredient,
  } = useFieldArray({ control, name: "ingredients" });

  const {
    fields: stepFields,
    append: addStep,
    remove: removeStep,
  } = useFieldArray({ control, name: "steps" });

  async function submitRecipe(data: RecipeUploadInput) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to create recipe");
        setLoading(false);
        return;
      }

      setCreatedRecipeId(result.recipe.id);

      if (result.duplicateWarnings?.length > 0 && state === "form") {
        setDuplicates(result.duplicateWarnings);
        setState("duplicate-warning");
      } else {
        setState("success");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(data: RecipeUploadInput) {
    submitRecipe(data);
  }

  // Duplicate warning screen
  if (state === "duplicate-warning") {
    return (
      <div className="px-4 py-8 max-w-lg mx-auto">
        <div className="bg-warn-bg text-warn-text rounded-xl p-4 mb-6">
          <div className="flex items-start gap-2">
            <IconAlertTriangle size={20} className="mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="font-bold">Similar recipe found</h2>
              <p className="text-sm mt-1">
                We found recipes with similar titles:
              </p>
              <ul className="mt-2 space-y-1">
                {duplicates.map((d) => (
                  <li key={d.id} className="text-sm">
                    &quot;{d.title}&quot; by @{d.creator}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setState("form")}
            className="flex-1 py-2.5 border-2 border-red text-red rounded-lg font-semibold hover:bg-red-light transition-colors"
          >
            Go back
          </button>
          <button
            onClick={() => setState("success")}
            className="flex-1 py-2.5 bg-red text-white rounded-lg font-semibold hover:bg-red-darker transition-colors"
          >
            Publish anyway
          </button>
        </div>
      </div>
    );
  }

  // Success screen
  if (state === "success") {
    return (
      <div className="px-4 py-16 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full bg-safe-bg text-safe-text flex items-center justify-center mx-auto mb-4">
          <IconCheck size={32} />
        </div>
        <h1 className="text-2xl font-bold mb-2">Recipe published!</h1>
        <p className="text-muted mb-8">
          Your recipe is now live for the community to discover.
        </p>
        <div className="flex flex-col gap-3">
          {createdRecipeId && (
            <button
              onClick={() => router.push(`/recipe/${createdRecipeId}`)}
              className="w-full py-2.5 bg-red text-white rounded-lg font-semibold hover:bg-red-darker transition-colors"
            >
              View my recipe
            </button>
          )}
          <button
            onClick={() => router.push("/home")}
            className="w-full py-2.5 border-2 border-red text-red rounded-lg font-semibold hover:bg-red-light transition-colors"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  // Upload form
  return (
    <div className="px-4 py-4 max-w-lg mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <div className="bg-red-light text-red-dark text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Photo upload area */}
        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
          <IconCamera size={32} className="mx-auto text-muted mb-2" />
          <p className="text-sm text-muted">
            Photo upload coming soon
          </p>
        </div>

        {/* Recipe name */}
        <div>
          <label className="block text-sm font-medium mb-1">Recipe name</label>
          <input
            type="text"
            {...register("title")}
            className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red"
            placeholder="e.g., Spicy Peanut Noodles"
          />
          {errors.title && (
            <p className="text-red-dark text-xs mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            {...register("description")}
            className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red resize-none"
            rows={3}
            placeholder="Tell us about your recipe..."
          />
        </div>

        {/* Prep time + Servings side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Prep time (min)
            </label>
            <input
              type="number"
              {...register("prepTimeMin", { valueAsNumber: true })}
              className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red"
              min={0}
            />
            {errors.prepTimeMin && (
              <p className="text-red-dark text-xs mt-1">
                {errors.prepTimeMin.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Servings</label>
            <input
              type="number"
              {...register("servings", { valueAsNumber: true })}
              className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red"
              min={1}
            />
            {errors.servings && (
              <p className="text-red-dark text-xs mt-1">
                {errors.servings.message}
              </p>
            )}
          </div>
        </div>

        {/* Ingredients */}
        <div>
          <label className="block text-sm font-medium mb-2">Ingredients</label>
          <div className="space-y-2">
            {ingredientFields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start">
                <input
                  type="text"
                  {...register(`ingredients.${index}.ingredient`)}
                  className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red"
                  placeholder="Ingredient"
                />
                <input
                  type="number"
                  step="0.25"
                  {...register(`ingredients.${index}.quantity`, {
                    valueAsNumber: true,
                  })}
                  className="w-20 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red"
                  placeholder="Qty"
                />
                <input
                  type="text"
                  {...register(`ingredients.${index}.unit`)}
                  className="w-20 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red"
                  placeholder="Unit"
                />
                {ingredientFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="text-muted hover:text-red-dark p-2"
                    aria-label="Remove ingredient"
                  >
                    <IconX size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              addIngredient({ ingredient: "", quantity: 1, unit: "cups" })
            }
            className="mt-2 text-sm text-red flex items-center gap-1 hover:underline"
          >
            <IconPlus size={14} /> Add ingredient
          </button>
          {errors.ingredients && (
            <p className="text-red-dark text-xs mt-1">
              {errors.ingredients.message || errors.ingredients.root?.message}
            </p>
          )}
        </div>

        {/* Steps */}
        <div>
          <label className="block text-sm font-medium mb-2">Steps</label>
          <div className="space-y-2">
            {stepFields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start">
                <div className="w-7 h-7 rounded-full bg-red text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-2">
                  {index + 1}
                </div>
                <textarea
                  {...register(`steps.${index}.instruction`)}
                  className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red resize-none"
                  rows={2}
                  placeholder={`Step ${index + 1}...`}
                />
                {stepFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="text-muted hover:text-red-dark p-2"
                    aria-label="Remove step"
                  >
                    <IconX size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => addStep({ instruction: "" })}
            className="mt-2 text-sm text-red flex items-center gap-1 hover:underline"
          >
            <IconPlus size={14} /> Add step
          </button>
          {errors.steps && (
            <p className="text-red-dark text-xs mt-1">
              {errors.steps.message || errors.steps.root?.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red text-white py-3 rounded-lg font-semibold hover:bg-red-darker transition-colors disabled:opacity-50"
        >
          {loading ? "Publishing..." : "Publish recipe"}
        </button>
      </form>
    </div>
  );
}
