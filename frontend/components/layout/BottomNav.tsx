"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconHome,
  IconSearch,
  IconPlus,
  IconHeart,
  IconUser,
} from "@tabler/icons-react";
import clsx from "clsx";

type NavItem = {
  href: string;
  label: string;
  icon: typeof IconHome;
  primary?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/home", label: "Home", icon: IconHome },
  { href: "/search", label: "Search", icon: IconSearch },
  { href: "/upload", label: "Add", icon: IconPlus, primary: true },
  { href: "/saved", label: "Saved", icon: IconHeart },
  { href: "/profile", label: "You", icon: IconUser },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 pb-safe pl-safe pr-safe md:hidden"
    >
      <div className="mx-auto flex max-w-md items-center justify-around gap-1 border-t border-hairline bg-cream/90 px-2 py-1.5 shadow-[0_-2px_20px_-8px_rgba(0,0,0,0.15)] backdrop-blur">
        {NAV_ITEMS.map(({ href, label, icon: Icon, primary }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className={clsx(
                "group relative flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-full py-1 text-[10px] uppercase tracking-[0.14em] transition active:scale-95",
                primary
                  ? "text-cream"
                  : isActive
                  ? "text-ink"
                  : "text-ink-mute hover:text-ink"
              )}
            >
              {primary ? (
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-ink text-cream shadow-sm transition group-hover:bg-matcha">
                  <Icon size={22} strokeWidth={2} aria-hidden />
                </span>
              ) : (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2 : 1.6} aria-hidden />
                  <span className={clsx("leading-none", isActive && "font-medium")}>
                    {label}
                  </span>
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute -top-0.5 h-1 w-1 rounded-full bg-matcha"
                    />
                  )}
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
