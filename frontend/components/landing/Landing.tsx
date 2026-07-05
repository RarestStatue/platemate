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
