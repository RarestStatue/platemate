import { auth } from "@/lib/auth";

/**
 * Returns the authenticated user's session or throws 401.
 * Use in API route handlers for protected endpoints.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return session;
}
