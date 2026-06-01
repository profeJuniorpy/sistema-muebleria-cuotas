import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "./prisma";

// Definimos el esquema de validación para el login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = (auth?.user as any)?.role;
      const pathname = nextUrl.pathname;

      const isAuthPage = pathname === "/login";
      const isPublicPage = pathname === "/api/auth";

      if (isPublicPage) return true;

      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      if (!isLoggedIn) return false;

      // Role-based protection
      if (role === "ADMIN") return true;

      if (pathname.startsWith("/vendedor") && role !== "VENDEDOR") return false;
      if (pathname.startsWith("/cajero") && role !== "CAJERO") return false;
      if (pathname.startsWith("/almacen") && role !== "ALMACEN") return false;
      if (pathname.startsWith("/supervisor") && role !== "SUPERVISOR") return false;

      // Common areas or dashboard
      return true;
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = loginSchema.safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user || !user.password) return null;

          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) return user;
        }

        return null;
      },
    }),
  ],
} satisfies NextAuthConfig;
