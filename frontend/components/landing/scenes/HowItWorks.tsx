"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  AnimatePresence,
  type MotionValue,
} from "motion/react";
import { useEffect, useState } from "react";

type Pillar = {
  n: string;
  tag: string;
  title: string;
  body: string;
  stat: { n: string; label: string };
};

const PILLARS: Pillar[] = [
  {
    n: "01",
    tag: "speed",
    title: "ready in the time it takes to reheat leftovers.",
    body: "Sort by 10-minute snacks up to weekend feasts. No epic marinades, no niche gadgets — food you can make between lectures.",
    stat: { n: "17 min", label: "median cook time across the index" },
  },
  {
    n: "02",
    tag: "substitutions",
    title: "one missing ingredient? we swap it.",
    body: "Ran out of soy sauce? Fine. Platemate suggests the closest sub from what's already in your cupboard. No emergency Loblaws runs.",
    stat: { n: "3.4", label: "average swap suggestions per recipe" },
  },
  {
    n: "03",
    tag: "shared kitchens",
    title: "built for the flatmate who won't eat onions.",
    body: "Filters for vegan, halal, gluten-free, or that flatmate who says they're allergic to onions. Everyone eats. Nobody argues.",
    stat: { n: "12", label: "diet & allergy filters, no upcharge" },
  },
];

export default function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const trackX = useTransform(scrollYProgress, [0, 1], ["0vw", "-200vw"]);
  const progressBar = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section
      ref={ref}
      id="how"
      className="relative bg-cream"
      style={{ height: "320vh" }}
      aria-label="How platemate works"
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        {/* Chapter masthead */}
        <div className="pointer-events-none absolute inset-x-0 top-6 z-30 mx-auto flex max-w-[1320px] items-center justify-between px-5 text-[10px] uppercase tracking-[0.28em] text-ink-mute sm:top-10 sm:px-10">
          <span>Chapter IV · the method</span>
          <span className="hidden sm:inline">Feature · pp. 08–10</span>
          <span className="font-serif italic text-ink">Fig. 04</span>
        </div>

        {/* Progress ruler */}
        <div className="pointer-events-none absolute left-1/2 top-14 z-30 h-px w-[min(80vw,720px)] -translate-x-1/2 overflow-hidden bg-ink/15 sm:top-20">
          <motion.div
            className="h-full origin-left bg-matcha"
            style={{ width: progressBar }}
          />
        </div>

        {/* Horizontal track */}
        <motion.div
          className="flex h-full w-[300vw] will-change-transform"
          style={{ x: reduce ? "0vw" : trackX }}
        >
          {PILLARS.map((p, i) => (
            <PillarPanel key={p.n} pillar={p} index={i} />
          ))}
        </motion.div>

        {/* Scene dots */}
        <div className="pointer-events-none absolute inset-x-0 bottom-8 z-30 mx-auto flex max-w-[1320px] items-center justify-between px-5 text-[10px] uppercase tracking-[0.28em] text-ink-mute sm:bottom-12 sm:px-10">
          <span>the method</span>
          <div className="flex items-center gap-2">
            {PILLARS.map((_, i) => (
              <PillarDot
                key={i}
                index={i}
                scrollYProgress={scrollYProgress}
                total={PILLARS.length}
              />
            ))}
          </div>
          <span>scroll →</span>
        </div>
      </div>
    </section>
  );
}

function PillarDot({
  index,
  scrollYProgress,
  total,
}: {
  index: number;
  scrollYProgress: MotionValue<number>;
  total: number;
}) {
  const start = (index - 0.15) / total;
  const end = (index + 0.5) / total;
  const opacity = useTransform(scrollYProgress, [start, end], [0.25, 1]);
  const scale = useTransform(scrollYProgress, [start, end], [0.7, 1]);
  return (
    <motion.span
      style={{ opacity, scale }}
      className="inline-block h-1.5 w-4 rounded-full bg-ink"
    />
  );
}

