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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50 md:hidden">
      <div className="flex items-center justify-around py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex flex-col items-center gap-0.5 text-xs transition-colors min-w-[48px]",
                isActive ? "text-red" : "text-muted"
              )}
            >
              <Icon size={22} stroke={isActive ? 2.5 : 1.5} />
              <span className={clsx(isActive && "font-semibold")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
