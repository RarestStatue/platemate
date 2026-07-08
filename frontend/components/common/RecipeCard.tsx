import Link from "next/link";
import Image from "next/image";
import { IconClock, IconStar, IconFlame, IconAlertTriangle } from "@tabler/icons-react";
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
  rank?: number;
  allergens?: string[];
}

/**
 * Editorial recipe card.
 * Hairline border, tall 4:5 image, tiny caps meta.
 */
export default function RecipeCard({
  id,
  title,
  prepTimeMin,
  avgRating,
  photoUrl,
  missingCount,
  isSafe,
  isPopular,
  rank,
  allergens,
}: RecipeCardProps) {
  let badge: { text: string; className: string } | null = null;

  if (isPopular) {
    badge = {
      text: "Popular",
      className: "bg-cream text-ink border border-ink/10",
    };
  } else if (isSafe) {
    badge = {
      text: "0 missing",
      className: "bg-matcha text-cream",
    };
  } else if (missingCount !== undefined) {
    badge = {
      text: missingCount === 0 ? "0 missing" : `${missingCount} missing`,
      className:
        missingCount === 0
          ? "bg-matcha text-cream"
          : "bg-warn-bg text-warn-text",
    };
  }

  return (
    <Link
      href={`/recipe/${id}`}
      className="group block"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-paper">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-mute">
            <IconFlame size={40} strokeWidth={1.25} />
          </div>
        )}

        {rank !== undefined && (
          <span className="absolute left-3 top-3 font-serif text-3xl leading-none text-cream mix-blend-difference">
            №{String(rank).padStart(2, "0")}
          </span>
        )}

        {badge && (
          <span
            className={clsx(
              "absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em]",
              badge.className
            )}
          >
            {badge.text}
          </span>
        )}
      </div>

      <div className="mt-3">
        <h3 className="font-serif text-xl leading-tight text-ink line-clamp-2 transition-colors group-hover:text-matcha">
          {title}
        </h3>
        <div className="mt-1.5 flex items-center gap-3 text-[11px] uppercase tracking-[0.14em] text-ink-mute">
          <span className="inline-flex items-center gap-1">
            <IconClock size={13} strokeWidth={1.5} />
            {prepTimeMin} min
          </span>
          <span aria-hidden className="h-3 w-px bg-ink/20" />
          <span className="inline-flex items-center gap-1">
            <IconStar size={13} strokeWidth={1.5} className="text-ink" />
            {avgRating.toFixed(1)}
          </span>
        </div>

        {allergens && allergens.length > 0 && (
          <div
            className="mt-1.5 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-warn-text"
            title={`Contains ${allergens.join(", ")}`}
          >
            <IconAlertTriangle size={13} strokeWidth={1.5} />
            {allergens.length === 1 ? allergens[0] : `${allergens.length} allergens`}
          </div>
        )}
      </div>
    </Link>
  );
}
