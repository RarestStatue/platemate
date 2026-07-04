"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

/**
 * WASTE → TASTE morph pinned scene.
 * The two words share 4 letters; we render both, cross-morph W↔T while the
 * whole stage tilts, background scrim warms up, and margin notes swap.
 */
export default function KineticType() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const section = ref.current!;
        const waste = section.querySelector<HTMLElement>(".kt-waste");
        const taste = section.querySelector<HTMLElement>(".kt-taste");
        const scrim = section.querySelector<HTMLElement>(".kt-scrim");
        const grid = section.querySelector<HTMLElement>(".kt-grid");
        const chapter = section.querySelector<HTMLElement>(".kt-chapter");
        const caption = section.querySelector<HTMLElement>(".kt-caption");
        const captionAfter = section.querySelector<HTMLElement>(".kt-caption-after");
        if (!waste || !taste || !scrim) return;

        gsap.set(taste, { yPercent: 110, opacity: 0, filter: "blur(12px)" });
        gsap.set(waste, { yPercent: 0, opacity: 1, filter: "blur(0px)" });
        gsap.set(scrim, { opacity: 0 });
        gsap.set(captionAfter, { opacity: 0, y: 10 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "+=140%",
            pin: true,
            scrub: 0.8,
            anticipatePin: 1,
          },
        });

        tl.to(scrim, { opacity: 1, ease: "power1.inOut" }, 0)
          .to(grid, { opacity: 0.15, ease: "power1.out" }, 0)
          .to(
            waste,
            {
              yPercent: -110,
              opacity: 0,
              filter: "blur(12px)",
              ease: "power2.in",
            },
            0.25
          )
          .to(
            taste,
            {
              yPercent: 0,
              opacity: 1,
              filter: "blur(0px)",
              ease: "power2.out",
            },
            0.32
          )
          .to(caption, { opacity: 0, y: -10, ease: "power2.in", duration: 0.2 }, 0.35)
          .to(
            captionAfter,
            { opacity: 1, y: 0, ease: "power2.out", duration: 0.35 },
            0.55
          )
          .to(
            chapter,
            { letterSpacing: "0.6em", ease: "power1.inOut" },
            0
          );
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(".kt-waste", { opacity: 0 });
        gsap.set(".kt-taste", { opacity: 1, yPercent: 0 });
        gsap.set(".kt-caption-after", { opacity: 1, y: 0 });
      });
    },
    { scope: ref }
  );

  return (
    <section
      ref={ref}
      className="kinetic-section relative isolate h-screen w-full overflow-hidden bg-ink text-cream"
      aria-label="Waste to taste"
    >
      {/* Ember scrim */}
      <div
        className="kt-scrim pointer-events-none absolute inset-0 opacity-0"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 55%, rgba(198,70,32,0.35), rgba(198,70,32,0.05) 55%, transparent 75%)",
        }}
      />
      {/* Faint grid */}
      <div
        className="kt-grid pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(251,249,243,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(251,249,243,0.06) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Top masthead */}
      <div className="pointer-events-none absolute left-0 right-0 top-8 z-20 mx-auto flex max-w-[1280px] items-center justify-between px-5 text-[10px] uppercase tracking-[0.28em] text-cream/60 sm:px-10">
        <span className="kt-chapter" style={{ letterSpacing: "0.28em" }}>
          Chapter II · The turn
        </span>
        <span className="hidden sm:inline">Interlude</span>
        <span>Scroll to transform</span>
      </div>

      {/* The type stage */}
      <div className="kt-stage relative flex h-full items-center justify-center">
        <div className="relative h-[min(48vh,60vw)] w-[92vw] overflow-hidden">
          <span
            className="kt-waste kt-word absolute inset-0 flex items-center justify-center text-center font-serif text-[clamp(6rem,22vw,20rem)] leading-none text-cream"
            aria-hidden
          >
            WASTE
          </span>
          <span
            className="kt-taste kt-word absolute inset-0 flex items-center justify-center text-center font-serif italic text-[clamp(6rem,22vw,20rem)] leading-none text-matcha-soft"
            aria-hidden
          >
            TASTE
          </span>
          <span className="sr-only">Waste transforms into taste.</span>
        </div>
      </div>

      {/* Bottom captions swap */}
      <div className="pointer-events-none absolute inset-x-0 bottom-16 z-20 h-8 px-5 text-center">
        <p className="kt-caption absolute inset-x-0 whitespace-nowrap text-xs uppercase tracking-[0.32em] text-cream/70">
          The average bin · $1,300 / year
        </p>
        <p className="kt-caption-after absolute inset-x-0 whitespace-nowrap font-serif text-lg italic text-matcha-soft">
          what if you just ate it instead?
        </p>
      </div>
    </section>
  );
}
