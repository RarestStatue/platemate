import Link from "next/link";
import { IconClock, IconStar, IconFlame } from "@tabler/icons-react";
import clsx from "clsx";

interface RecipeCardProps {
  id: number;
  title: string;
  prepTimeMin: number;
  avgRating: number;
  photoUrl?: string | null;
  missingCount?: number;
  isSafe?: boolean;
  isPopular?: boolean;
}

export default function RecipeCard({
  id,
  title,
  prepTimeMin,
  avgRating,
  photoUrl,
  missingCount,
  isSafe,
  isPopular,
}: RecipeCardProps) {
  let badge: { text: string; className: string } | null = null;

  if (isPopular) {
    badge = {
      text: "Popular",
      className: "bg-red-light text-red-dark",
    };
  } else if (isSafe) {
    badge = {
      text: "Safe",
      className: "bg-safe-bg text-safe-text",
    };
  } else if (missingCount !== undefined) {
    badge = {
      text: missingCount === 0 ? "0 missing" : `${missingCount} missing`,
      className:
        missingCount === 0
          ? "bg-safe-bg text-safe-text"
          : "bg-warn-bg text-warn-text",
    };
  }

  return (
    <Link
      href={`/recipe/${id}`}
      className="block border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Image placeholder */}
      <div className="aspect-[4/3] bg-gray-100 relative">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted">
            <IconFlame size={32} />
          </div>
        )}
        {badge && (
          <span
            className={clsx(
              "absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full",
              badge.className
            )}
          >
            {badge.text}
          </span>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-sm text-foreground line-clamp-1">
          {title}
        </h3>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted">
          <span className="flex items-center gap-0.5">
            <IconClock size={14} />
            {prepTimeMin} min
          </span>
          <span className="flex items-center gap-0.5">
            <IconStar size={14} className="text-yellow-500" />
            {avgRating.toFixed(1)}
          </span>
        </div>
      </div>
    </Link>
  );
}
