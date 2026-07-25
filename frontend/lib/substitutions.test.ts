import { describe, it, expect } from "vitest";
import {
  evaluateSubstitute,
  type DietaryFlags,
  type UserRestrictions,
} from "./substitutions";

function sub(overrides: Partial<DietaryFlags> = {}): DietaryFlags {
  return {
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    dairyFree: false,
    ...overrides,
  };
}

function restrictions(
  overrides: Partial<UserRestrictions> = {}
): UserRestrictions {
  return {
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    dairyFree: false,
    ...overrides,
  };
}

describe("evaluateSubstitute", () => {
  it("returns unknown when the viewer has no restrictions record", () => {
    expect(evaluateSubstitute(sub({ vegan: true }), null)).toEqual({
      verdict: "unknown",
      reasons: [],
    });
  });

  it("returns unknown when every restriction flag is false", () => {
    expect(evaluateSubstitute(sub({ vegan: true }), restrictions())).toEqual({
      verdict: "unknown",
      reasons: [],
    });
  });

  it("flags a conflict when the substitute breaks a required diet", () => {
    const result = evaluateSubstitute(
      sub({ vegan: false }),
      restrictions({ vegan: true })
    );
    expect(result.verdict).toBe("conflict");
    expect(result.reasons).toContain("not vegan");
  });

  it("lists every violated restriction", () => {
    const result = evaluateSubstitute(
      sub(),
      restrictions({ vegan: true, glutenFree: true })
    );
    expect(result.verdict).toBe("conflict");
    expect(result.reasons).toHaveLength(2);
  });

  it("returns compatible when the substitute satisfies exactly what was required", () => {
    const result = evaluateSubstitute(
      sub({ vegetarian: true }),
      restrictions({ vegetarian: true })
    );
    expect(result).toEqual({ verdict: "compatible", reasons: ["vegetarian"] });
  });

  it("returns improves when the substitute satisfies an extra diet flag", () => {
    const result = evaluateSubstitute(
      sub({ vegetarian: true, vegan: true }),
      restrictions({ vegetarian: true })
    );
    expect(result.verdict).toBe("improves");
    expect(result.reasons).toContain("vegan");
  });

  it("prefers a conflict over a bonus when both apply", () => {
    const result = evaluateSubstitute(
      sub({ dairyFree: false, vegan: true }),
      restrictions({ dairyFree: true })
    );
    expect(result.verdict).toBe("conflict");
    expect(result.reasons).toContain("not dairy-free");
  });
});
