"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const QUICK_CHIPS = [
  { emoji: "🥚", name: "eggs" },
  { emoji: "🧀", name: "feta" },
  { emoji: "🥬", name: "spinach" },
  { emoji: "🍋", name: "lemon" },
];

export default function HomeSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [chips, setChips] = useState<string[]>([]);

  const active = chips.length > 0 || query.trim().length > 0;

  function toggleChip(name: string) {
    setChips((c) => (c.includes(name) ? c.filter((n) => n !== name) : [...c, name]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parts = [...chips];
    const trimmed = query.trim();
    if (trimmed) parts.push(trimmed);
    if (parts.length === 0) return;
    router.push(`/search?q=${encodeURIComponent(parts.join(", "))}`);
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2 rounded-2xl border border-ink/20 bg-white px-4 py-3 shadow-[0_1px_0_0_rgba(0,0,0,0.03)] focus-within:border-ink transition">
          <span aria-hidden className="text-ink-mute">⌕</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="eggs, cheese, spinach…"
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-mute focus:outline-none"
          />
          <button
            type="submit"
            disabled={!active}
            className="inline-flex items-center gap-1 rounded-full bg-ink px-4 py-1.5 text-xs font-medium text-cream transition disabled:cursor-not-allowed disabled:bg-ink/30"
          >
            find
            <span aria-hidden>→</span>
          </button>
        </div>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {QUICK_CHIPS.map((c) => {
          const on = chips.includes(c.name);
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => toggleChip(c.name)}
              className={[
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition",
                on
                  ? "border-ink bg-ink text-cream"
                  : "border-ink/20 bg-white text-ink hover:border-ink/50",
              ].join(" ")}
            >
              <span>{c.emoji}</span>
              <span>{c.name}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => router.push("/search")}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-ink/30 px-3 py-1.5 text-xs text-ink-mute hover:border-ink hover:text-ink"
        >
          + add more
        </button>
      </div>
    </div>
  );
}
