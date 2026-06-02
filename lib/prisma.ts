import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

function getPrismaClient(): PrismaClient {
  if (globalThis.prisma) return globalThis.prisma;
  const client = new PrismaClient();
  if (process.env.NODE_ENV !== "production") globalThis.prisma = client;
  return client;
}

// Lazy proxy: only instantiates PrismaClient when first property is accessed (at runtime, not build time)
const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export default prisma;
