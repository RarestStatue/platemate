"use client";

import { motion, useReducedMotion } from "motion/react";

type Variant = "eggs" | "greens" | "citrus" | "grain" | "beans" | "cheese";

type Props = {
  variant?: Variant;
  className?: string;
  size?: number;
  animated?: boolean;
};

const PALETTES: Record<Variant, { rim: string; well: string; fills: string[]; accents: string[] }> = {
  eggs: {
    rim: "#E4E1D8",
    well: "#FBF9F3",
    fills: ["#F6E7B4", "#F1D77A", "#E9C25A"],
    accents: ["#A9C29A", "#7A9973"],
  },
  greens: {
    rim: "#E4E1D8",
    well: "#F1F3EA",
    fills: ["#B7CFA6", "#8FB07E", "#6A8E5A"],
    accents: ["#3B5A3F", "#D4C68A"],
  },
  citrus: {
    rim: "#E4E1D8",
    well: "#FBF9F3",
    fills: ["#F0D488", "#E8B84A", "#D89F2A"],
    accents: ["#7A9973", "#C64620"],
  },
  grain: {
    rim: "#E4E1D8",
    well: "#F4EFDF",
    fills: ["#E8D9A8", "#C6AF74", "#8E7A48"],
    accents: ["#6B4E15", "#3B5A3F"],
  },
  beans: {
    rim: "#E4E1D8",
    well: "#F6F3EC",
    fills: ["#B79879", "#8E6D4E", "#5A422A"],
    accents: ["#C64620", "#3B5A3F"],
  },
  cheese: {
    rim: "#E4E1D8",
    well: "#FBF9F3",
    fills: ["#F5E7B4", "#EACF7A", "#D4B450"],
    accents: ["#C64620", "#7A9973"],
  },
};

/**
 * Hand-drawn plate SVG. Replaces emoji-based recipe visuals.
 * Uses stroke wobble + slightly asymmetric shapes to feel illustrated
 * rather than clip-art.
 */
export default function DrawnPlate({
  variant = "eggs",
  className,
  size = 220,
  animated = true,
}: Props) {
  const reduce = useReducedMotion();
  const p = PALETTES[variant];
  const shouldAnimate = animated && !reduce;

  return (
    <motion.svg
      viewBox="0 0 240 240"
      width={size}
      height={size}
      className={className}
      aria-hidden
      animate={shouldAnimate ? { y: [0, -4, 0] } : {}}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    >
      <defs>
        <radialGradient id={`plate-rim-${variant}`} cx="50%" cy="45%" r="52%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="70%" stopColor="#FBF9F3" />
          <stop offset="100%" stopColor={p.rim} />
        </radialGradient>
        <radialGradient id={`plate-well-${variant}`} cx="50%" cy="50%" r="52%">
          <stop offset="0%" stopColor={p.well} />
          <stop offset="100%" stopColor="#F0EBDD" />
        </radialGradient>
      </defs>

      {/* Rim */}
      <circle cx="120" cy="120" r="112" fill={`url(#plate-rim-${variant})`} />
      {/* Inner well */}
      <circle
        cx="120"
        cy="120"
        r="88"
        fill={`url(#plate-well-${variant})`}
        stroke={p.rim}
        strokeWidth="1"
      />
      {/* Rim hairline */}
      <circle
        cx="120"
        cy="120"
        r="104"
        fill="none"
        stroke={p.rim}
        strokeWidth="1"
      />

      {variant === "eggs" && <EggsContent p={p} />}
      {variant === "greens" && <GreensContent p={p} />}
      {variant === "citrus" && <CitrusContent p={p} />}
      {variant === "grain" && <GrainContent p={p} />}
      {variant === "beans" && <BeansContent p={p} />}
      {variant === "cheese" && <CheeseContent p={p} />}

      {/* Signature dot */}
      <circle cx="120" cy="218" r="2" fill={p.accents[0]} opacity="0.6" />
    </motion.svg>
  );
}

