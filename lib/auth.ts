import NextAuth, { type NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/prisma/prisma-client";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" as const },
  pages: { signIn: "/login" },
  providers: [
    // --- Manual email+password
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (creds) => {
        const schema = z.object({ email: z.string().email(), password: z.string().min(8) });
        const parsed = schema.safeParse(creds);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // мінімальні поля для JWT/Session
        return { id: user.id, name: user.name, email: user.email, image: user.image ?? undefined };
      },
    }),

    // --- Провайдери (можна ввімкнути пізніше)
    // Google({ allowDangerousEmailAccountLinking: true }),
    // GitHub({ allowDangerousEmailAccountLinking: true }),

    // Vipps (OIDC) — підключимо, коли будуть креденшіали:
    // {
    //   id: "vipps",
    //   name: "Vipps",
    //   type: "oidc",
    //   issuer: process.env.VIPPS_ISSUER, // prod: https://api.vipps.no/access-management-1.0/access/.well-known/openid-configuration
    //   clientId: process.env.VIPPS_CLIENT_ID,
    //   clientSecret: process.env.VIPPS_CLIENT_SECRET,
    //   profile(profile) {
    //     // типово OIDC повертає 'sub' — мапимо на id; email/phone можуть потребувати scope
    //     return { id: profile.sub, name: profile.name ?? null, email: profile.email ?? null };
    //   },
    // },
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) token.userId = user.id;
      if (account?.provider) token.provider = account.provider;
      return token;
    },
    async session({ session, token }) {
      if (token?.userId) (session.user as any).id = token.userId;
      return session;
    },
  },
};

export const { auth, signIn, signOut } = NextAuth(authOptions);