function PillarPanel({ pillar, index }: { pillar: Pillar; index: number }) {
  return (
    <article className="relative flex h-full w-screen shrink-0 items-center border-r border-ink/12">
      <div className="mx-auto grid w-full max-w-[1320px] grid-cols-1 items-center gap-10 px-5 pt-24 pb-14 sm:px-10 lg:grid-cols-12 lg:gap-12">
        {/* Left: copy */}
        <div className="lg:col-span-6">
          <div className="mb-6 flex items-baseline gap-4">
            <span className="font-serif text-[clamp(4rem,10vw,8rem)] leading-none text-ink">
              {pillar.n}
            </span>
            <div className="flex flex-col">
              <span className="eyebrow">Method</span>
              <span className="text-[10px] uppercase tracking-[0.28em] text-matcha">
                {pillar.tag}
              </span>
            </div>
          </div>

          <h3 className="display text-[clamp(2rem,5vw,4.25rem)] leading-[1] text-ink">
            {pillar.title}
          </h3>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
            {pillar.body}
          </p>

          <div className="mt-10 flex items-baseline gap-4 border-t border-ink/15 pt-6">
            <span className="font-serif text-4xl text-ink">{pillar.stat.n}</span>
            <span className="text-sm text-ink-mute">{pillar.stat.label}</span>
          </div>
        </div>

        {/* Right: illustration */}
        <div className="relative lg:col-span-6">
          <div className="relative mx-auto flex aspect-square max-w-lg items-center justify-center overflow-hidden rounded-[28px] border border-ink/12 bg-paper">
            {index === 0 && <SpeedIllustration />}
            {index === 1 && <SwapIllustration />}
            {index === 2 && <SharedIllustration />}
          </div>
        </div>
      </div>
    </article>
  );
}

/* ────────────────────────────────
   Illustrations
   ──────────────────────────────── */

function SpeedIllustration() {
  const reduce = useReducedMotion();
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {/* Clock face */}
      <svg viewBox="0 0 240 240" width="82%" aria-hidden>
        <circle
          cx="120"
          cy="120"
          r="100"
          fill="var(--color-cream)"
          stroke="var(--color-ink)"
          strokeWidth="2"
        />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
          const x1 = 120 + Math.cos(a) * 88;
          const y1 = 120 + Math.sin(a) * 88;
          const x2 = 120 + Math.cos(a) * 98;
          const y2 = 120 + Math.sin(a) * 98;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--color-ink-mute)"
              strokeWidth={i % 3 === 0 ? 2 : 1}
            />
          );
        })}
        {/* Numbers */}
        <text
          x="120"
          y="52"
          textAnchor="middle"
          fontFamily="var(--font-serif)"
          fontSize="14"
          fill="var(--color-ink)"
        >
          12
        </text>
        <text
          x="188"
          y="126"
          textAnchor="middle"
          fontFamily="var(--font-serif)"
          fontSize="14"
          fill="var(--color-ink)"
        >
          3
        </text>
        <text
          x="120"
          y="200"
          textAnchor="middle"
          fontFamily="var(--font-serif)"
          fontSize="14"
          fill="var(--color-ink)"
        >
          6
        </text>
        <text
          x="52"
          y="126"
          textAnchor="middle"
          fontFamily="var(--font-serif)"
          fontSize="14"
          fill="var(--color-ink)"
        >
          9
        </text>
        {/* Highlight sweep 0–17min (17/60 * 360° = 102°) */}
        <path
          d="M120 120 L120 30 A90 90 0 0 1 208.03 138.71 Z"
          fill="var(--color-matcha)"
          opacity="0.18"
        />
        {/* Hour hand */}
        <line
          x1="120"
          y1="120"
          x2="120"
          y2="70"
          stroke="var(--color-ink)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Minute hand — animated. transformBox:view-box so origin
            coords resolve in SVG viewBox space, not the line's own bbox. */}
        <motion.line
          x1="120"
          y1="120"
          x2="120"
          y2="40"
          stroke="var(--color-matcha)"
          strokeWidth="2.5"
          strokeLinecap="round"
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          style={{
            transformOrigin: "120px 120px",
            transformBox: "view-box",
          }}
        />
        {/* Center */}
        <circle cx="120" cy="120" r="5" fill="var(--color-ink)" />
        <circle cx="120" cy="120" r="2" fill="var(--color-cream)" />
      </svg>

      {/* Tick labels */}
      <div className="absolute inset-x-6 bottom-6 flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-ink-mute">
        <span>0 min</span>
        <span className="font-serif italic text-matcha">avg · 17 min</span>
        <span>60 min</span>
      </div>
    </div>
  );
}

