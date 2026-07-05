"use client";

import { motion } from "motion/react";
import {
  TestimonialsColumn,
  type Testimonial,
} from "@/components/ui/testimonials-columns-1";

const testimonials: Testimonial[] = [
  {
    text: "made spinach eggs at 11pm instead of ordering. saved $18. slept better.",
    name: "kiara",
    role: "3rd yr chem · queen's",
    tag: "no-shop wins",
  },
  {
    text: "the substitutions library is my roommate for gluten. no more midnight loblaws runs.",
    name: "mo",
    role: "mcgill · undergrad",
    tag: "shared kitchen",
  },
  {
    text: "opened it thinking yeah right — cooked six things this week from the same fridge.",
    name: "jules",
    role: "waterloo · eng",
    tag: "convert",
  },
  {
    text: "still using it. still $0. still don't shop. still eating.",
    name: "sam",
    role: "ubc · psych",
    tag: "week 12",
  },
  {
    text: "used what was already there instead of buying more. felt like a small kind of magic.",
    name: "priya",
    role: "york · lit",
    tag: "quiet magic",
  },
  {
    text: "wilted spinach + leftover rice + one egg. a dinner. no lecture on the recipe.",
    name: "theo",
    role: "carleton · phil",
    tag: "get to the food",
  },
  {
    text: "roommate's vegan, mine's gluten-free. platemate found dinner. nobody yelled.",
    name: "nadia",
    role: "toronto met",
    tag: "shared kitchen",
  },
  {
    text: "the 'what's already open' filter changed my whole week. no more forgotten jars.",
    name: "elias",
    role: "concordia",
    tag: "open jars",
  },
  {
    text: "i used to grocery shop on autopilot. now i cook the fridge first. weird flex, huge savings.",
    name: "hana",
    role: "sfu · bio",
    tag: "grocery detox",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

export default function Testimonials() {
  return (
    <section
      id="letters"
      className="relative overflow-hidden border-t border-ink/12 bg-cream py-24 sm:py-32"
      aria-label="Letters to the editor"
    >
      {/* Ambient wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(50% 40% at 20% 30%, rgba(59,90,63,0.05), transparent 70%), radial-gradient(50% 40% at 85% 70%, rgba(198,70,32,0.04), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-[1320px] px-5 sm:px-10">
        {/* Chapter head */}
        <div className="mb-10 flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-ink-mute">
          <span>Chapter VI · letters</span>
          <span className="hidden sm:inline">Correspondence · pp. 18–19</span>
          <span className="font-serif italic text-ink">Fig. 06</span>
        </div>
        <div className="rule mb-12 origin-left" />

        {/* Masthead */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mb-14 grid grid-cols-1 items-end gap-8 lg:grid-cols-12"
        >
          <div className="lg:col-span-6">
            <p className="eyebrow mb-4">Notes from the mailroom</p>
            <h2 className="display text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[0.98] text-ink">
              a small stack of
              <br />
              <span className="italic text-matcha">postcards.</span>
            </h2>
          </div>
          <div className="lg:col-span-6">
            <p className="max-w-md text-lg leading-relaxed text-ink-soft">
              Actual notes we&apos;ve received from students who stopped buying
              things they already had. Names shortened, feelings preserved.
            </p>
          </div>
        </motion.div>

        {/* Three scrolling columns */}
        <div className="flex justify-center gap-6 mt-4 [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)] max-h-[720px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={22} />
          <TestimonialsColumn
            testimonials={secondColumn}
            className="hidden md:block"
            duration={28}
          />
          <TestimonialsColumn
            testimonials={thirdColumn}
            className="hidden lg:block"
            duration={26}
          />
        </div>

        {/* Footer note */}
        <div className="mt-14 flex items-center justify-between border-t border-ink/12 pt-8 text-[10px] uppercase tracking-[0.28em] text-ink-mute">
          <span>send yours to hello@platemate.app</span>
          <span className="hidden sm:inline">names abbreviated on request</span>
          <span className="font-serif italic text-ink">printed on paper</span>
        </div>
      </div>
    </section>
  );
}
