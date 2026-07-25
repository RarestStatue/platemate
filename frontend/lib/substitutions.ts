export interface DietaryFlags {
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
}

export interface UserRestrictions {
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
}

export type DietaryVerdict = "compatible" | "conflict" | "improves" | "unknown";

const LABELS: Record<keyof DietaryFlags, string> = {
  vegetarian: "vegetarian",
  vegan: "vegan",
  glutenFree: "gluten-free",
  dairyFree: "dairy-free",
};

/**
 * Compare a substitute's dietary flags against the viewer's restrictions.
 *
 * - "conflict": the viewer requires a diet the substitute does not satisfy.
 * - "improves": the substitute satisfies a diet flag the viewer did not ask for.
 * - "compatible": every restriction the viewer set is satisfied.
 * - "unknown": the viewer set no restrictions (nothing to check against).
 */
export function evaluateSubstitute(
  sub: DietaryFlags,
  restrictions: UserRestrictions | null
): { verdict: DietaryVerdict; reasons: string[] } {
  if (!restrictions) return { verdict: "unknown", reasons: [] };

  const keys = Object.keys(LABELS) as (keyof DietaryFlags)[];
  const required = keys.filter((k) => restrictions[k]);
  if (required.length === 0) return { verdict: "unknown", reasons: [] };

  const violated = required.filter((k) => !sub[k]);
  if (violated.length > 0) {
    return {
      verdict: "conflict",
      reasons: violated.map((k) => `not ${LABELS[k]}`),
    };
  }

  const bonus = keys.filter((k) => !restrictions[k] && sub[k]);
  if (bonus.length > 0) {
    return { verdict: "improves", reasons: bonus.map((k) => LABELS[k]) };
  }

  return {
    verdict: "compatible",
    reasons: required.map((k) => LABELS[k]),
  };
}
