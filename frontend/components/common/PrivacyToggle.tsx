"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

export default function PrivacyToggle({
  initialIsPublic,
}: {
  initialIsPublic: boolean;
}) {
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function toggle() {
    if (pending) return;
    setPending(true);
    setFailed(false);
    const next = !isPublic;
    setIsPublic(next);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: next }),
      });
      if (!res.ok) {
        setIsPublic(!next);
        setFailed(true);
      } else {
        router.refresh();
      }
    } catch {
      setIsPublic(!next);
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

  // The switch reads as "Private profile", so it is ON when the profile is NOT public.
  const isPrivate = !isPublic;

  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">Private profile</p>
          <p className="text-xs text-muted mt-1">
            When private, only you can see your recipes, favourites, reviews and
            comments on your profile. Recipes you upload stay visible in Home,
            Trending and search.
          </p>
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          role="switch"
          aria-checked={isPrivate}
          aria-label="Private profile"
          className={clsx(
            "relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50",
            isPrivate ? "bg-red" : "bg-gray-300"
          )}
        >
          <span
            className={clsx(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
              isPrivate ? "left-[1.375rem]" : "left-0.5"
            )}
          />
        </button>
      </div>
      {failed && (
        <p className="mt-2 text-xs text-red">
          Could not save that change. Try again.
        </p>
      )}
    </div>
  );
}
