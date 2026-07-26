import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }
  return globalForPrisma.prisma;
}

// Proxy defers the real `new PrismaClient()` call until a property on
// `prisma` is actually accessed (e.g. `prisma.user.findUnique(...)`),
// rather than at module import time. This keeps Next's build-time route
// analysis from instantiating the client before the real engine exists.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    return (client as any)[prop];
  },
});
