"use client";

import Link from "next/link";
import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";
import type { ComponentProps, MouseEvent, ReactNode } from "react";
import { useRef } from "react";

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  strength?: number;
  variant?: "solid" | "ghost";
} & Omit<ComponentProps<typeof Link>, "href">;

export default function MagneticButton({
  href,
  children,
  className,
  strength = 22,
  variant = "solid",
  ...rest
}: Props) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 15, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 180, damping: 15, mass: 0.4 });

  const onMove = (e: MouseEvent<HTMLAnchorElement>) => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    x.set(((e.clientX - cx) / r.width) * strength);
    y.set(((e.clientY - cy) / r.height) * strength);
  };

  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  const base =
    variant === "solid"
      ? "bg-ink text-cream hover:bg-ink-soft"
      : "border border-ink/20 bg-transparent text-ink hover:border-ink";

  return (
    <motion.span style={{ x: sx, y: sy, display: "inline-flex" }}>
      <Link
        ref={ref}
        href={href}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className={
          className ??
          `group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-6 py-3 text-sm font-medium transition ${base}`
        }
        {...rest}
      >
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
        <span className="relative">{children}</span>
      </Link>
    </motion.span>
  );
}
