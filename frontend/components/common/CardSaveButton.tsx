"use client";

import { useState } from "react";
import { IconHeart, IconHeartFilled } from "@tabler/icons-react";

export default function CardSaveButton({
  recipeId,
  initialSaved,
}: {
  recipeId: number;
  initialSaved: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  async function toggle(e: React.MouseEvent) {
    // The card body is a <Link>; without both of these the click navigates.
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch("/api/saved", {
        method: saved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId }),
      });
      if (res.ok) setSaved(!saved);
    } catch {
      // silent
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className="absolute left-3 top-3 rounded-full bg-cream/90 p-1.5 shadow-sm transition hover:bg-cream disabled:opacity-50"
      aria-label={saved ? "Remove from favourites" : "Save to favourites"}
    >
      {saved ? (
        <IconHeartFilled size={16} className="text-red" />
      ) : (
        <IconHeart size={16} className="text-ink-mute" />
      )}
    </button>
  );
}
