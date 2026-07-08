"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import {
  IconCamera,
  IconPlus,
  IconX,
  IconCheck,
  IconAlertTriangle,
} from "@tabler/icons-react";
import {
  recipeUploadSchema,
  type RecipeUploadInput,
  type RecipeUploadFormInput,
} from "@/lib/validators";

const DIETARY_FIELDS = [
  { name: "hasPeanuts", label: "Contains peanuts" },
  { name: "hasTreeNuts", label: "Contains tree nuts" },
  { name: "hasShellfish", label: "Contains shellfish" },
  { name: "hasDairy", label: "Contains dairy" },
  { name: "hasGluten", label: "Contains gluten" },
  { name: "hasEggs", label: "Contains eggs" },
  { name: "isVegetarian", label: "Vegetarian" },
  { name: "isVegan", label: "Vegan" },
  { name: "isHalal", label: "Halal" },
] as const;

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
  const [tagInput, setTagInput] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<RecipeUploadFormInput, unknown, RecipeUploadInput>({
    resolver: zodResolver(recipeUploadSchema),
    defaultValues: {
      title: "",
      description: "",
      prepTimeMin: 15,
      servings: 2,
      ingredients: [{ ingredient: "", quantity: 1, unit: "cups" }],
      steps: [{ instruction: "" }],
      tags: [],
      photoUrl: undefined,
      hasPeanuts: false,
      hasTreeNuts: false,
      hasShellfish: false,
      hasDairy: false,
      hasGluten: false,
      hasEggs: false,
      isVegetarian: false,
      isVegan: false,
      isHalal: false,
    },
  });

  const tags = useWatch({ control, name: "tags" }) ?? [];

  function addTag(raw: string) {
    const value = raw.trim();
    // Case-insensitive dedup to match the API's normalization (lowercased on
    // upsert), so "Quick" and "quick" don't both survive as chips.
    const exists = tags.some((t) => t.toLowerCase() === value.toLowerCase());
    if (!value || exists || tags.length >= 10) return;
    setValue("tags", [...tags, value]);
  }

  function removeTag(value: string) {
    setValue(
      "tags",
      tags.filter((t) => t !== value)
    );
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
      setTagInput("");
    }
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError("");
    setPhotoUploading(true);
    const localPreview = URL.createObjectURL(file);
    setPhotoPreview(localPreview);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      const result = await res.json();

      if (!res.ok) {
        setPhotoError(result.error || "Failed to upload photo");
        setPhotoPreview(null);
        setValue("photoUrl", undefined);
        return;
      }

      setValue("photoUrl", result.url);
    } catch {
      setPhotoError("Failed to upload photo");
      setPhotoPreview(null);
      setValue("photoUrl", undefined);
    } finally {
      setPhotoUploading(false);
    }
  }

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
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handlePhotoSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={photoUploading}
            className="w-full border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-red transition-colors disabled:opacity-50"
          >
            {photoPreview ? (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                <Image
                  src={photoPreview}
                  alt="Recipe photo preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <>
                <IconCamera size={32} className="mx-auto text-muted mb-2" />
                <p className="text-sm text-muted">
                  {photoUploading ? "Uploading..." : "Add a photo"}
                </p>
              </>
            )}
          </button>
          {photoError && (
            <p className="text-red-dark text-xs mt-1">{photoError}</p>
          )}
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

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium mb-2">Tags</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 bg-red-light text-red-dark text-xs px-2 py-1 rounded-full"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove tag ${tag}`}
                >
                  <IconX size={12} />
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={() => {
              addTag(tagInput);
              setTagInput("");
            }}
            disabled={tags.length >= 10}
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red disabled:opacity-50"
            placeholder="e.g., vegan, quick, dessert (press Enter)"
          />
          {errors.tags && (
            <p className="text-red-dark text-xs mt-1">{errors.tags.message}</p>
          )}
        </div>

        {/* Dietary / allergen info */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Dietary &amp; allergen info
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DIETARY_FIELDS.map(({ name, label }) => (
              <label key={name} className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register(name)} className="accent-red" />
                {label}
              </label>
            ))}
          </div>
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
