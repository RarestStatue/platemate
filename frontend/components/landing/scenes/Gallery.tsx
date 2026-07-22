"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "motion/react";
import DrawnPlate from "../motion/DrawnPlate";

type Card = {
  title: string;
  time: string;
  uses: number;
  total: number;
  variant: "eggs" | "greens" | "citrus" | "grain" | "beans" | "cheese";
  hint: string;
  ingredients: string[];
};

const CARDS: Card[] = [
  {
    title: "greek spinach omelette",
    time: "12 min",
    uses: 4,
    total: 4,
    variant: "greens",
    hint: "the 'I have eggs' rescue.",
    ingredients: ["eggs", "spinach", "feta", "olive oil"],
  },
  {
    title: "lemon feta frittata",
    time: "20 min",
    uses: 3,
    total: 6,
    variant: "citrus",
    hint: "half a lemon, hunk of feta.",
    ingredients: ["eggs", "lemon", "feta", "herbs", "onion", "butter"],
  },
  {
    title: "cheddar egg fried rice",
    time: "15 min",
    uses: 5,
    total: 5,
    variant: "grain",
    hint: "yesterday's rice, redeemed.",
    ingredients: ["rice", "eggs", "cheddar", "onion", "soy sauce"],
  },
  {
    title: "melty grilled cheese",
    time: "8 min",
    uses: 2,
    total: 3,
    variant: "cheese",
    hint: "cold, portable, still good.",
    ingredients: ["bread", "cheddar", "pickle"],
  },
  {
    title: "spinach & bean stew",
    time: "22 min",
    uses: 3,
    total: 6,
    variant: "beans",
    hint: "one can, one leaf, twenty minutes.",
    ingredients: ["beans", "greens", "onion", "garlic", "tomatoes", "chilli"],
  },
  {
    title: "any-fridge rice bowl",
    time: "10 min",
    uses: 4,
    total: 5,
    variant: "eggs",
    hint: "the 11pm bowl you lie about.",
    ingredients: ["rice", "egg", "sesame", "anything green", "chilli"],
  },
];

export default function Gallery() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const progressBar = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section
      ref={ref}
      id="recipes"
      className="relative bg-paper"
      style={{ height: `${CARDS.length * 90}vh` }}
      aria-label="Recipe gallery"
    >
      <div className="sticky top-0 grid h-screen grid-rows-[auto_1fr_auto] overflow-hidden">
        {/* Ambient */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 45% at 25% 40%, rgba(59,90,63,0.06), transparent 70%), radial-gradient(50% 40% at 80% 65%, rgba(198,70,32,0.05), transparent 70%)",
          }}
        />

        {/* Chapter head */}
        <div className="relative z-30 mx-auto w-full max-w-[1320px] px-5 pt-6 sm:px-10 sm:pt-10">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-ink-mute">
            <span>Chapter V · this week&apos;s plates</span>
            <span className="hidden sm:inline">Gallery · pp. 12–17</span>
            <span className="font-serif italic text-ink">Fig. 05</span>
          </div>
          <div className="mx-auto mt-4 h-px w-[min(80vw,720px)] overflow-hidden bg-ink/15">
            <motion.div
              className="h-full origin-left bg-matcha"
              style={{ width: progressBar }}
            />
          </div>
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-[1320px] items-start overflow-hidden px-5 pt-4 sm:px-10 sm:pt-6">
          <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Left: live meta */}
          <div className="lg:col-span-5">
            <p className="eyebrow mb-5">from real fridges</p>
            <h2 className="display text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.98] text-ink">
              six dinners.
              <br />
              <span className="italic text-matcha">no receipts.</span>
            </h2>

            <div className="mt-10 border-t border-ink/15 pt-8">
              <div className="text-[10px] uppercase tracking-[0.28em] text-ink-mute">
                now showing
              </div>
              <LiveMeta scrollYProgress={scrollYProgress} />
            </div>

            {/* Index dots */}
            <div className="mt-8 flex items-center gap-1.5">
              {CARDS.map((_, i) => (
                <IndexDot
                  key={i}
                  index={i}
                  total={CARDS.length}
                  scrollYProgress={scrollYProgress}
                />
              ))}
            </div>

            <p className="mt-8 max-w-sm text-sm text-ink-mute">
              Scroll to browse. Each plate lists what came out of the fridge -
              not what you had to buy.
            </p>
          </div>

          {/* Right: card stack */}
          <div className="relative lg:col-span-7">
            <div className="relative mx-auto flex aspect-[4/5] max-w-[420px] items-center justify-center">
              {CARDS.map((c, i) => (
                <StackCard
                  key={c.title}
                  card={c}
                  index={i}
                  total={CARDS.length}
                  scrollYProgress={scrollYProgress}
                  reduce={!!reduce}
                />
              ))}
            </div>
            {/* TODO note for the team */}
            <div className="mx-auto mt-24 max-w-[420px] rounded-md border border-dashed border-ember/60 bg-ember/5 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ember">
              TODO: feature 6 recipes from the database each week
            </div>
          </div>
          </div>
        </div>

        {/* Bottom caption */}
        <div className="relative z-30 mx-auto w-full max-w-[1320px] px-5 pb-6 sm:px-10 sm:pb-10">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-ink-mute">
            <span>illustrated by us · plated by you</span>
            <span className="font-serif italic text-ink">continue ↓</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────
   Live meta (title + time) driven by scroll
   ──────────────────────────────── */
