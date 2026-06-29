"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { IconHome, IconUpload, IconHeart, IconUser } from "@tabler/icons-react";

const TITLES: Record<string, string> = {
  "/home": "Home",
  "/search": "Search",
  "/upload": "Upload recipe",
  "/saved": "My favourites",
  "/settings": "Settings",
  "/discover": "Discover",
  "/trending": "Trending",
};

export default function Header() {
  const pathname = usePathname();

  // Match route titles, fall back to dynamic routes
  let title = TITLES[pathname] || "";
  if (pathname.startsWith("/recipe/")) title = "Recipe";
  if (pathname.startsWith("/profile/")) title = "Profile";

  if (!title) return null;

  return (
    <header className="bg-red text-white py-3 px-4 sticky top-0 z-40 relative flex items-center justify-center">
      <span className="font-semibold text-lg">{title}</span>

      {/* SECURITY: all hrefs are hardcoded internal paths — no open-redirect risk */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
        <Link
          href="/home"
          aria-label="Home"
          className="rounded-full p-1 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white transition-colors"
        >
          <IconHome size={24} aria-hidden />
        </Link>
        <Link
          href="/upload"
          aria-label="Upload recipe"
          className="rounded-full p-1 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white transition-colors"
        >
          <IconUpload size={24} aria-hidden />
        </Link>
        <Link
          href="/saved"
          aria-label="My favourites"
          className="rounded-full p-1 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white transition-colors"
        >
          <IconHeart size={24} aria-hidden />
        </Link>
        <Link
          href="/profile"
          aria-label="Go to profile"
          className="rounded-full p-1 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white transition-colors"
        >
          <IconUser size={24} aria-hidden />
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="px-2 py-1 text-sm font-medium hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white rounded transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
