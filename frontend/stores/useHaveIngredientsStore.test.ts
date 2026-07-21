import { describe, it, expect, beforeEach } from "vitest";
import { useHaveIngredientsStore } from "./useHaveIngredientsStore";

beforeEach(() => {
  useHaveIngredientsStore.setState({ have: [] });
});

describe("useHaveIngredientsStore", () => {
  it("starts with an empty have-list", () => {
    expect(useHaveIngredientsStore.getState().have).toEqual([]);
  });

  it("sets the have-list, lowercasing every name", () => {
    useHaveIngredientsStore.getState().setHave(["Garlic", "EGG"]);
    expect(useHaveIngredientsStore.getState().have).toEqual(["garlic", "egg"]);
  });

  it("overwrites the previous have-list on a new set", () => {
    useHaveIngredientsStore.getState().setHave(["garlic"]);
    useHaveIngredientsStore.getState().setHave(["flour", "butter"]);
    expect(useHaveIngredientsStore.getState().have).toEqual(["flour", "butter"]);
  });

  it("clears the have-list", () => {
    useHaveIngredientsStore.getState().setHave(["garlic"]);
    useHaveIngredientsStore.getState().clear();
    expect(useHaveIngredientsStore.getState().have).toEqual([]);
  });
});
