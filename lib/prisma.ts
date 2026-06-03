import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

// In serverless environments each module is loaded fresh per invocation.
// globalThis persists across warm re-uses of the same Lambda container.
const prisma: PrismaClient =
  globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
} else {
  // In production, cache on globalThis so warm invocations reuse the client
  // and don't exhaust the DB connection pool.
  globalThis.prisma = prisma;
}

export default prisma;
