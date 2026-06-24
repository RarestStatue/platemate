import { create } from "zustand";

interface ServingState {
  originalServings: number;
  currentServings: number;
  setOriginalServings: (n: number) => void;
  setCurrentServings: (n: number) => void;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  getScale: () => number;
}

export const useServingStore = create<ServingState>((set, get) => ({
  originalServings: 1,
  currentServings: 1,
  setOriginalServings: (n) => set({ originalServings: Math.max(1, n), currentServings: Math.max(1, n) }),
  setCurrentServings: (n) => set({ currentServings: Math.max(1, n) }),
  increment: () =>
    set((s) => ({ currentServings: s.currentServings + 1 })),
  decrement: () =>
    set((s) => ({
      currentServings: Math.max(1, s.currentServings - 1),
    })),
  reset: () => set((s) => ({ currentServings: s.originalServings })),
  getScale: () => {
    const s = get();
    // Guard against divide-by-zero if originalServings is somehow 0
    if (s.originalServings <= 0) return 1;
    return s.currentServings / s.originalServings;
  },
}));
