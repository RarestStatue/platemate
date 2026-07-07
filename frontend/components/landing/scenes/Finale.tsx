"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import LogoMark from "../LogoMark";
import MagneticButton from "../motion/MagneticButton";
import SplitReveal from "../motion/SplitReveal";

const STATS = [
  { k: "recipes indexed", v: "8,500+" },
  { k: "avg. cook time", v: "17 min" },
  { k: "weekly cooks", v: "340k" },
  { k: "premium tiers", v: "zero" },
];

const FOOTER_LINKS = [
  { href: "/register", label: "get started" },
  { href: "/login", label: "sign in" },
  { href: "#maths", label: "the maths" },
  { href: "#how", label: "how it works" },
  { href: "#recipes", label: "recipes" },
  { href: "#letters", label: "letters" },
];

export default function Finale() {
  const reduce = useReducedMotion();

  return (
    <section
      id="finale"
      className="relative overflow-hidden bg-paper"
      aria-label="Start cooking"
    >
      {/* Ambient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 40% at 30% 30%, rgba(59,90,63,0.09), transparent 70%), radial-gradient(50% 40% at 80% 65%, rgba(198,70,32,0.05), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-[1320px] px-5 pt-28 pb-16 sm:px-10 sm:pt-32">
        {/* Chapter head */}
        <div className="mb-10 flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-ink-mute">
          <span>Chapter VII · the invitation</span>
          <span className="hidden sm:inline">Editor&apos;s note</span>
          <span className="font-serif italic text-ink">Fig. 07</span>
        </div>
        <div className="rule mb-14 origin-left" />

        <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-10">
          {/* Left: headline + CTA */}
          <div className="lg:col-span-7">
            <p className="eyebrow mb-6">the whole idea, again</p>
            <h2 className="display text-[clamp(3rem,8vw,7rem)] leading-[0.95] text-ink">
              <span className="block overflow-hidden">
                <SplitReveal
                  text="the fridge is"
                  as="span"
                  trigger="view"
                  delay={0.05}
                  stagger={0.025}
                />
              </span>
              <span className="block overflow-hidden italic text-matcha">
                <SplitReveal
                  text="already full."
                  as="span"
                  trigger="view"
                  delay={0.22}
                  stagger={0.025}
                />
              </span>
            </h2>

            <motion.p
              initial={reduce ? undefined : { opacity: 0, y: 12 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="mt-8 max-w-xl text-lg leading-relaxed text-ink-soft"
            >
              Stop scrolling recipes that need eight things you don&apos;t have.
              Type in what&apos;s on the shelf. We&apos;ll do the ranking, the
              swapping, and the honest math.
            </motion.p>

            <motion.div
              initial={reduce ? undefined : { opacity: 0, y: 16 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="mt-10 flex flex-wrap items-center gap-3"
            >
              <MagneticButton href="/register">
                start cooking free
                <span
                  aria-hidden
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </MagneticButton>
              <MagneticButton href="/login" variant="ghost">
                already a reader
              </MagneticButton>
            </motion.div>

            <motion.p
              initial={reduce ? undefined : { opacity: 0 }}
              whileInView={reduce ? undefined : { opacity: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.7, delay: 0.85 }}
              className="mt-6 flex items-center gap-2 text-xs text-ink-mute"
            >
              <motion.span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rounded-full bg-matcha"
                animate={
                  reduce ? undefined : { scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }
                }
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              no card required · no premium tier · your fridge stays private
            </motion.p>
          </div>

          {/* Right: stat card */}
          <div className="lg:col-span-5">
            <motion.div
              initial={reduce ? undefined : { opacity: 0, y: 24 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-2xl border border-ink/12 bg-white p-6 shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_30px_60px_-30px_rgba(0,0,0,0.35)]"
            >
              <div className="mb-4 flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-ink-mute">
                <span>by the numbers</span>
                <span>as of 2026</span>
              </div>
              <div className="rule mb-6" />
              <dl className="space-y-5">
                {STATS.map((row) => (
                  <div
                    key={row.k}
                    className="flex items-baseline justify-between border-b border-dashed border-ink/12 pb-3"
                  >
                    <dt className="text-[10px] uppercase tracking-[0.24em] text-ink-mute">
                      {row.k}
                    </dt>
                    <dd className="font-serif text-2xl text-ink">{row.v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 font-serif italic text-ink-mute">
                &ldquo;It&apos;s just a recipe browser. That&apos;s the whole
                idea.&rdquo;
              </p>
            </motion.div>
          </div>
        </div>

        {/* Steam illustration */}
        <div className="mt-24 flex justify-center">
          <motion.svg
            viewBox="0 0 240 160"
            width="200"
            height="140"
            aria-hidden
            initial="rest"
            whileHover={reduce ? undefined : "hover"}
          >
            {[
              { d: "M85 80 Q92 55 82 32 Q74 14 92 2", delay: 0 },
              { d: "M120 80 Q128 50 116 25 Q106 8 128 -4", delay: 0.15 },
              { d: "M155 80 Q162 55 150 32 Q142 14 160 2", delay: 0.3 },
            ].map((s, i) => (
              <motion.path
                key={i}
                d={s.d}
                stroke="var(--color-ink-mute)"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                strokeDasharray="240"
                initial={reduce ? { strokeDashoffset: 0 } : { strokeDashoffset: 240 }}
                whileInView={reduce ? undefined : { strokeDashoffset: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{
                  duration: 1.6,
                  delay: s.delay,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            ))}
            <ellipse
              cx="120"
              cy="120"
              rx="88"
              ry="14"
              fill="var(--color-cream)"
              stroke="var(--color-hairline)"
              strokeWidth="1"
            />
            <ellipse cx="120" cy="117" rx="66" ry="8" fill="var(--color-paper)" />
            <circle cx="120" cy="117" r="2" fill="var(--color-matcha)" opacity="0.7" />
          </motion.svg>
        </div>

        {/* Wordmark closer */}
        <p className="mx-auto mb-12 max-w-2xl text-center font-serif text-[clamp(1.4rem,3vw,2.4rem)] italic leading-tight text-ink">
          {"cook what you already have.".split(" ").map((w, i) => (
            <motion.span
              key={i}
              initial={reduce ? undefined : { opacity: 0, y: 24 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{
                duration: 0.7,
                delay: 0.4 + i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mr-3 inline-block"
            >
              {w}
            </motion.span>
          ))}
        </p>

        <div className="rule mb-10 origin-left" />

        {/* Colophon */}
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row">
          <div>
            <div className="flex items-center gap-2">
              <LogoMark className="h-6 w-6" />
              <span className="font-serif text-xl">
                platemate<span className="text-matcha">.</span>
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm text-ink-mute">
              A recipe browser for students who cook with what&apos;s already
              there. Free, forever, no scroll-through-the-life-story recipes.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm text-ink-soft">
            {FOOTER_LINKS.map((l) =>
              l.href.startsWith("#") ? (
                <a key={l.href} href={l.href} className="hover:text-ink">
                  {l.label}
                </a>
              ) : (
                <Link key={l.href} href={l.href} className="hover:text-ink">
                  {l.label}
                </Link>
              )
            )}
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-ink-mute">
          <span>© 2026 platemate · printed on the internet</span>
          <span>Vol. 1 · No. 1</span>
        </div>
      </div>
    </section>
  );
}
