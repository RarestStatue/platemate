"use client";

import { useEffect, useState } from "react";
import { IconMoon, IconSun } from "@tabler/icons-react";

type Theme = "light" | "dark";

function currentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of DOM/localStorage theme on mount, needed for hydration-safe client state
    setTheme(currentTheme());
    setMounted(true);
  }, []);

  function applyTheme(next: Theme) {
    const html = document.documentElement;
    html.classList.add("theme-transitioning");
    html.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("theme", next);
    } catch {}
    setTheme(next);
    window.setTimeout(() => {
      html.classList.remove("theme-transitioning");
    }, 340);
  }

  function toggle(e: React.MouseEvent<HTMLButtonElement>) {
    const next: Theme = theme === "dark" ? "light" : "dark";

    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> };
    };
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (typeof doc.startViewTransition !== "function" || reduce) {
      applyTheme(next);
      return;
    }

    const html = document.documentElement;
    const x = e.clientX;
    const y = e.clientY;
    const r = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    html.style.setProperty("--tt-x", `${x}px`);
    html.style.setProperty("--tt-y", `${y}px`);
    html.style.setProperty("--tt-r", `${r}px`);

    doc.startViewTransition(() => applyTheme(next));
  }

  const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  const isDark = mounted && theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label={label}
      title={label}
      suppressHydrationWarning
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-ink/5 hover:text-ink"
    >
      <span className="relative block h-5 w-5">
        <IconMoon
          size={20}
          strokeWidth={1.5}
          aria-hidden
          className={[
            "absolute inset-0 transition-all duration-500 ease-out",
            isDark
              ? "rotate-90 scale-50 opacity-0"
              : "rotate-0 scale-100 opacity-100",
          ].join(" ")}
        />
        <IconSun
          size={20}
          strokeWidth={1.5}
          aria-hidden
          className={[
            "absolute inset-0 transition-all duration-500 ease-out",
            isDark
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-50 opacity-0",
          ].join(" ")}
        />
      </span>
    </button>
  );
}
