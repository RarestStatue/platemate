"use client";

import { signOut, useSession } from "next-auth/react";
import { IconSettings } from "@tabler/icons-react";

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <IconSettings size={24} className="text-muted" />
        <h1 className="text-xl font-bold">Account settings</h1>
      </div>

      {session?.user && (
        <div className="space-y-4">
          <div className="border border-border rounded-lg p-4">
            <label className="block text-sm font-medium text-muted mb-1">
              Username
            </label>
            <p className="text-foreground">@{session.user.name}</p>
          </div>

          <div className="border border-border rounded-lg p-4">
            <label className="block text-sm font-medium text-muted mb-1">
              Email
            </label>
            <p className="text-foreground">{session.user.email}</p>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full py-2.5 border-2 border-red text-red rounded-lg font-semibold hover:bg-red-light transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
