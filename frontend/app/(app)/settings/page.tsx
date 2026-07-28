import { redirect } from "next/navigation";
import { IconSettings } from "@tabler/icons-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import PrivacyToggle from "@/components/common/PrivacyToggle";
import SignOutButton from "@/components/common/SignOutButton";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = parseInt(session.user.id, 10);
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { isPublic: true },
  });

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <IconSettings size={24} className="text-muted" />
        <h1 className="text-xl font-bold">Account settings</h1>
      </div>

      <h2 className="text-xs uppercase tracking-[0.14em] text-muted mb-2">
        Account
      </h2>
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
      </div>

      <h2 className="text-xs uppercase tracking-[0.14em] text-muted mb-2 mt-6">
        Privacy
      </h2>
      <div className="space-y-4">
        <PrivacyToggle initialIsPublic={profile?.isPublic ?? true} />

        <SignOutButton />
      </div>
    </div>
  );
}
