"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

type Step = {
  emoji: string;
  label: string;
  angle: number; // radians, position on plate
  radius: number; // 0..1 of plate radius
  scale: number;
  rotate: number;
};

const STEPS: Step[] = [
  { emoji: "🥚", label: "3 eggs, whisked", angle: -Math.PI / 2, radius: 0, scale: 1.0, rotate: -8 },
  { emoji: "🥬", label: "handful of spinach", angle: Math.PI * 0.15, radius: 0.55, scale: 1.1, rotate: 12 },
  { emoji: "🧀", label: "crumbled feta", angle: Math.PI * 0.85, radius: 0.5, scale: 0.9, rotate: -4 },
  { emoji: "🍋", label: "zest of ½ lemon", angle: -Math.PI * 0.15, radius: 0.6, scale: 0.85, rotate: 20 },
  { emoji: "🌿", label: "chopped parsley", angle: Math.PI * 0.5, radius: 0.35, scale: 0.8, rotate: -18 },
];

const PLATE_R_PX = 220;

export default function PlateAssembly() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const section = ref.current!;
        const items = section.querySelectorAll<HTMLElement>(".pa-item");
        const labels = section.querySelectorAll<HTMLElement>(".pa-label");
        const dots = section.querySelectorAll<HTMLElement>(".pa-dot");
        const steam = section.querySelectorAll<HTMLElement>(".pa-steam");
        const title = section.querySelector<HTMLElement>(".pa-title");
        const meta = section.querySelector<HTMLElement>(".pa-meta");
        const plateShadow = section.querySelector<HTMLElement>(".pa-plate-shadow");
        const rulerFill = section.querySelector<HTMLElement>(".pa-ruler-fill");

        gsap.set(items, { y: -420, opacity: 0, scale: 0.5, rotate: -30 });
        gsap.set(labels, { opacity: 0, x: -30 });
        gsap.set(dots, { scale: 0.4, opacity: 0.3 });
        gsap.set(steam, { opacity: 0 });
        gsap.set([title, meta], { opacity: 0, y: 30 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "+=260%",
            pin: true,
            scrub: 0.7,
            anticipatePin: 1,
          },
        });

        // Ruler fill grows across whole timeline
        tl.fromTo(
          rulerFill,
          { scaleX: 0 },
          { scaleX: 1, ease: "none", duration: STEPS.length + 1 },
          0
        );

        // Each ingredient drops in with a bounce
        STEPS.forEach((step, i) => {
          const item = items[i];
          const label = labels[i];
          const dot = dots[i];
          const at = i;

          tl.to(
            item,
            {
              y: 0,
              rotate: step.rotate,
              scale: step.scale,
              opacity: 1,
              ease: "back.out(1.7)",
              duration: 0.6,
            },
            at
          )
            .to(dot, { scale: 1, opacity: 1, ease: "power2.out", duration: 0.3 }, at)
            .to(
              label,
              { opacity: 1, x: 0, ease: "power2.out", duration: 0.4 },
              at + 0.1
            )
            // tiny settle wobble
            .to(item, { y: 4, ease: "sine.inOut", duration: 0.2 }, at + 0.5)
            .to(item, { y: 0, ease: "sine.inOut", duration: 0.2 }, at + 0.7);
        });

        // Steam appears after last ingredient
        tl.to(steam, { opacity: 1, stagger: 0.08, ease: "power2.out", duration: 0.5 }, STEPS.length)
          .to(title, { opacity: 1, y: 0, ease: "power3.out", duration: 0.6 }, STEPS.length + 0.1)
          .to(meta, { opacity: 1, y: 0, ease: "power2.out", duration: 0.5 }, STEPS.length + 0.3);

        // Plate shadow gets a subtle scale on load
        gsap.fromTo(
          plateShadow,
          { scale: 0.9, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: section,
              start: "top 80%",
              end: "top 40%",
              scrub: true,
            },
          }
        );
      });

      // Reduced-motion: skip drops, show finished plate
      mm.add("(prefers-reduced-motion: reduce)", () => {
        const section = ref.current!;
        gsap.set(section.querySelectorAll(".pa-item"), { opacity: 1, y: 0, rotate: 0, scale: 1 });
        gsap.set(section.querySelectorAll(".pa-label"), { opacity: 1, x: 0 });
        gsap.set(section.querySelectorAll(".pa-dot"), { scale: 1, opacity: 1 });
        gsap.set(section.querySelectorAll(".pa-steam"), { opacity: 1 });
        gsap.set(section.querySelectorAll(".pa-title, .pa-meta"), { opacity: 1, y: 0 });
        gsap.set(section.querySelector(".pa-ruler-fill"), { scaleX: 1 });
      });
    },
    { scope: ref }
  );

  return (
    <section
      ref={ref}
      className="pa-section relative isolate h-screen w-full overflow-hidden bg-paper"
      aria-label="Recipe assembly"
    >
      {/* Top rule + masthead */}
      <div className="pointer-events-none absolute left-0 right-0 top-8 z-20 mx-auto flex max-w-[1280px] items-center justify-between px-5 text-[10px] uppercase tracking-[0.28em] text-ink-mute sm:px-10">
        <span>Cover recipe · pp. 11</span>
        <span className="hidden sm:inline">Assembly required</span>
        <span>№ 001</span>
      </div>

      {/* Progress ruler under masthead */}
      <div className="pointer-events-none absolute left-1/2 top-16 z-20 h-px w-[min(80vw,720px)] -translate-x-1/2 overflow-hidden bg-ink/15">
        <div className="pa-ruler-fill h-full w-full origin-left bg-matcha" />
      </div>

      {/* Plate + ingredients centered */}
      <div className="relative flex h-full items-center justify-center px-5">
        <div className="relative">
          {/* Plate SVG */}
          <div
            className="pa-plate-shadow relative"
            style={{
              width: `min(78vmin, ${PLATE_R_PX * 2 + 40}px)`,
              height: `min(78vmin, ${PLATE_R_PX * 2 + 40}px)`,
              filter: "drop-shadow(0 40px 40px rgba(11,11,10,0.15))",
            }}
          >
            <svg viewBox="0 0 480 480" className="h-full w-full" aria-hidden>
              <defs>
                <radialGradient id="pa-plate" cx="50%" cy="46%" r="55%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="70%" stopColor="#FBF9F3" />
                  <stop offset="100%" stopColor="#E6E1D2" />
                </radialGradient>
                <radialGradient id="pa-well" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#F6F3EC" />
                  <stop offset="100%" stopColor="#FBF9F3" />
                </radialGradient>
              </defs>
              {/* rim */}
              <circle cx="240" cy="240" r="220" fill="url(#pa-plate)" />
              {/* inner well */}
              <circle cx="240" cy="240" r="176" fill="url(#pa-well)" stroke="#E4E1D8" strokeWidth="1" />
              {/* ring */}
              <circle cx="240" cy="240" r="204" fill="none" stroke="#E4E1D8" strokeWidth="1" />
              {/* tiny brand mark */}
              <circle cx="240" cy="422" r="3" fill="#3B5A3F" opacity="0.6" />
              <text
                x="240"
                y="440"
                textAnchor="middle"
                fontFamily="var(--font-serif)"
                fontSize="10"
                letterSpacing="4"
                fill="#6B6B66"
                opacity="0.55"
              >
                PLATEMATE
              </text>
            </svg>

            {/* Ingredients positioned around the well */}
            {STEPS.map((step, i) => {
              const x = 50 + Math.cos(step.angle) * step.radius * 30;
              const y = 46 + Math.sin(step.angle) * step.radius * 30;
              return (
                <span
                  key={i}
                  className="pa-item pointer-events-none absolute text-[clamp(3rem,7vmin,5rem)] leading-none"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  aria-hidden
                >
                  {step.emoji}
                </span>
              );
            })}

            {/* Steam SVG above plate */}
            <svg
              className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2"
              viewBox="0 0 160 100"
              width="160"
              height="100"
              aria-hidden
            >
              <path
                className="pa-steam"
                d="M40 92 Q46 60 38 34 Q30 18 44 8"
                stroke="#6B6B66"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                opacity="0.55"
              />
              <path
                className="pa-steam"
                d="M80 92 Q86 55 74 30 Q66 14 82 6"
                stroke="#6B6B66"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                opacity="0.65"
              />
              <path
                className="pa-steam"
                d="M120 92 Q124 62 116 38 Q108 22 122 10"
                stroke="#6B6B66"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                opacity="0.5"
              />
            </svg>
          </div>
        </div>

        {/* Side ingredient list (desktop) */}
        <aside className="pointer-events-none absolute right-6 top-1/2 hidden max-w-xs -translate-y-1/2 lg:right-16 lg:block">
          <div className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-ink-mute">
            <span className="h-px w-6 bg-ink-mute" />
            Assembling
          </div>
          <ul className="space-y-4">
            {STEPS.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="pa-dot mt-2 inline-block h-2 w-2 rounded-full bg-matcha" />
                <div>
                  <div className="pa-label flex items-baseline gap-2 font-serif text-lg leading-tight text-ink">
                    <span className="text-xl" aria-hidden>{step.emoji}</span>
                    {step.label}
                  </div>
                  <div className="pa-label mt-0.5 text-[10px] uppercase tracking-[0.24em] text-ink-mute">
                    step {String(i + 1).padStart(2, "0")}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {/* Bottom title reveal */}
      <div className="pointer-events-none absolute bottom-10 left-0 right-0 z-20 px-5 text-center sm:bottom-14">
        <p className="pa-title font-serif text-[clamp(1.75rem,4vw,3rem)] italic leading-tight text-matcha">
          Greek spinach omelette.
        </p>
        <p className="pa-meta mt-2 text-[10px] uppercase tracking-[0.32em] text-ink-mute">
          12 minutes · uses 4 of 4 in your fridge · no receipt
        </p>
      </div>
    </section>
  );
}
