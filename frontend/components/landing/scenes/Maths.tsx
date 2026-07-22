"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValueEvent,
  useReducedMotion,
} from "motion/react";

const FACTS = [
  { n: "2.3M", label: "tonnes wasted every year in Canada" },
  { n: "63%", label: "of that comes from home kitchens" },
  { n: "$3,000", label: "average student food spend / yr" },
  { n: "40%", label: "cut with even light meal planning" },
];

export default function Maths() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const numberRef = useRef<HTMLSpanElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const raw = useTransform(scrollYProgress, [0, 0.6], [0, 1300]);
  const smoothed = useSpring(raw, { stiffness: 90, damping: 24, mass: 0.5 });

  useMotionValueEvent(smoothed, "change", (v) => {
    if (numberRef.current) {
      numberRef.current.textContent = Math.round(v).toLocaleString();
    }
  });

  const captionAfter = useTransform(scrollYProgress, [0.55, 0.75], [0, 1]);
  const captionAfterY = useTransform(scrollYProgress, [0.55, 0.75], [18, 0]);
  const factY = useTransform(scrollYProgress, [0.4, 0.75], [30, 0]);
  const factOpacity = useTransform(scrollYProgress, [0.4, 0.7], [0, 1]);
  const barScale = useTransform(scrollYProgress, [0.2, 0.75], [0, 1]);
  const progressBar = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section
      ref={ref}
      id="maths"
      className="relative bg-matcha text-cream"
      style={{ height: "220vh" }}
      aria-label="The $1,300 problem"
    >
      <div className="sticky top-0 grid h-screen grid-rows-[auto_1fr_auto] overflow-hidden">
        {/* Faint dot grid: cream on green, ledger-paper feel */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(rgba(251,249,243,0.10) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Warm vignette for depth */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 20% 25%, rgba(251,249,243,0.10) 0%, rgba(251,249,243,0) 55%)",
          }}
        />

        {/* Chapter head */}
        <div className="relative z-20 mx-auto w-full max-w-[1320px] px-5 pt-8 sm:px-10 sm:pt-12">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-cream/60">
            <span className="text-cream">Chapter III · the maths</span>
            <span className="hidden sm:inline">Feature · pp. 06–07</span>
            <span className="font-serif italic text-cream">Fig. 03</span>
          </div>
          <div className="mx-auto mt-4 h-px w-[min(80vw,720px)] overflow-hidden bg-cream/15">
            <motion.div
              className="h-full origin-left bg-cream"
              style={{ width: progressBar }}
            />
          </div>
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-[1320px] items-start overflow-hidden px-5 pt-4 sm:px-10 sm:pt-6">
          <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Big counter */}
          <div className="lg:col-span-7">
            <p className="eyebrow mb-4 text-cream/70">The green bin report</p>
            <h2 className="display leading-[0.9] text-cream">
              <span className="mr-2 text-[clamp(2rem,5vw,4rem)] align-top text-matcha-soft/80">
                $
              </span>
              <span
                ref={numberRef}
                className="text-[clamp(6rem,20vw,16rem)] tabular-nums text-cream drop-shadow-[0_2px_28px_rgba(251,249,243,0.18)]"
                aria-live="polite"
              >
                {reduce ? "1,300" : "0"}
              </span>
              <br />
              <span className="text-[clamp(2rem,5vw,4.5rem)] italic text-matcha-soft">
                a year,
              </span>
              <br />
              <span className="text-[clamp(2rem,5vw,4.5rem)] text-cream/45">
                in the bin.
              </span>
            </h2>

            {/* Waste vs saved bar */}
            <div className="mt-10 max-w-md">
              <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-cream/60">
                <span>the shape of the loss</span>
                <span>household · avg</span>
              </div>
              <div className="relative h-3 overflow-hidden rounded-full bg-cream/10 ring-1 ring-cream/10">
                <motion.div
                  className="absolute inset-y-0 left-0 origin-left bg-cream"
                  style={{ scaleX: barScale, width: "63%" }}
                />
                <motion.div
                  className="absolute inset-y-0 origin-left bg-matcha-soft/70"
                  style={{
                    scaleX: barScale,
                    left: "63%",
                    width: "37%",
                  }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[10px] uppercase tracking-[0.24em] text-cream/60">
                <span className="text-cream">63% wasted</span>
                <span className="text-matcha-soft">37% actually cooked</span>
              </div>
            </div>
          </div>

          {/* Right: captions + facts */}
          <div className="relative lg:col-span-5">
            <div className="space-y-5">
              <p className="max-w-md font-serif text-2xl leading-snug text-cream/80 sm:text-3xl">
                The average Canadian household throws away{" "}
                <span className="italic text-cream">roughly $1,300</span> of
                edible food every year.
              </p>

              <motion.p
                style={{
                  opacity: reduce ? 1 : captionAfter,
                  y: reduce ? 0 : captionAfterY,
                }}
                className="max-w-md font-serif text-2xl leading-snug text-cream sm:text-3xl"
              >
                That&apos;s the{" "}
                <span className="italic text-matcha-soft">half-jar of pesto</span>,
                the browning banana, the bag of spinach at the back -
                paid for, forgotten, tossed.
              </motion.p>
            </div>

            <motion.div
              style={{ y: reduce ? 0 : factY, opacity: reduce ? 1 : factOpacity }}
              className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-cream/15 pt-8"
            >
              {FACTS.map((f) => (
                <div key={f.n}>
                  <div className="font-serif text-3xl leading-tight text-cream sm:text-4xl">
                    {f.n}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.24em] text-cream/60">
                    {f.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
          </div>
        </div>

        {/* Bottom caption */}
        <div className="relative z-20 mx-auto w-full max-w-[1320px] px-5 pb-8 sm:px-10 sm:pb-12">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-cream/60">
            <span>source · statscan · nzwc</span>
            <motion.span
              className="font-serif text-lg italic text-matcha-soft"
              style={{ opacity: reduce ? 1 : captionAfter }}
            >
              same fridge. different ending.
            </motion.span>
            <span className="text-cream">continue ↓</span>
          </div>
        </div>
      </div>
    </section>
  );
}

