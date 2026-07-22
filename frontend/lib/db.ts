import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  try {
    return new PrismaClient();
  } catch (err) {
    console.error("[db] PrismaClient init failed - using throwing stub:", err);
    // Fallback: proxy where every access rejects, so top-level import doesn't crash
    // and route-level try/catch can handle the query failure gracefully.
    const stub = new Proxy(
      {},
      {
        get() {
          return new Proxy(function () {}, {
            get() {
              return () => Promise.reject(new Error("Prisma client not initialized"));
            },
            apply() {
              return Promise.reject(new Error("Prisma client not initialized"));
            },
          });
        },
      }
    );
    return stub as unknown as PrismaClient;
  }
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
