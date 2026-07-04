"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  IconBell,
  IconLogout,
  IconHome,
  IconSearch,
  IconPlus,
  IconHeart,
  IconUser,
} from "@tabler/icons-react";
import clsx from "clsx";
import LogoMark from "@/components/landing/LogoMark";
import ThemeToggle from "@/components/layout/ThemeToggle";

const TITLES: Record<string, string> = {
  "/home": "Home",
  "/search": "Search",
  "/upload": "Upload recipe",
  "/saved": "Favourites",
  "/settings": "Settings",
  "/discover": "Discover",
  "/trending": "Trending",
  "/profile": "Profile",
};

const DESKTOP_NAV = [
  { href: "/home", label: "Home", icon: IconHome },
  { href: "/search", label: "Search", icon: IconSearch },
  { href: "/upload", label: "Upload", icon: IconPlus },
  { href: "/saved", label: "Saved", icon: IconHeart },
  { href: "/profile", label: "Profile", icon: IconUser },
];

export default function Header() {
  const pathname = usePathname();

  let sub = TITLES[pathname] || "";
  if (pathname.startsWith("/recipe/")) sub = "Recipe";
  if (pathname.startsWith("/profile/")) sub = "Profile";

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-cream/85 pt-safe backdrop-blur">
      <div className="mx-auto flex max-w-[1280px] items-center gap-6 px-5 py-3 pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] sm:px-8">
        <Link
          href="/home"
          className="flex shrink-0 items-center gap-2"
          aria-label="platemate home"
        >
          <LogoMark className="h-7 w-7" />
          <span className="font-serif text-xl leading-none tracking-tight">
            platemate<span className="text-matcha">.</span>
          </span>
          {sub && (
            <>
              <span aria-hidden className="mx-2 hidden h-4 w-px bg-ink/25 md:hidden sm:block" />
              <span className="hidden text-[10px] uppercase tracking-[0.22em] text-ink-mute sm:inline md:hidden">
                {sub}
              </span>
            </>
          )}
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Primary" className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {DESKTOP_NAV.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition",
                  isActive
                    ? "bg-ink text-cream"
                    : "text-ink-soft hover:bg-ink/5 hover:text-ink"
                )}
              >
                <Icon size={16} strokeWidth={isActive ? 2 : 1.6} aria-hidden />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <ThemeToggle />
          <Link
            href="/saved"
            aria-label="Notifications"
            className="rounded-full p-2 text-ink-soft transition hover:bg-ink/5 hover:text-ink"
          >
            <IconBell size={20} strokeWidth={1.5} aria-hidden />
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            aria-label="Sign out"
            className="ml-1 hidden rounded-full p-2 text-ink-soft transition hover:bg-ink/5 hover:text-ink sm:inline-flex"
          >
            <IconLogout size={18} strokeWidth={1.5} aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}
