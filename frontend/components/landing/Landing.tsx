"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import LandingFridge from "./LandingFridge";
import LogoMark from "./LogoMark";
import IngredientRiver from "./scenes/IngredientRiver";
import KineticType from "./scenes/KineticType";
import PlateAssembly from "./scenes/PlateAssembly";

gsap.registerPlugin(ScrollTrigger);

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
    body:
      "Sort by 10-min snacks up to weekend feasts. No epic marinades, no niche gadgets — food you can make between lectures.",
  },
  {
    n: "02",
    title: "one missing ingredient? we swap it.",
    body:
      "Ran out of soy sauce? Fine. Platemate suggests the closest sub from what's already in your cupboard. No emergency Loblaws runs.",
  },
  {
    n: "03",
    title: "built for shared kitchens",
    body:
      "Filters for vegan, halal, gluten-free, that flatmate who says they're allergic to onions. Everyone eats. Nobody argues.",
  },
];

const HERO_LINES: { text: string; className?: string }[] = [
  { text: "cook" },
  { text: "what you" },
  { text: "already" },
  { text: "have.", className: "italic text-matcha" },
];

function SplitChars({ text }: { text: string }) {
  return (
    <>
      {[...text].map((ch, i) => (
        <span key={i} className="hero-char">
          {ch === " " ? " " : ch}
        </span>
      ))}
    </>
  );
}

