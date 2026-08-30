import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

// Edge-safe config: NO adapter, NO Prisma, NO bcrypt here — this file is imported
// by middleware, which runs on the Edge runtime. The Credentials provider and the
// Prisma adapter are added in auth.ts (Node runtime only).
export const authConfig = {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const p = request.nextUrl.pathname;
      const isCms = p.startsWith("/admin") || p.startsWith("/studio");
      if (isCms) return !!auth?.user;
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: Role }).role;
        token.uid = user.id as string;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
