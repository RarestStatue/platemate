"use client";

import { useState } from "react";
import clsx from "clsx";

export default function FollowButton({
  username,
  initialFollowing,
}: {
  username: string;
  initialFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (pending) return;
    setPending(true);
    const next = !following;
    setFollowing(next);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(username)}/follow`, {
        method: next ? "POST" : "DELETE",
      });
      if (!res.ok) setFollowing(!next);
    } catch {
      setFollowing(!next);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-pressed={following}
      className={clsx(
        "rounded-full px-4 py-1.5 text-sm font-medium transition disabled:opacity-50",
        following
          ? "border border-border text-muted hover:text-foreground"
          : "bg-red text-white hover:opacity-90"
      )}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
