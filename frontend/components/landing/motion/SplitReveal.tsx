"use client";

import { motion, useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";

type Props = {
  text: string;
  className?: string;
  charClassName?: string;
  style?: CSSProperties;
  delay?: number;
  stagger?: number;
  as?: "span" | "h1" | "h2" | "h3" | "p";
  once?: boolean;
  trigger?: "load" | "view";
};

const container = (stagger: number, delay: number) => ({
  hidden: {},
  show: {
    transition: {
      delayChildren: delay,
      staggerChildren: stagger,
    },
  },
});

const child = {
  hidden: { y: "115%", opacity: 0, rotate: 4 },
  show: {
    y: "0%",
    opacity: 1,
    rotate: 0,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 22,
      mass: 0.6,
    },
  },
};

export default function SplitReveal({
  text,
  className,
  charClassName,
  style,
  delay = 0,
  stagger = 0.025,
  as = "span",
  once = true,
  trigger = "load",
}: Props) {
  const reduce = useReducedMotion();
  const Tag = motion[as] as typeof motion.span;

  if (reduce) {
    return (
      <Tag className={className} style={style}>
        {text}
      </Tag>
    );
  }

  const viewProps =
    trigger === "view"
      ? { initial: "hidden", whileInView: "show", viewport: { once, amount: 0.4 } }
      : { initial: "hidden", animate: "show" };

  return (
    <Tag
      className={className}
      style={{ display: "inline-block", ...(style ?? {}) }}
      variants={container(stagger, delay)}
      {...viewProps}
      aria-label={text}
    >
      {[...text].map((ch, i) => (
        <span
          key={i}
          aria-hidden
          style={{
            display: "inline-block",
            overflow: "hidden",
            verticalAlign: "top",
            paddingTop: "0.22em",
            marginTop: "-0.22em",
            paddingBottom: "0.12em",
            marginBottom: "-0.12em",
            paddingLeft: "0.08em",
            marginLeft: "-0.08em",
            paddingRight: "0.18em",
            marginRight: "-0.18em",
          }}
        >
          <motion.span
            variants={child}
            style={{ display: "inline-block", willChange: "transform" }}
            className={charClassName}
          >
            {ch === " " ? " " : ch}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

