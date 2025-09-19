// lib/auth.ts
import NextAuth, { type NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import prisma from '@/prisma/prisma-client'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma), // Prisma Adapter
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (creds) => {
        const schema = z.object({ email: z.string().email(), password: z.string().min(8) })
        const parsed = schema.safeParse(creds)
        if (!parsed.success) return null

        const { email, password } = parsed.data
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user?.passwordHash) return null

        const ok = await bcrypt.compare(password, user.passwordHash)
        if (!ok) return null

        return { id: user.id, name: user.name, email: user.email, image: user.image ?? undefined }
      },
    }),

    // --- OAuth Providers
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) token.userId = user.id
      if (account?.provider) token.provider = account.provider
      return token
    },
    async session({ session, token }) {
      if (token?.userId) (session.user as any).id = token.userId
      return session
    },
  },
}

export const { auth, signIn, signOut } = NextAuth(authOptions)
