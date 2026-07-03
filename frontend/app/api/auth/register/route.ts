import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // SECURITY: throttle account creation per-IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const allowed = await rateLimit(`register:${ip}`, 5, 60);
    if (!allowed) {
      return Response.json({ error: "Too many requests, please try again later" }, { status: 429 });
    }

    const body = await request.json();

    // SECURITY: Validate all inputs with Zod
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { username, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check for existing user (email or username)
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { username },
        ],
      },
      select: { email: true, username: true },
    });

    if (existing) {
      const field = existing.email === normalizedEmail ? "email" : "username";
      return Response.json(
        { error: `An account with this ${field} already exists` },
        { status: 409 }
      );
    }

    // SECURITY: Hash password with bcrypt, cost factor 12
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user, profile, and dietary restrictions in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          username,
          passwordHash,
        },
        select: { id: true, email: true, username: true },
      });

      await tx.userProfile.create({
        data: { userId: newUser.id },
      });

      await tx.userDietaryRestriction.create({
        data: { userId: newUser.id },
      });

      return newUser;
    });

    return Response.json(
      { message: "Account created", user: { id: user.id, username: user.username } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    // SECURITY: Do not leak internal error details
    return Response.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
