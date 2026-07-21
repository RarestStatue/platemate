import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";

interface HaveIngredientsState {
  have: string[]; // lowercase ingredient names
  setHave: (names: string[]) => void;
  clear: () => void;
}

// No-op storage for SSR/test environments where `sessionStorage` doesn't exist.
const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useHaveIngredientsStore = create<HaveIngredientsState>()(
  persist(
    (set) => ({
      have: [],
      setHave: (names) => set({ have: names.map((n) => n.toLowerCase()) }),
      clear: () => set({ have: [] }),
    }),
    {
      name: "platemate-have-ingredients",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : noopStorage
      ),
    }
  )
);
