import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { authConfig } from "./auth.config";
import type { Session } from "next-auth";

function buildAuth() {
  return NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    ...authConfig,
  });
}

// Lazy initialization — defers NextAuth setup to first call so build-time
// module evaluation doesn't fail when NEXTAUTH_SECRET is not set.
let _instance: ReturnType<typeof buildAuth> | null = null;

function getInstance() {
  if (!_instance) _instance = buildAuth();
  return _instance;
}

export const handlers = new Proxy({} as ReturnType<typeof buildAuth>["handlers"], {
  get(_, key) { return (getInstance().handlers as any)[key]; },
});

export async function auth(...args: Parameters<ReturnType<typeof buildAuth>["auth"]>) {
  return getInstance().auth(...(args as [])) as Promise<Session | null>;
}

export async function signIn(...args: any[]) {
  return (getInstance() as any).signIn(...args);
}

export async function signOut(...args: any[]) {
  return (getInstance() as any).signOut(...args);
}
