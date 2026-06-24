import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function ProfileRedirect() {
  const session = await auth();
  if (!session?.user?.name) {
    redirect("/login");
  }
  redirect(`/profile/${session.user.name}`);
}
