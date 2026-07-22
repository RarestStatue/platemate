"use client";

import { useState } from "react";
import DrawnPlate from "./DrawnPlate";
import type { WeeklyRecipe } from "@/lib/landing-recipes";

type PlateImageRecipe = Pick<WeeklyRecipe, "title" | "photoUrl" | "variant">;

export default function PlateImage({
  recipe,
  size,
}: {
  recipe: PlateImageRecipe;
  size: number;
}) {
  const [broken, setBroken] = useState(false);

  if (recipe.photoUrl && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={recipe.photoUrl}
        alt={recipe.title}
        onError={() => setBroken(true)}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    );
  }
  return <DrawnPlate variant={recipe.variant} size={size} animated={false} />;
}
