"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { IconBell, IconLogout } from "@tabler/icons-react";
import LogoMark from "@/components/landing/LogoMark";

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

export default function Header() {
  const pathname = usePathname();

  let sub = TITLES[pathname] || "";
  if (pathname.startsWith("/recipe/")) sub = "Recipe";
  if (pathname.startsWith("/profile/")) sub = "Profile";

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-cream/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-3 sm:px-8">
        <Link href="/home" className="flex items-center gap-2" aria-label="platemate home">
          <LogoMark className="h-7 w-7" />
          <span className="font-serif text-xl leading-none tracking-tight">
            platemate<span className="text-matcha">.</span>
          </span>
          {sub && (
            <>
              <span aria-hidden className="mx-2 h-4 w-px bg-ink/25" />
              <span className="text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                {sub}
              </span>
            </>
          )}
        </Link>

        {/* SECURITY: hrefs are hardcoded internal paths */}
        <div className="flex items-center gap-1">
          <Link
            href="/saved"
            aria-label="Notifications"
            className="rounded-full p-2 text-ink-soft transition hover:bg-ink/5 hover:text-ink"
          >
            <IconBell size={20} strokeWidth={1.5} aria-hidden />
          </Link>
          <Link
            href="/profile"
            aria-label="Profile"
            className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-ink/20 bg-white text-xs font-medium text-ink hover:border-ink"
          >
            me
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