function LiveMeta({
  scrollYProgress,
}: {
  scrollYProgress: MotionValue<number>;
}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const update = (v: number) => {
      const n = Math.min(CARDS.length - 1, Math.floor(v * CARDS.length));
      setI(Math.max(0, n));
    };
    update(scrollYProgress.get());
    return scrollYProgress.on("change", update);
  }, [scrollYProgress]);
  const card = CARDS[i];

  return (
    <div className="min-h-[7rem]">
      <div className="flex items-baseline justify-between gap-4">
        <motion.h3
          key={card.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="font-serif text-2xl leading-tight text-ink sm:text-3xl"
        >
          {card.title}
        </motion.h3>
        <motion.span
          key={`t-${card.title}`}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="shrink-0 rounded-full bg-ink px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-cream"
        >
          {card.time}
        </motion.span>
      </div>
      <motion.p
        key={`h-${card.title}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mt-2 font-serif text-lg italic text-ink-mute"
      >
        {card.hint}
      </motion.p>
      <motion.div
        key={`ing-${card.title}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-4 flex flex-wrap gap-1.5"
      >
        {card.ingredients.map((ing) => (
          <span
            key={ing}
            className="rounded-full border border-ink/15 bg-cream/70 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-ink-soft"
          >
            {ing}
          </span>
        ))}
      </motion.div>
      <div className="mt-3 text-[10px] uppercase tracking-[0.24em] text-ink-mute">
        №{String(i + 1).padStart(2, "0")} / {String(CARDS.length).padStart(2, "0")}
      </div>
    </div>
  );
}

/* ────────────────────────────────
   Index dots
   ──────────────────────────────── */
function IndexDot({
  index,
  total,
  scrollYProgress,
}: {
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
}) {
  const start = index / total;
  const end = (index + 1) / total;
  const opacity = useTransform(scrollYProgress, [start - 0.02, start, end], [0.2, 1, 0.4]);
  return (
    <motion.span
      style={{ opacity }}
      className="inline-block h-1 w-6 rounded-full bg-ink"
    />
  );
}

/* ────────────────────────────────
   Card in the stack
   ──────────────────────────────── */
function StackCard({
  card,
  index,
  total,
  scrollYProgress,
  reduce,
}: {
  card: Card;
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
  reduce: boolean;
}) {
  const start = index / total;
  const end = (index + 1) / total;
  const preStack = Math.max(0, start - 0.06);
  const postExit = Math.min(1, end + 0.06);

  // Behind (stacked): slight y+scale offset. Active: at rest. Exit: up+rotate+fade.
  const y = useTransform(
    scrollYProgress,
    [preStack, start, end, postExit],
    [40 + index * 6, 0, 0, -320]
  );
  const rotate = useTransform(
    scrollYProgress,
    [preStack, start, end, postExit],
    [(index % 2 === 0 ? -1 : 1) * (3 + index), 0, 0, -18]
  );
  const scale = useTransform(
    scrollYProgress,
    [preStack, start, end, postExit],
    [0.94, 1, 1, 0.94]
  );
  const opacity = useTransform(
    scrollYProgress,
    [Math.max(0, preStack - 0.02), start, end - 0.02, postExit],
    [0.55, 1, 1, 0]
  );

  const style = reduce
    ? { zIndex: total - index }
    : { y, rotate, scale, opacity, zIndex: total - index };

  return (
    <motion.article
      style={style}
      className="absolute inset-0 flex flex-col rounded-[24px] border border-ink/12 bg-white p-4 shadow-[0_2px_0_0_rgba(0,0,0,0.03),0_40px_80px_-40px_rgba(0,0,0,0.35)] sm:p-5"
    >
      {/* Corner tape */}
      <span
        aria-hidden
        className="absolute -top-2 left-1/2 h-4 w-16 -translate-x-1/2 bg-cream/90 opacity-70 shadow-sm"
        style={{ transform: "translateX(-50%) rotate(-3deg)" }}
      />
      {/* Plate */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-paper">
        <div className="absolute inset-0 flex items-center justify-center">
          <DrawnPlate variant={card.variant} size={280} animated={false} />
        </div>
        <span className="absolute left-3 top-3 rounded-full bg-cream/95 px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] text-ink">
          {card.uses}/{card.total} match
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-ink/90 px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] text-cream">
          {card.time}
        </span>
        <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-ink-mute">
          №{String(index + 1).padStart(2, "0")}
        </span>
      </div>

      {/* Caption */}
      <div className="mt-4 px-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate font-serif text-xl leading-tight text-ink sm:text-2xl">
            {card.title}
          </h3>
        </div>
        <p className="mt-1 font-serif text-sm italic leading-snug text-ink-mute">
          {card.hint}
        </p>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-ink/10">
          <div
            className="h-full bg-matcha"
            style={{ width: `${(card.uses / card.total) * 100}%` }}
          />
        </div>
      </div>
    </motion.article>
  );
}
