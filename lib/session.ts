import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/prisma/prisma-client'

/**
 * Returns userId from session.
 * By default — only from session.user.id.
 * Optional email fallback omitted — disabled as best practice.
 * If you really need temporal compatibility — see option below.
 */
export async function getUserIdFromSession(strict = true): Promise<string | null> {
  const session = await getServerSession(authOptions)
  const id = session?.user?.id as string | undefined
  if (id) return id ?? null

  if (strict) return null

  // --- NOT RECOMMENDED, but you can temporarily leave a fallback for email ---
  const email = session?.user?.email
  if (!email) return null
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  return user?.id ?? null
}
