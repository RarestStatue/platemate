import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        // SECURITY: throttle login attempts per email to slow credential stuffing
        const allowed = await rateLimit(`login:${email}`, 5, 60);
        if (!allowed) {
          return null;
        }

        let user;
        try {
          user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              username: true,
              userRole: true,
              passwordHash: true,
              deletedAt: true,
            },
          });
        } catch (err) {
          console.error("[auth] DB error during login:", err);
          return null;
        }

        if (!user || user.deletedAt) {
          return null;
        }

        // SECURITY: bcrypt compare is timing-safe
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        // Never return passwordHash to the client
        return {
          id: String(user.id),
          email: user.email,
          name: user.username,
          role: user.userRole,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.username = user.name ?? "";
        token.role = user.role;
        token.checkedAt = Date.now();
        return token;
      }

      // SECURITY: re-verify the user still exists/is active every 15 min so
      // deletion or a role change takes effect without waiting out the 7-day session.
      const checkedAt = token.checkedAt ?? 0;
      if (Date.now() - checkedAt > 15 * 60 * 1000) {
        const dbUser = await prisma.user.findUnique({
          where: { id: parseInt(token.id, 10) },
          select: { deletedAt: true, userRole: true },
        });

        if (!dbUser || dbUser.deletedAt) {
          return null;
        }

        token.role = dbUser.userRole;
        token.checkedAt = Date.now();
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.name = token.username;
      session.user.role = token.role;
      return session;
    },
  },
});
