import { describe, it, expect, beforeEach } from "vitest";
import { useServingStore } from "./useServingStore";

beforeEach(() => {
  useServingStore.setState({ originalServings: 1, currentServings: 1 });
});

describe("useServingStore", () => {
  it("sets original and current servings together", () => {
    useServingStore.getState().setOriginalServings(4);
    expect(useServingStore.getState().originalServings).toBe(4);
    expect(useServingStore.getState().currentServings).toBe(4);
  });

  it("clamps setOriginalServings to a minimum of 1", () => {
    useServingStore.getState().setOriginalServings(0);
    expect(useServingStore.getState().originalServings).toBe(1);
  });

  it("increments current servings without touching original", () => {
    useServingStore.getState().setOriginalServings(2);
    useServingStore.getState().increment();
    expect(useServingStore.getState().currentServings).toBe(3);
    expect(useServingStore.getState().originalServings).toBe(2);
  });

  it("decrements current servings but never below 1", () => {
    useServingStore.getState().setOriginalServings(1);
    useServingStore.getState().decrement();
    expect(useServingStore.getState().currentServings).toBe(1);
  });

  it("resets current servings back to original", () => {
    useServingStore.getState().setOriginalServings(3);
    useServingStore.getState().increment();
    useServingStore.getState().increment();
    useServingStore.getState().reset();
    expect(useServingStore.getState().currentServings).toBe(3);
  });

  it("computes scale relative to original servings", () => {
    useServingStore.getState().setOriginalServings(2);
    useServingStore.getState().setCurrentServings(6);
    expect(useServingStore.getState().getScale()).toBe(3);
  });

  it("guards against divide-by-zero when original servings is 0", () => {
    useServingStore.setState({ originalServings: 0, currentServings: 5 });
    expect(useServingStore.getState().getScale()).toBe(1);
  });
});
