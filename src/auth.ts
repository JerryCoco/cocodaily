import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { sendMail } from "@/lib/mail";
import { newSignIn } from "@/lib/mail-templates";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  events: {
    async signIn({ user }) {
      if (!user?.email) return;
      try {
        const row = await prisma.user.findUnique({
          where: { email: user.email },
          select: { name: true, createdAt: true },
        });
        // Skip for a just-created account — they already got a welcome email.
        if (row && Date.now() - row.createdAt.getTime() > 2 * 60_000) {
          await sendMail({
            to: user.email,
            ...newSignIn({ name: row.name ?? "there", when: new Date() }),
          });
        }
      } catch (err) {
        console.error("[auth] sign-in notification failed", err);
      }
    },
  },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
});