export default function Landing() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // ── Reduced motion: minimal fades, ensure everything visible ─────────
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(".hero-char", { opacity: 1, y: 0 });
        gsap.set(".fridge-card, .hero-body, .hero-cta, .hero-badge", { opacity: 1, y: 0 });
        gsap.set(".pillar-item, .recipe-card, .waste-stat", { opacity: 1, y: 0 });
        gsap.set(".steam-path", { strokeDashoffset: 0 });
      });

      // ── Full motion ──────────────────────────────────────────────────────
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Scroll progress bar
        ScrollTrigger.create({
          start: 0,
          end: "max",
          onUpdate: (self) => {
            const bar = document.querySelector<HTMLElement>(".scroll-progress-fill");
            if (bar) bar.style.transform = `scaleX(${self.progress})`;
          },
        });

        // Hero display type: chars mask-reveal
        const chars = root.current!.querySelectorAll<HTMLElement>(".hero-char");
        gsap.to(chars, {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power4.out",
          stagger: {
            each: 0.028,
            from: "start",
          },
          delay: 0.15,
        });

        // Hero body + badge + CTA cascade
        gsap.fromTo(
          [".hero-body", ".hero-cta", ".hero-badge"],
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            stagger: 0.12,
            delay: 0.7,
          }
        );

        // Fridge card entrance
        gsap.fromTo(
          ".fridge-card",
          { opacity: 0, y: 40, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 1.1, delay: 0.35, ease: "power3.out" }
        );

        // Editorial rule under masthead: draw across
        gsap.fromTo(
          ".hero-rule",
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1.2,
            delay: 0.1,
            ease: "power3.out",
            transformOrigin: "left center",
          }
        );

        // Ticker: keep CSS marquee, but add slight parallax so text drifts on scroll
        gsap.to(".marquee-parallax", {
          xPercent: -8,
          ease: "none",
          scrollTrigger: {
            trigger: ".ticker-row",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });

        // ── $1,300 count-up ─────────────────────────────────
        const wasteNumber = root.current!.querySelector<HTMLElement>(".waste-number");
        if (wasteNumber) {
          ScrollTrigger.create({
            trigger: ".waste-section",
            start: "top 65%",
            once: true,
            onEnter: () => {
              const target = { v: 0 };
              gsap.to(target, {
                v: 1300,
                duration: 2.4,
                ease: "power2.out",
                onUpdate: () => {
                  wasteNumber.textContent = Math.round(target.v).toLocaleString();
                },
              });
            },
          });
        }

        // Waste headline lines slide up
        gsap.from(".waste-headline-line", {
          y: 60,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: { trigger: ".waste-section", start: "top 75%" },
        });

        // Waste stats stagger
        gsap.from(".waste-stat", {
          y: 24,
          opacity: 0,
          duration: 0.7,
          ease: "power2.out",
          stagger: 0.1,
          scrollTrigger: { trigger: ".waste-stats", start: "top 85%" },
        });

        // Body paragraph fade
        gsap.from(".waste-body", {
          y: 24,
          opacity: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: { trigger: ".waste-body", start: "top 85%" },
        });

        // Falling bills — scroll-scrubbed through the whole waste section
        gsap.utils.toArray<HTMLElement>(".falling-bill").forEach((bill, i) => {
          const rot = -180 + Math.random() * 360;
          const drift = -20 + Math.random() * 40;
          gsap.fromTo(
            bill,
            {
              yPercent: -30,
              xPercent: 0,
              rotation: -20 + Math.random() * 40,
              opacity: 0,
            },
            {
              yPercent: 220,
              xPercent: drift,
              rotation: rot,
              opacity: 1,
              ease: "none",
              scrollTrigger: {
                trigger: ".waste-section",
                start: "top 80%",
                end: "bottom top",
                scrub: 1 + i * 0.25,
              },
            }
          );
        });

        // ── Pillars ─────────────────────────────────────────
        gsap.utils.toArray<HTMLElement>(".pillar-item").forEach((item) => {
          const numeral = item.querySelector(".pillar-numeral");
          const text = item.querySelector(".pillar-text");
          const trigger: ScrollTrigger.Vars = {
            trigger: item,
            start: "top 82%",
            toggleActions: "play none none none",
          };
          gsap.fromTo(
            numeral,
            { scale: 0.6, opacity: 0, rotate: -10, y: 20 },
            {
              scale: 1,
              opacity: 1,
              rotate: 0,
              y: 0,
              duration: 1,
              ease: "back.out(1.4)",
              scrollTrigger: trigger,
            }
          );
          gsap.fromTo(
            text,
            { x: 40, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.9,
              delay: 0.12,
              ease: "power3.out",
              scrollTrigger: trigger,
            }
          );
        });

        // Pillars section title reveal
        gsap.from(".pillars-title", {
          y: 40,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: ".pillars-section", start: "top 75%" },
        });

        // ── Recipe cards stagger ────────────────────────────
        gsap.from(".recipes-title", {
          y: 40,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: ".recipes-section", start: "top 75%" },
        });
        gsap.from(".recipe-card", {
          y: 60,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.14,
          scrollTrigger: { trigger: ".recipes-grid", start: "top 78%" },
        });

        // Recipe swatch parallax on hover — subtle scale
        gsap.utils.toArray<HTMLElement>(".recipe-swatch").forEach((sw) => {
          const glyph = sw.querySelector<HTMLElement>(".recipe-glyph");
          if (!glyph) return;
          sw.addEventListener("mouseenter", () => {
            gsap.to(glyph, { scale: 1.12, rotate: 4, duration: 0.6, ease: "power2.out" });
          });
          sw.addEventListener("mouseleave", () => {
            gsap.to(glyph, { scale: 1, rotate: 0, duration: 0.6, ease: "power2.out" });
          });
        });

        // ── Footer steam draw ───────────────────────────────
        gsap.utils.toArray<SVGPathElement>(".steam-path").forEach((path, i) => {
          gsap.fromTo(
            path,
            { strokeDashoffset: 240 },
            {
              strokeDashoffset: 0,
              duration: 1.8,
              ease: "power2.inOut",
              delay: i * 0.2,
              scrollTrigger: { trigger: ".footer-section", start: "top 85%" },
            }
          );
        });

        // Footer tagline word-by-word
        gsap.from(".footer-tagline .word", {
          y: 30,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: ".footer-section", start: "top 80%" },
        });
      });
    },
    { scope: root }
  );

  return (
    <div ref={root} className="relative min-h-screen text-ink">
      {/* Reading progress bar */}
      <div
        aria-hidden
        className="scroll-progress fixed left-0 right-0 top-0 z-50 h-[2px] bg-ink/10"
      >
        <div className="scroll-progress-fill h-full w-full bg-matcha" style={{ transform: "scaleX(0)" }} />
      </div>

      {/* ── Nav ─────────────────────────────────────── */}
      <header className="relative z-40 mx-auto flex max-w-[1280px] items-center justify-between px-5 py-5 sm:px-10">
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
        <div className="hero-badge mb-6 flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-ink-mute">
          <span>Issue №001 · The Fridge Weekly</span>
          <span className="hidden sm:inline">A publication for hungry students · Est. 2026</span>
          <span>Free · $0.00 CAD</span>
        </div>
        <div className="rule hero-rule mb-10 origin-left" />

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Left / Text */}
          <div className="lg:col-span-7">
            <p className="eyebrow hero-badge mb-6">Cover story · No shopping required</p>
            <h1 className="display text-[clamp(3.5rem,10vw,7.5rem)] text-ink">
              {HERO_LINES.map((ln, i) => (
                <span key={i} className={`hero-line ${ln.className ?? ""}`}>
                  <SplitChars text={ln.text} />
                </span>
              ))}
            </h1>

            <div className="hero-body mt-10 max-w-xl text-lg leading-relaxed text-ink-soft">
              <p>
                Half an onion. Three sad eggs. A carrot that's seen things.
                Platemate is a recipe browser for students who don't want to shop —
                type what's in the fridge, get something worth eating.
              </p>
            </div>

            <div className="hero-cta mt-8 flex flex-wrap items-center gap-3">
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

            <p className="hero-badge mt-6 flex items-center gap-2 text-xs text-ink-mute">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-matcha" />
              8,500+ recipes · 340k home cooks · zero premium tier
            </p>
          </div>

          {/* Right / Interactive fridge */}
          <div className="fridge-card lg:col-span-5">
            <LandingFridge />
          </div>
        </div>

        {/* Ticker */}
        <div className="ticker-row mt-20 overflow-hidden border-y border-ink/15 py-4">
          <div className="marquee-parallax">
            <div className="marquee-track text-2xl text-ink-soft sm:text-3xl">
              {[...INGREDIENT_TICKER, ...INGREDIENT_TICKER].map((it, i) => (
                <span
                  key={i}
                  className="flex items-center gap-12 whitespace-nowrap font-serif italic"
                >
                  {it}
                  <span className="text-matcha">✱</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Ingredient River (new) ─────────────────── */}
      <IngredientRiver />

      {/* ── Food waste centerpiece ─────────────────── */}
      <section
        id="waste"
        className="waste-section relative z-10 overflow-hidden bg-ink text-cream"
      >
        {/* Falling bills */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
          {Array.from({ length: 14 }).map((_, i) => (
            <FallingBill
              key={i}
              style={{
                left: `${(i * 7.3 + 4) % 96}%`,
                top: "0%",
              }}
            />
          ))}
        </div>

        <div className="relative z-10 mx-auto max-w-[1280px] px-5 py-24 sm:px-10 sm:py-32">
          <div className="mb-10 flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-cream/60">
            <span>The green bin report</span>
            <span>Feature · pp. 04–07</span>
          </div>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="eyebrow mb-6 text-cream/60">Chapter one</p>
              <h2 className="display text-[clamp(3rem,7vw,6rem)] leading-[0.95]">
                <span className="waste-headline-line block text-cream/60">$</span>
                <span className="waste-headline-line block">
                  <span className="waste-number">0</span>
                </span>
                <span className="waste-headline-line block italic text-matcha-soft">
                  a year,
                </span>
                <span className="waste-headline-line block text-cream/60">in the bin.</span>
              </h2>
            </div>
            <div className="lg:col-span-7 lg:pl-12">
              <p className="waste-body text-2xl leading-snug text-cream sm:text-3xl">
                The average Canadian household throws away{" "}
                <span className="italic">roughly $1,300</span> of edible food every year.
                For students, it's often the half-jar of pesto, the forgotten bag of
                spinach, the eggs that expired one day too soon.
              </p>
              <div className="waste-stats mt-10 grid grid-cols-2 gap-6 border-t border-cream/20 pt-8 sm:grid-cols-4">
                <Stat n="2.3M" label="tonnes wasted / year (CA)" />
                <Stat n="63%" label="of that from homes" />
                <Stat n="~$3,000" label="avg. student food spend" />
                <Stat n="up to 40%" label="cut with meal-planning" />
              </div>
              <p className="waste-body mt-10 max-w-xl text-cream/70">
                Platemate isn't a lecture. It's a tool. You type the sad ingredients
                loitering in your fridge, we rank recipes by what you already have.
                Fewer bin trips. More dinner.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Kinetic type: WASTE → TASTE ─────────────── */}
      <KineticType />

      {/* ── How it works / three pillars ──────────── */}
      <section
        id="how"
        className="pillars-section relative z-10 mx-auto max-w-[1280px] px-5 py-24 sm:px-10 sm:py-32"
      >
        <div className="mb-10 flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-ink-mute">
          <span>The method</span>
          <span>Section III</span>
        </div>
        <div className="rule mb-12" />

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="pillars-title lg:col-span-4">
            <p className="eyebrow mb-6">Three simple ideas</p>
            <h2 className="display text-[clamp(2.5rem,5vw,4.5rem)]">
              A cookbook that <span className="italic text-matcha">reads your fridge</span>.
            </h2>
          </div>
          <div className="lg:col-span-8">
            <ol className="divide-y divide-ink/15">
              {PILLARS.map((p) => (
                <li key={p.n} className="pillar-item grid grid-cols-12 gap-6 py-8">
                  <div className="col-span-2 sm:col-span-1">
                    <span className="pillar-numeral inline-block font-serif text-4xl text-ink">
                      {p.n}
                    </span>
                  </div>
                  <div className="pillar-text col-span-10 sm:col-span-11">
                    <h3 className="font-serif text-2xl leading-tight sm:text-3xl">{p.title}</h3>
                    <p className="mt-3 max-w-xl text-ink-soft">{p.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── Plate Assembly finale (new) ─────────────── */}
      <PlateAssembly />

      {/* ── Recipes preview strip ─────────────────── */}
      <section
        id="recipes"
        className="recipes-section relative z-10 border-t border-ink/15 bg-paper"
      >
        <div className="mx-auto max-w-[1280px] px-5 py-24 sm:px-10">
          <div className="recipes-title flex items-end justify-between">
            <div>
              <p className="eyebrow mb-3">This week's plates</p>
              <h2 className="display text-[clamp(2.5rem,5vw,4.5rem)]">
                From <span className="italic text-matcha">real fridges</span>.
              </h2>
            </div>
            <Link
              href="/register"
              className="hidden text-sm text-ink-soft underline underline-offset-4 hover:text-ink sm:inline"
            >
              browse all →
            </Link>
          </div>
          <div className="rule mt-6" />

          <div className="recipes-grid mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {SAMPLE_PLATES.map((p, i) => (
              <article key={i} className="recipe-card group flex flex-col">
                <div
                  className="recipe-swatch relative aspect-[4/5] w-full overflow-hidden bg-hairline"
                  style={{ background: p.swatch }}
                >
                  <span
                    aria-hidden
                    className="recipe-glyph floaty absolute inset-0 flex items-center justify-center text-[7rem] leading-none"
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
      <footer className="footer-section relative z-10 mx-auto max-w-[1280px] px-5 py-16 sm:px-10">
        {/* Final steaming plate mark */}
        <div className="mb-10 flex justify-center">
          <svg viewBox="0 0 200 140" width="200" height="140" aria-hidden>
            {/* steam */}
            <path
              className="steam-path"
              d="M75 60 Q80 40 72 25 Q65 10 78 2"
              stroke="#6B6B66"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              className="steam-path"
              d="M100 60 Q106 35 96 18 Q88 4 104 -2"
              stroke="#6B6B66"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              className="steam-path"
              d="M125 60 Q130 40 122 22 Q114 6 130 -2"
              stroke="#6B6B66"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            {/* plate */}
            <ellipse cx="100" cy="100" rx="80" ry="14" fill="#FBF9F3" stroke="#E4E1D8" strokeWidth="1" />
            <ellipse cx="100" cy="98" rx="60" ry="8" fill="#F6F3EC" />
            <circle cx="100" cy="98" r="2" fill="#3B5A3F" opacity="0.6" />
          </svg>
        </div>

        <p className="footer-tagline mx-auto mb-10 max-w-2xl text-center font-serif text-[clamp(1.5rem,3vw,2.5rem)] italic leading-tight text-ink">
          {"cook what you already have.".split(" ").map((w, i) => (
            <span key={i} className="word mr-3 inline-block">
              {w}
            </span>
          ))}
        </p>

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
    <div className="waste-stat">
      <div className="font-serif text-3xl text-cream sm:text-4xl">{n}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.16em] text-cream/60">{label}</div>
    </div>
  );
}

function FallingBill({ style }: { style?: React.CSSProperties }) {
  return (
    <svg
      className="falling-bill absolute"
      viewBox="0 0 80 40"
      width="72"
      height="36"
      style={style}
      aria-hidden
    >
      <rect x="1" y="1" width="78" height="38" rx="3" fill="#EFEBE0" stroke="#C7BFAB" strokeWidth="1" />
      <rect x="6" y="6" width="68" height="28" rx="2" fill="none" stroke="#8E877A" strokeWidth="0.7" strokeDasharray="2 2" />
      <circle cx="40" cy="20" r="8" fill="none" stroke="#8E877A" strokeWidth="0.8" />
      <text
        x="40"
        y="24"
        textAnchor="middle"
        fontFamily="var(--font-serif)"
        fontSize="10"
        fill="#8E877A"
      >
        $
      </text>
      <text x="10" y="14" fontFamily="var(--font-mono)" fontSize="6" fill="#8E877A">CAD</text>
      <text x="60" y="34" fontFamily="var(--font-mono)" fontSize="6" fill="#8E877A">2026</text>
    </svg>
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