function SwapIllustration() {
  const reduce = useReducedMotion();
  const pairs = [
    { from: { e: "🥛", n: "milk" }, to: { e: "🥥", n: "coconut milk" } },
    { from: { e: "🧈", n: "butter" }, to: { e: "🫒", n: "olive oil" } },
    { from: { e: "🌾", n: "flour" }, to: { e: "🌽", n: "cornmeal" } },
    { from: { e: "🧂", n: "soy sauce" }, to: { e: "🍶", n: "miso" } },
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setI((v) => (v + 1) % pairs.length), 2400);
    return () => window.clearInterval(id);
  }, [reduce, pairs.length]);
  const p = pairs[i];

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="flex items-center gap-4 sm:gap-8">
        {/* From */}
        <SwapChip active={false} label="out of" pair={p.from} keyName={`from-${i}`} />

        {/* Arrow */}
        <motion.svg
          viewBox="0 0 60 30"
          width="60"
          height="30"
          animate={reduce ? undefined : { x: [0, 6, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <path
            d="M4 15 L48 15 M42 8 L52 15 L42 22"
            stroke="var(--color-matcha)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </motion.svg>

        {/* To */}
        <SwapChip active={true} label="try" pair={p.to} keyName={`to-${i}`} />
      </div>

      {/* Underline caption */}
      <div className="absolute inset-x-6 bottom-6 flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-ink-mute">
        <span>substitutions library</span>
        <span className="font-serif italic text-matcha">4,200 swaps</span>
        <span>·</span>
      </div>
    </div>
  );
}

function SwapChip({
  active,
  label,
  pair,
  keyName,
}: {
  active: boolean;
  label: string;
  pair: { e: string; n: string };
  keyName: string;
}) {
  return (
    <div className="flex w-32 flex-col items-center gap-2 sm:w-36">
      <span className="text-[10px] uppercase tracking-[0.24em] text-ink-mute">
        {label}
      </span>
      <AnimatePresence mode="wait">
        <motion.div
          key={keyName}
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.9 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={`flex w-full flex-col items-center gap-2 rounded-2xl border px-3 py-4 ${
            active
              ? "border-matcha bg-matcha-soft text-ink"
              : "border-ink/15 bg-cream text-ink"
          }`}
        >
          <span className="text-3xl leading-none sm:text-4xl">{pair.e}</span>
          <span className="text-sm font-medium">{pair.n}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function SharedIllustration() {
  const reduce = useReducedMotion();
  const rows = [
    { name: "Maya", tag: "vegan", variant: "greens" as const },
    { name: "Sam", tag: "gluten-free", variant: "grain" as const },
    { name: "Kai", tag: "no onions", variant: "cheese" as const },
  ];
  return (
    <div className="relative flex h-full w-full items-center justify-center px-6">
      <div className="w-full max-w-xs space-y-3">
        {rows.map((r, i) => (
          <motion.div
            key={r.name}
            initial={reduce ? undefined : { opacity: 0, x: -20 }}
            animate={reduce ? undefined : { opacity: 1, x: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.4 + i * 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex items-center gap-3 rounded-2xl border border-ink/12 bg-cream p-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-paper text-lg">
              <span aria-hidden>
                {r.variant === "greens" ? "🥗" : r.variant === "grain" ? "🌾" : "🧀"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-serif text-lg text-ink">{r.name}</span>
                <span className="rounded-full bg-matcha-soft px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-matcha">
                  {r.tag}
                </span>
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.24em] text-ink-mute">
                gets a different plate · same dinner
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="absolute inset-x-6 bottom-6 flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-ink-mute">
        <span>shared kitchen mode</span>
        <span className="font-serif italic text-matcha">everyone eats</span>
        <span>·</span>
      </div>
    </div>
  );
}
