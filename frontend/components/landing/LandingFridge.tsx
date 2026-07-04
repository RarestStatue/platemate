"use client";

import { useMemo, useState } from "react";

type Ing = { emoji: string; name: string; qty: string };

const POOL: Ing[] = [
  { emoji: "🥚", name: "eggs", qty: "×6" },
  { emoji: "🧅", name: "onion", qty: "×2" },
  { emoji: "🍅", name: "tomatoes", qty: "×3" },
  { emoji: "🧀", name: "cheddar", qty: "block" },
  { emoji: "🥬", name: "spinach", qty: "handful" },
  { emoji: "🍋", name: "lemon", qty: "½" },
  { emoji: "🌶️", name: "chilli", qty: "×1" },
  { emoji: "🥕", name: "carrot", qty: "×1" },
  { emoji: "🥔", name: "potato", qty: "×3" },
  { emoji: "🌿", name: "parsley", qty: "sprig" },
];

const RECIPES = [
  { name: "greek spinach omelette", time: "12 min", match: 4, total: 4 },
  { name: "lemon feta frittata", time: "20 min", match: 3, total: 6 },
  { name: "shakshuka", time: "18 min", match: 5, total: 6 },
  { name: "cheddar potato hash", time: "22 min", match: 4, total: 5 },
];

export default function LandingFridge() {
  const [picked, setPicked] = useState<string[]>(["eggs", "spinach", "cheddar", "lemon"]);

  const toggle = (name: string) =>
    setPicked((p) => (p.includes(name) ? p.filter((n) => n !== name) : [...p, name]));

  const matches = useMemo(() => {
    return RECIPES.map((r) => ({
      ...r,
      score: Math.min(r.match, picked.length),
    }));
  }, [picked.length]);

  return (
    <div className="relative">
      {/* Postmark tag */}
      <div className="absolute -top-3 left-6 z-10 rotate-[-4deg] rounded-sm bg-ember px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-cream shadow-sm">
        Live demo · tap chips
      </div>

      <div className="rounded-2xl border border-ink/15 bg-cream p-6 shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_20px_60px_-30px_rgba(0,0,0,0.35)]">
        {/* Header row */}
        <div className="flex items-center justify-between border-b border-ink/10 pb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-mute">
              Your fridge
            </div>
            <div className="font-serif text-2xl leading-tight">what's in it?</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-mute">picked</div>
            <div className="font-serif text-2xl leading-tight">{picked.length}</div>
          </div>
        </div>

        {/* Ingredient grid */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {POOL.slice(0, 6).map((i) => {
            const on = picked.includes(i.name);
            return (
              <button
                key={i.name}
                type="button"
                onClick={() => toggle(i.name)}
                className={[
                  "flex items-center justify-between rounded-xl border px-3 py-3 text-left transition",
                  on
                    ? "border-ink bg-ink text-cream"
                    : "border-ink/15 bg-white text-ink hover:border-ink/40",
                ].join(" ")}
              >
                <span className="flex items-center gap-2">
                  <span className="text-xl">{i.emoji}</span>
                  <span className="text-sm">{i.name}</span>
                </span>
                <span className={on ? "text-[10px] text-cream/70" : "text-[10px] text-ink-mute"}>
                  {i.qty}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search bar mock */}
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink-mute">
          <span aria-hidden>⌕</span>
          <span className="flex-1 truncate">
            {picked.length ? picked.join(", ") : "type or tap what you have…"}
          </span>
          <span className="rounded-full bg-matcha px-3 py-1 text-xs font-medium text-cream">
            find
          </span>
        </div>

        {/* Results ranked */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-ink-mute">
            <span>Best matches</span>
            <span className="relative inline-block">
              live
              <span className="sweep absolute -bottom-0.5 left-0 block h-px w-full bg-matcha" />
            </span>
          </div>
          <ul className="space-y-2">
            {matches.map((r) => (
              <li
                key={r.name}
                className="flex items-center justify-between rounded-xl border border-ink/10 bg-cream/60 px-3 py-2.5"
              >
                <div>
                  <div className="font-serif text-lg leading-tight">{r.name}</div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-ink-mute">
                    {r.time}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-serif text-lg leading-none">
                    {r.score}
                    <span className="text-ink-mute">/{r.total}</span>
                  </div>
                  <div className="mt-1 h-1 w-16 overflow-hidden rounded-full bg-ink/10">
                    <div
                      className="h-full bg-matcha transition-[width]"
                      style={{ width: `${(r.score / r.total) * 100}%` }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Floating side notation */}
      <div className="absolute -right-3 top-1/3 hidden rotate-90 origin-right text-[10px] uppercase tracking-[0.28em] text-ink-mute lg:block">
        Fig. 01 · fridge → dinner
      </div>
    </div>
  );
}
