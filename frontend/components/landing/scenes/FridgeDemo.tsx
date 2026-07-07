"use client";

import { useMemo, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
} from "motion/react";
import DrawnPlate from "../motion/DrawnPlate";

type Ing = { emoji: string; name: string; qty: string };
type Recipe = {
  title: string;
  time: string;
  needs: string[];
  variant: "eggs" | "greens" | "citrus" | "grain" | "beans" | "cheese";
  hint: string;
};

const POOL: Ing[] = [
  { emoji: "🥚", name: "eggs", qty: "×6" },
  { emoji: "🧀", name: "cheddar", qty: "block" },
  { emoji: "🥬", name: "spinach", qty: "handful" },
  { emoji: "🍋", name: "lemon", qty: "½" },
  { emoji: "🧅", name: "onion", qty: "×2" },
  { emoji: "🍅", name: "tomatoes", qty: "×3" },
  { emoji: "🍚", name: "rice", qty: "1 cup" },
  { emoji: "🥔", name: "potato", qty: "×3" },
  { emoji: "🌶️", name: "chilli", qty: "×1" },
  { emoji: "🌿", name: "parsley", qty: "sprig" },
  { emoji: "🥕", name: "carrot", qty: "×1" },
  { emoji: "🧄", name: "garlic", qty: "×3" },
];

const RECIPES: Recipe[] = [
  {
    title: "greek spinach omelette",
    time: "12 min",
    needs: ["eggs", "spinach", "cheddar", "lemon"],
    variant: "greens",
    hint: "the 'I have eggs' rescue",
  },
  {
    title: "cheddar egg fried rice",
    time: "15 min",
    needs: ["eggs", "cheddar", "onion", "rice", "spinach"],
    variant: "grain",
    hint: "yesterday's rice, redeemed",
  },
  {
    title: "lemon feta frittata",
    time: "20 min",
    needs: ["eggs", "cheddar", "lemon", "onion", "spinach", "chilli"],
    variant: "citrus",
    hint: "half a lemon, hunk of feta",
  },
  {
    title: "shakshuka",
    time: "18 min",
    needs: ["eggs", "onion", "tomatoes", "chilli", "spinach", "parsley"],
    variant: "eggs",
    hint: "one pan, one crusty loaf",
  },
  {
    title: "melty grilled cheese",
    time: "8 min",
    needs: ["cheddar", "onion", "tomatoes"],
    variant: "cheese",
    hint: "cold, portable, still good",
  },
  {
    title: "potato hash",
    time: "22 min",
    needs: ["potato", "onion", "chilli", "cheddar", "spinach"],
    variant: "grain",
    hint: "the sunday-morning save",
  },
];

const DEFAULT_ORDER = POOL.map((i) => i.name);

