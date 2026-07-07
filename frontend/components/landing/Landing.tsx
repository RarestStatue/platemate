"use client";

import { motion, useScroll, useSpring } from "motion/react";
import Hero from "./scenes/Hero";
import FridgeDemo from "./scenes/FridgeDemo";
import Maths from "./scenes/Maths";
import HowItWorks from "./scenes/HowItWorks";
import Gallery from "./scenes/Gallery";
import Testimonials from "./scenes/Testimonials";
import Finale from "./scenes/Finale";

export default function Landing() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 26,
    restDelta: 0.0005,
  });

  return (
    <div className="relative min-h-screen text-ink">
      {/* Reading progress */}
      <motion.div
        aria-hidden
        className="fixed left-0 right-0 top-0 z-50 h-[2px] origin-left bg-matcha"
        style={{ scaleX: progress }}
      />

      <Hero />
      <FridgeDemo />
      <Maths />
      <HowItWorks />
      <Gallery />
      <Testimonials />
      <Finale />
    </div>
  );
}
import Link from "next/link";
import LandingFridge from "./LandingFridge";
import LogoMark from "./LogoMark";

const INGREDIENT_TICKER = [
  "eggs",
  "leftover rice",
  "half a lemon",
  "wilted spinach",
  "one lonely carrot",
  "the end of a cheese block",
  "tinned chickpeas",
  "yesterday's pasta",
  "spring onions",
  "that jar of pesto",
  "a can of beans",
  "browning banana",
];

const PILLARS = [
  {
    n: "01",
    title: "ready in the time it takes to reheat leftovers",
    body: "Sort by 10-min snacks up to weekend feasts. No epic marinades, no niche gadgets — food you can make between lectures.",
  },
  {
    n: "02",
    title: "one missing ingredient? we swap it.",
    body: "Ran out of soy sauce? Fine. Platemate suggests the closest sub from what's already in your cupboard. No emergency Loblaws runs.",
  },
  {
    n: "03",
    title: "built for shared kitchens",
    body: "Filters for vegan, halal, gluten-free, that flatmate who says they're allergic to onions. Everyone eats. Nobody argues.",
  },
];

