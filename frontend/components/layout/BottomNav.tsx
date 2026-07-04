"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconHome,
  IconSearch,
  IconUpload,
  IconHeart,
  IconUser,
} from "@tabler/icons-react";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: IconHome },
  { href: "/search", label: "Search", icon: IconSearch },
  { href: "/upload", label: "Upload", icon: IconUpload },
  { href: "/saved", label: "Saved", icon: IconHeart },
  { href: "/profile", label: "Profile", icon: IconUser },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-hairline bg-cream/95 backdrop-blur md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "relative flex min-w-[48px] flex-col items-center gap-1 py-1 text-[10px] uppercase tracking-[0.14em] transition-colors",
                isActive ? "text-ink" : "text-ink-mute"
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
              <span className={clsx(isActive && "font-medium")}>{label}</span>
              {isActive && (
                <span
                  aria-hidden
                  className="absolute -top-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-matcha"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