export default function FridgeDemo() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [autoCount, setAutoCount] = useState(0);
  const [override, setOverride] = useState<string[] | null>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Scroll drives auto-population of first N chips.
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = Math.min(DEFAULT_ORDER.length, Math.max(0, Math.floor(v * 14)));
    setAutoCount(next);
  });

  const picked = override ?? DEFAULT_ORDER.slice(0, autoCount);

  const toggle = (name: string) => {
    const base = override ?? DEFAULT_ORDER.slice(0, autoCount);
    setOverride(
      base.includes(name) ? base.filter((n) => n !== name) : [...base, name]
    );
  };

  const ranked = useMemo(() => {
    const set = new Set(picked);
    return RECIPES.map((r) => {
      const hits = r.needs.filter((n) => set.has(n)).length;
      return { ...r, hits };
    })
      .sort((a, b) => {
        if (b.hits !== a.hits) return b.hits - a.hits;
        return a.needs.length - b.needs.length;
      })
      .slice(0, 5);
  }, [picked]);

  const progressBar = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section
      ref={ref}
      id="demo"
      className="relative bg-cream"
      style={{ height: "260vh" }}
      aria-label="Interactive fridge demo"
    >
      <div className="sticky top-0 grid h-screen grid-rows-[auto_1fr_auto] overflow-hidden">
        {/* Ambient wash */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(50% 40% at 25% 45%, rgba(59,90,63,0.06), transparent 70%), radial-gradient(50% 40% at 80% 60%, rgba(198,70,32,0.04), transparent 75%)",
          }}
        />

        {/* Chapter head */}
        <div className="relative z-20 mx-auto w-full max-w-[1320px] px-5 pt-6 sm:px-10 sm:pt-10">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-ink-mute">
            <span>Chapter II · the demo</span>
            <span className="hidden sm:inline">Feature · pp. 04–05</span>
            <span className="font-serif italic text-ink">Fig. 02</span>
          </div>
          <div className="mx-auto mt-4 h-px w-[min(80vw,720px)] overflow-hidden bg-ink/15">
            <motion.div
              className="h-full origin-left bg-matcha"
              style={{ width: progressBar }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto flex w-full max-w-[1320px] items-start overflow-hidden px-5 pt-4 sm:px-10 sm:pt-6">
          <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          {/* LEFT: fridge */}
          <div className="lg:col-span-6">
            <div className="mb-3 flex items-baseline justify-between">
              <p className="eyebrow">your fridge</p>
              <span className="text-[10px] uppercase tracking-[0.24em] text-ink-mute">
                tap to toggle
              </span>
            </div>

            <div className="relative rounded-[28px] border border-ink/12 bg-paper p-4 shadow-[0_1px_0_0_rgba(0,0,0,0.03),0_30px_60px_-40px_rgba(0,0,0,0.35)] sm:p-6">
              {/* Fridge head */}
              <div className="mb-4 flex items-center justify-between border-b border-ink/10 pb-3">
                <div className="flex items-center gap-2">
                  <motion.span
                    className="inline-block h-1.5 w-1.5 rounded-full bg-matcha"
                    animate={reduce ? undefined : { opacity: [1, 0.35, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-[10px] uppercase tracking-[0.24em] text-ink-mute">
                    cold storage · 4°c
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[10px] uppercase tracking-[0.24em] text-ink-mute">
                    picked
                  </span>
                  <motion.span
                    key={picked.length}
                    initial={{ scale: 0.75, opacity: 0.4, y: -3 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 320, damping: 16 }}
                    className="font-serif text-2xl leading-none text-ink"
                  >
                    {picked.length}
                  </motion.span>
                  <span className="text-[10px] uppercase tracking-[0.24em] text-ink-mute">
                    /{POOL.length}
                  </span>
                </div>
              </div>

              {/* Chip grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                {POOL.map((ing) => {
                  const on = picked.includes(ing.name);
                  return (
                    <motion.button
                      key={ing.name}
                      type="button"
                      onClick={() => toggle(ing.name)}
                      whileTap={reduce ? undefined : { scale: 0.94 }}
                      whileHover={reduce ? undefined : { y: -2 }}
                      animate={{
                        backgroundColor: on
                          ? "var(--color-ink)"
                          : "var(--color-cream)",
                        color: on
                          ? "var(--color-cream)"
                          : "var(--color-ink)",
                        borderColor: on
                          ? "var(--color-ink)"
                          : "rgba(11,11,10,0.12)",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 22,
                      }}
                      className="relative flex items-center justify-between rounded-xl border px-2.5 py-2.5 text-left"
                      aria-pressed={on}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <motion.span
                          animate={
                            on
                              ? { rotate: [0, -14, 8, 0], scale: [1, 1.2, 1] }
                              : { rotate: 0, scale: 1 }
                          }
                          transition={{ duration: 0.5 }}
                          className="inline-block text-lg leading-none"
                        >
                          {ing.emoji}
                        </motion.span>
                        <span className="truncate text-sm">{ing.name}</span>
                      </span>
                      <span
                        className={
                          on
                            ? "text-[10px] text-cream/70"
                            : "text-[10px] text-ink-mute"
                        }
                      >
                        {ing.qty}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Search bar mock */}
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-ink/12 bg-white px-3 py-2.5 text-sm text-ink-mute">
                <span aria-hidden>⌕</span>
                <span className="flex-1 truncate">
                  <AnimatePresence mode="popLayout">
                    {picked.length ? (
                      <motion.span
                        key={picked.join(",")}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.24 }}
                      >
                        {picked.join(", ")}
                      </motion.span>
                    ) : (
                      <motion.span
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        scroll or tap what you have…
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                <span className="rounded-full bg-matcha px-3 py-1 text-xs font-medium text-cream">
                  find
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: recipe stream */}
          <div className="lg:col-span-6">
            <div className="mb-3 flex items-baseline justify-between">
              <p className="eyebrow">best matches</p>
              <span className="relative inline-block text-[10px] uppercase tracking-[0.24em] text-ink-mute">
                live
                <span className="sweep absolute -bottom-0.5 left-0 block h-px w-full bg-matcha" />
              </span>
            </div>

            <ul className="space-y-2.5">
              <AnimatePresence initial={false}>
                {ranked.map((r, i) => (
                  <RecipeCard
                    key={r.title}
                    recipe={r}
                    index={i}
                    reduce={!!reduce}
                  />
                ))}
              </AnimatePresence>
            </ul>

            {/* Empty hint */}
            <AnimatePresence>
              {picked.length === 0 && (
                <motion.p
                  key="empty-hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 font-serif text-sm italic text-ink-mute"
                >
                  keep scrolling — we&apos;ll fill the shelves.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          </div>
        </div>

        {/* Caption swap */}
        <div className="relative z-20 mx-auto w-full max-w-[1320px] px-5 pb-6 sm:px-10 sm:pb-10">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-ink-mute">
            <span>
              <span className="font-serif text-base not-italic italic text-ink">
                {picked.length}
              </span>
              <span className="ml-1">ingredients</span>
            </span>
            <div className="hidden flex-1 px-6 sm:block">
              <div className="h-px w-full bg-ink/12" />
            </div>
            <span>
              <span className="font-serif text-base not-italic italic text-ink">
                {ranked.filter((r) => r.hits > 0).length}
              </span>
              <span className="ml-1">dinners waiting</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function RecipeCard({
  recipe,
  index,
  reduce,
}: {
  recipe: Recipe & { hits: number };
  index: number;
  reduce: boolean;
}) {
  const pct = Math.round((recipe.hits / recipe.needs.length) * 100);
  const missing = recipe.needs.length - recipe.hits;

  return (
    <motion.li
      layout
      initial={reduce ? undefined : { opacity: 0, y: 12 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, y: -8 }}
      transition={{
        layout: { type: "spring", stiffness: 240, damping: 26 },
        opacity: { duration: 0.4, delay: index * 0.04 },
        y: { duration: 0.4, delay: index * 0.04 },
      }}
      whileHover={reduce ? undefined : { x: 4 }}
      className="flex items-center gap-4 rounded-2xl border border-ink/12 bg-cream p-3 pr-4 shadow-[0_1px_0_0_rgba(0,0,0,0.02)]"
    >
      {/* Mini plate */}
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-paper">
        <DrawnPlate variant={recipe.variant} size={72} animated={false} />
      </div>

      {/* Meta */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate font-serif text-lg leading-tight text-ink sm:text-xl">
            {recipe.title}
          </h3>
          <span className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-ink-mute">
            {recipe.time}
          </span>
        </div>
        <p className="mt-0.5 truncate font-serif text-sm italic text-ink-mute">
          {recipe.hint}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-ink/10">
            <motion.div
              className="h-full bg-matcha"
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={{ type: "spring", stiffness: 180, damping: 24 }}
            />
          </div>
          <span className="w-8 text-right text-[10px] uppercase tracking-[0.2em] text-ink-mute tabular-nums">
            {pct}%
          </span>
        </div>
      </div>

      {/* Match badge */}
      <div className="hidden shrink-0 text-right sm:block">
        <motion.div
          key={recipe.hits}
          initial={{ scale: 0.7, opacity: 0.4 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 18 }}
          className="font-serif text-2xl leading-none text-ink"
        >
          {recipe.hits}
          <span className="text-ink-mute">/{recipe.needs.length}</span>
        </motion.div>
        <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-ink-mute">
          {missing > 0 ? `${missing} to swap` : "ready"}
        </div>
      </div>
    </motion.li>
  );
}