export default function Landing() {
  return (
    <div className="relative min-h-screen text-ink">
      {/* ── Nav ─────────────────────────────────────── */}
      <header className="relative z-20 mx-auto flex max-w-[1280px] items-center justify-between px-5 py-5 sm:px-10">
        <Link href="/" aria-label="platemate home" className="flex items-center gap-2">
          <LogoMark className="h-8 w-8" />
          <span className="font-serif text-2xl leading-none tracking-tight">
            platemate
            <span className="text-matcha">.</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-ink-soft md:flex">
          <a href="#how" className="hover:text-ink">how it works</a>
          <a href="#waste" className="hover:text-ink">the $1,300 problem</a>
          <a href="#recipes" className="hover:text-ink">recipes</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-sm text-ink-soft hover:text-ink sm:inline">
            sign in
          </Link>
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-cream transition hover:bg-ink-soft"
          >
            get cooking
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-[1280px] px-5 pt-6 pb-24 sm:px-10 sm:pt-10">
        {/* Editorial masthead rule */}
        <div className="mb-6 flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-ink-mute">
          <span>Issue №001 · The Fridge Weekly</span>
          <span className="hidden sm:inline">A publication for hungry students · Est. 2026</span>
          <span>Free · $0.00 CAD</span>
        </div>
        <div className="rule mb-10" />

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Left / Text */}
          <div className="lg:col-span-7">
            <p className="eyebrow mb-6">Cover story · No shopping required</p>
            <h1 className="display text-[clamp(3.5rem,10vw,7.5rem)] text-ink">
              cook
              <br />
              what you
              <br />
              already
              <br />
              <span className="italic text-matcha">have.</span>
            </h1>

            <div className="mt-10 max-w-xl text-lg leading-relaxed text-ink-soft">
              <p>
                Half an onion. Three sad eggs. A carrot that's seen things.
                Platemate is a recipe browser for students who don't want to shop —
                type what's in the fridge, get something worth eating.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream transition hover:bg-ink-soft"
              >
                start with what you have
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-transparent px-6 py-3 text-sm text-ink hover:border-ink"
              >
                how it works
              </a>
            </div>

            <p className="mt-6 flex items-center gap-2 text-xs text-ink-mute">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-matcha" />
              8,500+ recipes · 340k home cooks · zero premium tier
            </p>
          </div>

          {/* Right / Interactive fridge */}
          <div className="lg:col-span-5">
            <LandingFridge />
          </div>
        </div>

        {/* Ticker */}
        <div className="mt-20 overflow-hidden border-y border-ink/15 py-4">
          <div className="marquee-track text-2xl text-ink-soft sm:text-3xl">
            {[...INGREDIENT_TICKER, ...INGREDIENT_TICKER].map((it, i) => (
              <span key={i} className="flex items-center gap-12 whitespace-nowrap font-serif italic">
                {it}
                <span className="text-matcha">✱</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Food waste centerpiece ─────────────────── */}
      <section id="waste" className="relative z-10 bg-ink text-cream">
        <div className="mx-auto max-w-[1280px] px-5 py-24 sm:px-10 sm:py-32">
          <div className="mb-10 flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-cream/60">
            <span>The green bin report</span>
            <span>Feature · pp. 04–07</span>
          </div>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="eyebrow mb-6 text-cream/60">Chapter one</p>
              <h2 className="display text-[clamp(3rem,7vw,6rem)] leading-[0.95]">
                <span className="text-cream/60">$</span>1,300
                <br />
                <span className="italic text-matcha-soft">a year,</span>
                <br />
                <span className="text-cream/60">in the bin.</span>
              </h2>
            </div>
            <div className="lg:col-span-7 lg:pl-12">
              <p className="text-2xl leading-snug text-cream sm:text-3xl">
                The average Canadian household throws away <span className="italic">roughly $1,300</span> of edible
                food every year. For students, it's often the half-jar of pesto, the forgotten
                bag of spinach, the eggs that expired one day too soon.
              </p>
              <div className="mt-10 grid grid-cols-2 gap-6 border-t border-cream/20 pt-8 sm:grid-cols-4">
                <Stat n="2.3M" label="tonnes wasted / year (CA)" />
                <Stat n="63%" label="of that from homes" />
                <Stat n="~$3,000" label="avg. student food spend" />
                <Stat n="up to 40%" label="cut with meal-planning" />
              </div>
              <p className="mt-10 max-w-xl text-cream/70">
                Platemate isn't a lecture. It's a tool. You type the sad ingredients loitering
                in your fridge, we rank recipes by what you already have. Fewer bin trips.
                More dinner.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works / three pillars ──────────── */}
      <section id="how" className="relative z-10 mx-auto max-w-[1280px] px-5 py-24 sm:px-10 sm:py-32">
        <div className="mb-10 flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-ink-mute">
          <span>The method</span>
          <span>Section II</span>
        </div>
        <div className="rule mb-12" />

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow mb-6">Three simple ideas</p>
            <h2 className="display text-[clamp(2.5rem,5vw,4.5rem)]">
              A cookbook that <span className="italic text-matcha">reads your fridge</span>.
            </h2>
          </div>
          <div className="lg:col-span-8">
            <ol className="divide-y divide-ink/15">
              {PILLARS.map((p) => (
                <li key={p.n} className="grid grid-cols-12 gap-6 py-8">
                  <div className="col-span-2 sm:col-span-1">
                    <span className="font-serif text-4xl text-ink">{p.n}</span>
                  </div>
                  <div className="col-span-10 sm:col-span-11">
                    <h3 className="font-serif text-2xl leading-tight sm:text-3xl">{p.title}</h3>
                    <p className="mt-3 max-w-xl text-ink-soft">{p.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── Recipes preview strip ─────────────────── */}
      <section id="recipes" className="relative z-10 border-t border-ink/15 bg-paper">
        <div className="mx-auto max-w-[1280px] px-5 py-24 sm:px-10">
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow mb-3">This week's plates</p>
              <h2 className="display text-[clamp(2.5rem,5vw,4.5rem)]">
                From <span className="italic text-matcha">real fridges</span>.
              </h2>
            </div>
            <Link href="/register" className="hidden text-sm text-ink-soft underline underline-offset-4 hover:text-ink sm:inline">
              browse all →
            </Link>
          </div>
          <div className="rule mt-6" />

          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {SAMPLE_PLATES.map((p, i) => (
              <article key={i} className="group flex flex-col">
                <div
                  className="relative aspect-[4/5] w-full overflow-hidden bg-hairline"
                  style={{ background: p.swatch }}
                >
                  <span
                    aria-hidden
                    className="floaty absolute inset-0 flex items-center justify-center text-[7rem] leading-none"
                  >
                    {p.glyph}
                  </span>
                  <span className="absolute left-3 top-3 rounded-full bg-cream/95 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-ink">
                    uses {p.uses}/{p.total} of yours
                  </span>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <h3 className="font-serif text-2xl leading-tight">{p.title}</h3>
                  <span className="text-xs text-ink-mute">{p.time}</span>
                </div>
                <p className="mt-1 text-sm text-ink-soft">{p.blurb}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing colophon ─────────────────────── */}
      <footer className="relative z-10 mx-auto max-w-[1280px] px-5 py-16 sm:px-10">
        <div className="rule mb-10" />
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row">
          <div>
            <div className="flex items-center gap-2">
              <LogoMark className="h-6 w-6" />
              <span className="font-serif text-xl">
                platemate<span className="text-matcha">.</span>
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm text-ink-mute">
              A recipe browser for students who cook with what's already there.
              Free, forever, no scroll-through-the-life-story recipes.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm text-ink-soft">
            <Link href="/register" className="hover:text-ink">get started</Link>
            <Link href="/login" className="hover:text-ink">sign in</Link>
            <a href="#waste" className="hover:text-ink">the $1,300 problem</a>
            <a href="#how" className="hover:text-ink">how it works</a>
          </div>
        </div>
        <div className="mt-10 flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-ink-mute">
          <span>© 2026 platemate · printed on the internet</span>
          <span>Vol. 1 · No. 1</span>
        </div>
      </footer>
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="font-serif text-3xl text-cream sm:text-4xl">{n}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.16em] text-cream/60">{label}</div>
    </div>
  );
}

const SAMPLE_PLATES = [
  {
    title: "Greek spinach omelette",
    time: "12 min",
    uses: 4,
    total: 4,
    blurb: "The classic 'I have eggs and something green' rescue.",
    glyph: "🥗",
    swatch: "linear-gradient(135deg, #E6ECE0 0%, #CFD8C2 100%)",
  },
  {
    title: "Lemon feta frittata",
    time: "20 min",
    uses: 3,
    total: 6,
    blurb: "Half a lemon, hunk of feta, some brave herbs.",
    glyph: "🍋",
    swatch: "linear-gradient(135deg, #F4E9D2 0%, #E6D9AF 100%)",
  },
  {
    title: "Spinach feta wrap",
    time: "8 min",
    uses: 3,
    total: 5,
    blurb: "Cold, portable, still good in a lecture.",
    glyph: "🌯",
    swatch: "linear-gradient(135deg, #EFEBE0 0%, #D9D0B4 100%)",
  },
];