function EggsContent({ p }: { p: (typeof PALETTES)[Variant] }) {
  return (
    <g>
      {/* Yolk 1 */}
      <ellipse cx="100" cy="110" rx="18" ry="16" fill={p.fills[1]} />
      <ellipse cx="97" cy="106" rx="6" ry="4" fill={p.fills[0]} opacity="0.7" />
      {/* Yolk 2 */}
      <ellipse cx="145" cy="130" rx="16" ry="14" fill={p.fills[1]} />
      <ellipse cx="142" cy="126" rx="5" ry="3" fill={p.fills[0]} opacity="0.7" />
      {/* Whites */}
      <path
        d="M70 118 Q76 88 104 82 Q140 78 158 100 Q178 118 172 148 Q166 178 130 176 Q92 176 78 158 Q64 138 70 118 Z"
        fill={p.fills[0]}
        opacity="0.55"
        stroke={p.fills[2]}
        strokeWidth="0.8"
      />
      {/* Greens sprinkle */}
      <circle cx="82" cy="150" r="3" fill={p.accents[0]} />
      <circle cx="88" cy="158" r="2" fill={p.accents[1]} />
      <circle cx="155" cy="152" r="2.5" fill={p.accents[0]} />
      <circle cx="130" cy="90" r="2" fill={p.accents[1]} />
      <circle cx="118" cy="160" r="2" fill={p.accents[0]} />
    </g>
  );
}

function GreensContent({ p }: { p: (typeof PALETTES)[Variant] }) {
  return (
    <g>
      {/* Big leaves */}
      <path
        d="M78 130 Q70 100 100 90 Q120 88 128 108 Q126 128 110 138 Q92 144 78 130 Z"
        fill={p.fills[1]}
      />
      <path
        d="M110 108 Q118 92 138 96 Q160 100 162 122 Q158 142 138 148 Q118 146 110 128 Z"
        fill={p.fills[2]}
      />
      <path
        d="M92 148 Q104 138 130 144 Q152 152 156 170 Q140 182 116 176 Q94 168 92 148 Z"
        fill={p.fills[0]}
      />
      {/* Yellow specks (feta) */}
      <circle cx="106" cy="114" r="4" fill={p.accents[1]} />
      <circle cx="140" cy="128" r="3.5" fill={p.accents[1]} />
      <circle cx="122" cy="160" r="3" fill={p.accents[1]} />
      <circle cx="128" cy="102" r="2.5" fill="#FFF" />
      <circle cx="146" cy="168" r="2" fill="#FFF" />
    </g>
  );
}

function CitrusContent({ p }: { p: (typeof PALETTES)[Variant] }) {
  return (
    <g>
      {/* Frittata base */}
      <ellipse cx="120" cy="122" rx="70" ry="60" fill={p.fills[1]} />
      <ellipse cx="120" cy="120" rx="60" ry="50" fill={p.fills[0]} opacity="0.6" />
      {/* Lemon slices */}
      <g>
        <circle cx="92" cy="100" r="12" fill={p.fills[0]} stroke={p.fills[2]} strokeWidth="1" />
        <circle cx="92" cy="100" r="7" fill={p.fills[1]} opacity="0.55" />
        <line x1="92" y1="88" x2="92" y2="112" stroke={p.fills[2]} strokeWidth="0.6" />
        <line x1="80" y1="100" x2="104" y2="100" stroke={p.fills[2]} strokeWidth="0.6" />
      </g>
      <g>
        <circle cx="148" cy="150" r="14" fill={p.fills[0]} stroke={p.fills[2]} strokeWidth="1" />
        <circle cx="148" cy="150" r="8" fill={p.fills[1]} opacity="0.55" />
        <line x1="148" y1="136" x2="148" y2="164" stroke={p.fills[2]} strokeWidth="0.6" />
        <line x1="134" y1="150" x2="162" y2="150" stroke={p.fills[2]} strokeWidth="0.6" />
      </g>
      {/* Herbs */}
      <circle cx="130" cy="98" r="2.5" fill={p.accents[0]} />
      <circle cx="118" cy="152" r="2" fill={p.accents[0]} />
      <circle cx="102" cy="140" r="1.8" fill={p.accents[0]} />
    </g>
  );
}

