import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { privacySchema } from "@/lib/validators";

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = parseInt(session.user.id, 10);

    const body = await request.json();
    const parsed = privacySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // SECURITY: the row is addressed by the session's user id, never by anything
    // from the request body, so a caller can only ever flip their own profile.
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: { isPublic: parsed.data.isPublic },
      create: { userId, isPublic: parsed.data.isPublic },
      select: { isPublic: true },
    });

    return Response.json({ isPublic: profile.isPublic });
  } catch (error) {
    console.error("Profile privacy update error:", error);
    return Response.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
