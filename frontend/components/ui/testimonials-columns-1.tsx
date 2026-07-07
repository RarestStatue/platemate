"use client";

import React from "react";
import { motion } from "motion/react";

export type Testimonial = {
  text: string;
  name: string;
  role: string;
  tag?: string;
};

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{
          duration: props.duration || 15,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {[...new Array(2).fill(0)].map((_, index) => (
          <React.Fragment key={index}>
            {props.testimonials.map((t, i) => (
              <article
                key={i}
                className="relative w-full max-w-xs rounded-2xl border border-ink/12 bg-cream p-7 shadow-[0_1px_0_0_rgba(0,0,0,0.02),0_24px_50px_-40px_rgba(0,0,0,0.28)]"
              >
                {t.tag && (
                  <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-ink-mute">
                    <span>letter</span>
                    <span className="rounded-full bg-matcha-soft px-2 py-0.5 text-matcha">
                      {t.tag}
                    </span>
                  </div>
                )}

                <span
                  aria-hidden
                  className="pointer-events-none absolute right-4 top-3 font-serif text-6xl leading-none text-ink/10"
                >
                  &ldquo;
                </span>

                <p className="relative font-serif text-lg italic leading-snug text-ink sm:text-xl">
                  {t.text}
                </p>

                <div className="mt-6 flex items-center gap-3 border-t border-ink/12 pt-4">
                  <span
                    aria-hidden
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-matcha-soft font-serif text-lg text-matcha"
                  >
                    {t.name.charAt(0).toLowerCase()}
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-serif text-base leading-5 text-ink">
                      — {t.name}
                    </span>
                    <span className="truncate text-[10px] uppercase tracking-[0.24em] leading-5 text-ink-mute">
                      {t.role}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};
