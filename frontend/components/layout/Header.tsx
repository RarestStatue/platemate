"use client";

import { usePathname } from "next/navigation";

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
    <header className="bg-red text-white py-3 px-4 text-center font-semibold text-lg sticky top-0 z-40">
      {title}
    </header>
  );
}
