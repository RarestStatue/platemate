"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

const ITEMS = [
  { emoji: "🥚", label: "3 eggs" },
  { emoji: "🧅", label: "½ onion" },
  { emoji: "🍅", label: "2 tomatoes" },
  { emoji: "🧀", label: "cheddar" },
  { emoji: "🥬", label: "spinach" },
  { emoji: "🍋", label: "½ lemon" },
  { emoji: "🌶️", label: "1 chilli" },
  { emoji: "🥕", label: "1 carrot" },
  { emoji: "🥔", label: "3 potatoes" },
  { emoji: "🌿", label: "parsley" },
  { emoji: "🍞", label: "stale bread" },
  { emoji: "🥑", label: "avocado" },
  { emoji: "🫒", label: "olives" },
  { emoji: "🧄", label: "garlic" },
  { emoji: "🥦", label: "broccoli" },
];

export default function IngredientRiver() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const section = ref.current!;
        const track = section.querySelector<HTMLElement>(".river-track");
        const overlay = section.querySelector<HTMLElement>(".river-overlay");
        const items = section.querySelectorAll<HTMLElement>(".river-item .river-item-inner");
        if (!track || !overlay) return;

        const getDistance = () =>
          Math.max(0, track.scrollWidth - window.innerWidth + window.innerWidth * 0.1);

        gsap.to(track, {
          x: () => -getDistance(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${getDistance() + window.innerHeight}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });

        // Overlay text fades in early, out late so it doesn't fight the river
        gsap.fromTo(
          overlay,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: {
              trigger: section,
              start: "top 70%",
              end: "top top",
              scrub: true,
            },
          }
        );

        gsap.to(overlay, {
          opacity: 0,
          y: -24,
          ease: "power2.in",
          scrollTrigger: {
            trigger: section,
            start: "bottom 90%",
            end: "bottom 60%",
            scrub: true,
          },
        });

        // Independent bob for each ingredient (never interferes with pin transform)
        items.forEach((el, i) => {
          gsap.to(el, {
            y: i % 2 ? -18 : 18,
            duration: 2.4 + (i % 4) * 0.3,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: i * 0.08,
          });
          gsap.to(el, {
            rotate: i % 2 ? 4 : -4,
            duration: 3 + (i % 3) * 0.4,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });
        });
      });

      // Reduced-motion: keep it static, still legible
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(".river-overlay", { opacity: 1, y: 0 });
      });
    },
    { scope: ref }
  );

  return (
    <section
      ref={ref}
      className="river-section relative isolate h-screen w-full overflow-hidden bg-cream"
      aria-label="Ingredient river"
    >
      {/* Editorial masthead */}
      <div className="pointer-events-none absolute left-0 right-0 top-8 z-20 mx-auto flex max-w-[1280px] items-center justify-between px-5 text-[10px] uppercase tracking-[0.28em] text-ink-mute sm:px-10">
        <span>The pantry files</span>
        <span className="hidden sm:inline">Feature · pp. 02–03</span>
        <span>Scroll →</span>
      </div>

      {/* Overlay title + soft cream scrim so the headline reads over emoji ingredients */}
      <div className="river-overlay pointer-events-none absolute left-0 right-0 top-1/2 z-10 mx-auto -translate-y-1/2 px-5 text-center sm:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[160%] w-[min(90vw,1000px)] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              "radial-gradient(closest-side, var(--color-cream) 35%, var(--color-cream) 50%, transparent 90%)",
          }}
        />
        <p className="eyebrow mb-4">A field guide</p>
        <h2 className="display mx-auto max-w-3xl text-[clamp(2.25rem,6vw,4.5rem)] leading-[0.98] text-ink">
          everything you <span className="italic text-matcha">already</span> have —
          <br />
          waiting to become dinner.
        </h2>
      </div>

      {/* Ambient rules */}
      <div className="pointer-events-none absolute inset-x-0 top-[calc(50%-9rem)] h-px bg-ink/10 sm:top-[calc(50%-11rem)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-[calc(50%-9rem)] h-px bg-ink/10 sm:bottom-[calc(50%-11rem)]" />

      {/* The river */}
      <div className="relative flex h-full items-center">
        <div className="river-track absolute left-0 top-1/2 flex -translate-y-1/2 items-end gap-16 pl-[8vw] pr-[100vw] will-change-transform sm:gap-24">
          {ITEMS.map((it, i) => (
            <div key={i} className="river-item relative flex flex-col items-center">
              <span
                aria-hidden
                className="river-item-inner block text-[7rem] leading-none drop-shadow-[0_20px_30px_rgba(0,0,0,0.08)] sm:text-[9rem]"
              >
                {it.emoji}
              </span>
              <span className="mt-4 font-serif text-xl italic text-ink-mute sm:text-2xl">
                {it.label}
              </span>
              <span className="mt-1 text-[9px] uppercase tracking-[0.3em] text-ink-mute/70">
                fig. {String(i + 1).padStart(2, "0")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom margin note */}
      <div className="pointer-events-none absolute bottom-8 left-0 right-0 z-20 mx-auto flex max-w-[1280px] items-center justify-between px-5 text-[10px] uppercase tracking-[0.28em] text-ink-mute sm:px-10">
        <span>No shopping. No shame.</span>
        <span className="hidden sm:inline">Continue reading ↓</span>
      </div>
    </section>
  );
}