function GrainContent({ p }: { p: (typeof PALETTES)[Variant] }) {
  return (
    <g>
      {/* Rice/grain mound */}
      <ellipse cx="120" cy="130" rx="70" ry="52" fill={p.fills[0]} />
      {/* Grain flecks */}
      {Array.from({ length: 42 }).map((_, i) => {
        const angle = (i / 42) * Math.PI * 2;
        const r = 15 + (i % 5) * 8;
        const x = 120 + Math.cos(angle) * r + ((i * 7) % 11) - 5;
        const y = 130 + Math.sin(angle) * r * 0.75 + ((i * 3) % 7) - 3;
        return (
          <ellipse
            key={i}
            cx={x}
            cy={y}
            rx="2.5"
            ry="1.2"
            fill={p.fills[1]}
            transform={`rotate(${(i * 23) % 180} ${x} ${y})`}
          />
        );
      })}
      {/* Roasted veg accents */}
      <ellipse cx="100" cy="112" rx="10" ry="7" fill={p.fills[2]} transform="rotate(-20 100 112)" />
      <ellipse cx="150" cy="140" rx="9" ry="6" fill={p.fills[2]} transform="rotate(15 150 140)" />
      <circle cx="132" cy="108" r="4" fill={p.accents[1]} />
      <circle cx="112" cy="152" r="4.5" fill={p.accents[0]} />
    </g>
  );
}

function BeansContent({ p }: { p: (typeof PALETTES)[Variant] }) {
  return (
    <g>
      {/* Sauce base */}
      <ellipse cx="120" cy="128" rx="76" ry="58" fill={p.accents[0]} opacity="0.85" />
      {/* Beans */}
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * Math.PI * 2 + (i % 3);
        const r = 20 + (i % 4) * 12;
        const x = 120 + Math.cos(angle) * r;
        const y = 130 + Math.sin(angle) * r * 0.72;
        return (
          <ellipse
            key={i}
            cx={x}
            cy={y}
            rx="7"
            ry="4"
            fill={p.fills[i % 3]}
            transform={`rotate(${(i * 41) % 180} ${x} ${y})`}
          />
        );
      })}
      <circle cx="120" cy="118" r="3" fill="#FFF" opacity="0.9" />
      <circle cx="140" cy="150" r="2.5" fill="#FFF" opacity="0.7" />
    </g>
  );
}

function CheeseContent({ p }: { p: (typeof PALETTES)[Variant] }) {
  return (
    <g>
      {/* Toast/wrap base */}
      <rect
        x="60"
        y="90"
        width="120"
        height="80"
        rx="14"
        fill={p.fills[1]}
        transform="rotate(-4 120 130)"
      />
      <rect
        x="70"
        y="98"
        width="100"
        height="62"
        rx="8"
        fill={p.fills[0]}
        transform="rotate(-4 120 130)"
      />
      {/* Melty cheese drips */}
      <path
        d="M80 148 Q90 168 100 148 Q108 160 120 150 Q132 168 142 148 Q152 162 160 148 L160 168 L80 168 Z"
        fill={p.fills[2]}
        opacity="0.85"
      />
      {/* Herbs */}
      <circle cx="94" cy="120" r="2.5" fill={p.accents[1]} />
      <circle cx="130" cy="112" r="2" fill={p.accents[1]} />
      <circle cx="150" cy="126" r="2.5" fill={p.accents[0]} />
      <circle cx="110" cy="134" r="2" fill={p.accents[1]} />
    </g>
  );
}
