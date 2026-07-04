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
    setTheme(currentTheme());
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("theme", next);
    } catch {}
    setTheme(next);
  }

  const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  const Icon = theme === "dark" ? IconSun : IconMoon;

  return (
    <button
      onClick={toggle}
      aria-label={label}
      title={label}
      suppressHydrationWarning
      className="rounded-full p-2 text-ink-soft transition hover:bg-ink/5 hover:text-ink"
    >
      {/* Render a stable icon pre-mount to avoid hydration flicker */}
      {mounted ? (
        <Icon size={20} strokeWidth={1.5} aria-hidden />
      ) : (
        <IconMoon size={20} strokeWidth={1.5} aria-hidden />
      )}
    </button>
  );
}
