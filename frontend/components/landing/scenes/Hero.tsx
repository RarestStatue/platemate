"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
  useMotionValueEvent,
  useReducedMotion,
} from "motion/react";
import LogoMark from "../LogoMark";
import SplitReveal from "../motion/SplitReveal";

const NAV = [
  { href: "#demo", label: "the demo" },
  { href: "#maths", label: "the maths" },
  { href: "#how", label: "how it works" },
  { href: "#recipes", label: "recipes" },
];


export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Scroll → video time, non-linear.
  //   0.00–0.14  ⟶ frame 0 (title reveal, paused)
  //   0.14–0.90  ⟶ 0 → duration (main scrub)
  //   0.90–1.00  ⟶ final frame (CTA holds)
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const video = videoRef.current;
    if (!video || !video.duration || Number.isNaN(video.duration)) return;
    const d = video.duration;
    let t = 0;
    if (v <= 0.14) t = 0;
    else if (v >= 0.90) t = d - 0.05;
    else t = ((v - 0.14) / 0.76) * (d - 0.05);
    if (Math.abs(video.currentTime - t) > 0.03) {
      try {
        video.currentTime = t;
      } catch {
        /* seeking not ready */
      }
    }
  });

  // ── Stage opacity/translate windows ────────────────────────
  // Timeline (0..1):
  //   0.00–0.22   Title
  //   0.22–0.36   pure video (breather)
  //   0.36–0.58   Body pull-quote
  //   0.58–0.66   pure video (breather)
  //   0.66–0.74   Callout 1: "raid the shelf."
  //   0.74–0.80   pure video (breather)
  //   0.80–0.88   Callout 2: "no receipts."
  //   0.88–1.00   CTA (final frame held)
  const titleO = useTransform(scrollYProgress, [0, 0.05, 0.16, 0.22], [0, 1, 1, 0]);
  const titleY = useTransform(scrollYProgress, [0, 0.05, 0.16, 0.22], [24, 0, 0, -24]);
  const titleVis = useTransform(titleO, (o) => (o > 0.01 ? "visible" : "hidden"));

  const bodyO = useTransform(
    scrollYProgress,
    [0.36, 0.42, 0.52, 0.58],
    [0, 1, 1, 0]
  );
  const bodyY = useTransform(
    scrollYProgress,
    [0.36, 0.42, 0.52, 0.58],
    [24, 0, 0, -24]
  );
  const bodyVis = useTransform(bodyO, (o) => (o > 0.01 ? "visible" : "hidden"));

  const ctaO = useTransform(scrollYProgress, [0.88, 0.94], [0, 1]);
  const ctaY = useTransform(scrollYProgress, [0.88, 0.94], [40, 0]);
  const ctaVis = useTransform(ctaO, (o) => (o > 0.01 ? "visible" : "hidden"));

  // Dim + blur on the video during text stages so overlays stay legible.
  //   Bright & sharp during video-only breather (0.28) and the long
  //   text-free stretch 0.58–0.88.
  //   Blurred & dim only during title (0–0.22), pull-quote (0.36–0.58),
  //   and CTA (0.88–1.0).
  const videoBlur = useTransform(
    scrollYProgress,
    [0, 0.06, 0.18, 0.28, 0.42, 0.55, 0.88, 0.92, 1],
    [6, 4, 0, 0, 6, 0, 0, 8, 12]
  );
  const videoBright = useTransform(
    scrollYProgress,
    [0, 0.06, 0.18, 0.28, 0.42, 0.55, 0.88, 0.92, 1],
    [0.45, 0.55, 0.95, 1.0, 0.4, 0.9, 1.0, 0.4, 0.3]
  );
  const videoScale = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [1.06, 1.0, 1.08]
  );
  const videoFilter = useMotionTemplate`blur(${videoBlur}px) brightness(${videoBright})`;

  // Extra dim overlay for readability. Fades to ~0.15 during breathers.
  const dimO = useTransform(
    scrollYProgress,
    [0, 0.06, 0.18, 0.28, 0.42, 0.55, 0.88, 0.92, 1],
    [0.6, 0.6, 0.3, 0.15, 0.55, 0.2, 0.15, 0.55, 0.7]
  );

  const scrollHintO = useTransform(scrollYProgress, [0, 0.05, 0.12], [1, 1, 0]);

  return (
    <section
      ref={ref}
      className="relative bg-ink"
      style={{ height: "360vh" }}
      aria-label="Cook with what's already in the fridge"
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Full-bleed video */}
        <motion.video
          ref={videoRef}
          src="/hero/ingredients.mp4"
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            filter: reduce ? "brightness(0.55)" : videoFilter,
            scale: reduce ? 1 : videoScale,
            transformOrigin: "center center",
          }}
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={(e) => {
            try {
              e.currentTarget.currentTime = 0.01;
            } catch {
              /* metadata not ready */
            }
          }}
          aria-hidden
        />

        {/* Readability layer */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-ink"
          style={{ opacity: reduce ? 0.5 : dimO }}
        />

        {/* Top + bottom edge gradients (also hides potential watermark) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(11,11,10,0.55) 0%, rgba(11,11,10,0) 22%, rgba(11,11,10,0) 70%, rgba(11,11,10,0.7) 100%)",
          }}
        />

        {/* Corner watermark cover: bottom-right radial dark spot */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 h-24 w-40 sm:h-28 sm:w-56"
          style={{
            background:
              "radial-gradient(circle at bottom right, rgba(11,11,10,0.85) 0%, rgba(11,11,10,0) 70%)",
          }}
        />

        {/* ── Progress ruler ─────────────────────────────── */}
        <motion.div
          aria-hidden
          className="absolute left-0 right-0 top-0 z-40 h-[2px] origin-left bg-matcha"
          style={{ scaleX: scrollYProgress }}
        />

        {/* ── Nav ────────────────────────────────────────── */}
        <motion.header
          initial={reduce ? undefined : { opacity: 0, y: -12 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-x-0 top-0 z-40 mx-auto flex w-full max-w-[1320px] items-center justify-between px-5 py-5 sm:px-10"
        >
          <Link
            href="/"
            aria-label="platemate home"
            className="group flex items-center gap-2 text-cream"
          >
            <motion.span
              whileHover={reduce ? undefined : { rotate: -10, scale: 1.08 }}
              transition={{ type: "spring", stiffness: 300, damping: 14 }}
              className="inline-block rounded-lg bg-cream/10 p-1 backdrop-blur-sm"
            >
              <LogoMark className="h-7 w-7" />
            </motion.span>
            <span className="font-serif text-2xl leading-none tracking-tight text-cream drop-shadow-sm">
              platemate<span className="text-matcha">.</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-cream/80 md:flex">
            {NAV.map((l) => (
              <motion.a
                key={l.href}
                href={l.href}
                className="relative"
                initial="rest"
                animate="rest"
                whileHover="hover"
              >
                <span className="hover:text-cream">{l.label}</span>
                <motion.span
                  variants={{ rest: { scaleX: 0 }, hover: { scaleX: 1 } }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute -bottom-1 left-0 h-px w-full origin-left bg-matcha"
                />
              </motion.a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm text-cream/80 hover:text-cream sm:inline"
            >
              sign in
            </Link>
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-full bg-cream px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-white"
            >
              get cooking
              <span
                aria-hidden
                className="transition-transform group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
          </div>
        </motion.header>

        {/* ── Masthead strip ─────────────────────────────── */}
        <div className="absolute inset-x-0 top-[72px] z-30 mx-auto w-full max-w-[1320px] px-5 sm:top-[76px] sm:px-10">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-cream/60">
            <span className="flex items-center gap-3">
              <motion.span
                className="inline-block h-1.5 w-1.5 rounded-full bg-ember"
                animate={reduce ? undefined : { scale: [1, 1.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              Issue №001 · The Fridge Weekly
            </span>
            <span className="hidden sm:inline">
              A publication for hungry students
            </span>
            <span>Free · $0.00 CAD</span>
          </div>
        </div>

        {/* ── Center stage: three overlapping stages ─────── */}
        <div className="absolute inset-0 z-20 flex items-center justify-center px-5 sm:px-10">
          {/* Stage 1: title */}
          <motion.div
            style={{
              opacity: reduce ? 1 : titleO,
              y: reduce ? 0 : titleY,
              visibility: reduce ? "visible" : titleVis,
            }}
            className="pointer-events-none absolute inset-x-0 flex flex-col items-center px-5 text-center sm:px-10"
          >
            <p className="mb-6 text-[10px] uppercase tracking-[0.32em] text-cream/70">
              Cover story · no shopping required
            </p>
            <h1
              className="display leading-[1.05] text-cream"
              style={{ fontSize: "clamp(3rem, 10vw, 8rem)" }}
            >
              <span className="block drop-shadow-lg">
                <SplitReveal text="cook" as="span" delay={0.1} stagger={0.03} />
              </span>
              <span className="block drop-shadow-lg">
                <SplitReveal
                  text="with what’s"
                  as="span"
                  delay={0.22}
                  stagger={0.03}
                />
              </span>
              <span className="block drop-shadow-lg">
                <SplitReveal
                  text="already"
                  as="span"
                  delay={0.36}
                  stagger={0.03}
                />
              </span>
              <span className="block italic text-matcha drop-shadow-lg">
                <SplitReveal
                  text="in the fridge."
                  as="span"
                  delay={0.5}
                  stagger={0.03}
                />
              </span>
            </h1>
          </motion.div>

          {/* Stage 2: pull-quote */}
          <motion.div
            style={{
              opacity: reduce ? 0 : bodyO,
              y: reduce ? 0 : bodyY,
              visibility: reduce ? "hidden" : bodyVis,
            }}
            className="pointer-events-none absolute inset-x-0 flex flex-col items-center px-5 text-center sm:px-10"
          >
            <p className="mb-4 text-[10px] uppercase tracking-[0.32em] text-cream/70">
              the pitch
            </p>
            <p
              className="mx-auto max-w-4xl font-serif italic leading-[1.05] text-cream drop-shadow-md"
              style={{ fontSize: "clamp(2rem, 6vw, 5rem)" }}
            >
              half an onion. three sad eggs.
              <br />
              a carrot that&apos;s seen things.
            </p>
            <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-cream/85 sm:text-lg">
              Platemate is a recipe browser for students who don&apos;t want to
              shop. Type what&apos;s in the fridge — get something worth eating.
            </p>
          </motion.div>

          {/* Stage 3: CTA */}
          <motion.div
            style={{
              opacity: reduce ? 0 : ctaO,
              y: reduce ? 0 : ctaY,
              visibility: reduce ? "hidden" : ctaVis,
            }}
            className="absolute inset-x-0 flex flex-col items-center px-5 text-center sm:px-10"
          >
            <p className="mb-4 text-[10px] uppercase tracking-[0.32em] text-cream/70">
              the invitation
            </p>
            <p className="mb-6 font-serif text-lg italic text-cream/80 drop-shadow-md sm:text-xl">
              raid the shelf. no receipts.
            </p>
            <h2
              className="display leading-[1] text-cream drop-shadow-lg"
              style={{ fontSize: "clamp(2.5rem, 8vw, 6.5rem)" }}
            >
              start with
              <br />
              <span className="italic text-matcha">what you have.</span>
            </h2>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-full bg-cream px-6 py-3 text-sm font-medium text-ink transition hover:bg-white"
              >
                start cooking free
                <span
                  aria-hidden
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </Link>
              <Link
                href="#demo"
                className="inline-flex items-center gap-2 rounded-full border border-cream/40 bg-cream/5 px-6 py-3 text-sm text-cream backdrop-blur-sm transition hover:border-cream hover:bg-cream/10"
              >
                see the demo
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-cream/70">
              <span>
                <span className="font-serif text-xl text-cream">8,500+</span>{" "}
                recipes
              </span>
              <span className="hidden text-cream/30 sm:inline">·</span>
              <span>
                <span className="font-serif text-xl text-cream">17 min</span>{" "}
                avg cook
              </span>
              <span className="hidden text-cream/30 sm:inline">·</span>
              <span>
                <span className="font-serif text-xl text-cream">$0</span>{" "}
                forever
              </span>
            </div>
          </motion.div>
        </div>

        {/* ── Bottom hint bar ────────────────────────────── */}
        <div className="absolute inset-x-0 bottom-6 z-30 mx-auto flex w-full max-w-[1320px] items-center justify-between px-5 text-[10px] uppercase tracking-[0.28em] text-cream/60 sm:bottom-10 sm:px-10">
          <span>Fig. 01 · bullet time</span>
          <div className="hidden flex-1 px-6 sm:block">
            <div className="h-px w-full bg-cream/20" />
          </div>
          <motion.span
            style={{ opacity: scrollHintO }}
            className="flex items-center gap-2 font-serif italic text-cream"
          >
            scroll to cook
            <motion.span
              aria-hidden
              animate={reduce ? undefined : { y: [0, 4, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block"
            >
              ↓
            </motion.span>
          </motion.span>
        </div>
      </div>
    </section>
  );
}

