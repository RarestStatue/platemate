"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="w-full py-2.5 border-2 border-red text-red rounded-lg font-semibold hover:bg-red-light transition-colors"
    >
      Sign out
    </button>
  );
}
