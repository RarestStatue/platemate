import { redirect } from "next/navigation";
import Landing from "@/components/landing/Landing";

export default async function RootPage() {
  try {
    // Deferred import so preview works without a generated Prisma client.
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    if (session) redirect("/home");
  } catch {
    // DB / auth not configured — show landing anyway.
  }
  return <Landing />;
}
