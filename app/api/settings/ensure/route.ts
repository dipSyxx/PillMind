import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/prisma/prisma-client'

export const runtime = 'nodejs'

const BodySchema = z
  .object({
    timezone: z.string().min(1),
    timeFormat: z.enum(['H12', 'H24']),
  })
  .partial()

async function getUserIdFromSession() {
  const session = await getServerSession(authOptions)
  const sessionUserId = (session as any)?.user?.id as string | undefined
  if (sessionUserId) return sessionUserId
  const email = session?.user?.email
  if (!email) return null
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  return user?.id ?? null
}

export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromSession()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) {
      console.warn('ensure settings: invalid body, will use defaults', parsed.error.flatten())
    }
    const tz = parsed.success && parsed.data.timezone ? parsed.data.timezone : 'UTC'
    const tf = parsed.success && parsed.data.timeFormat ? parsed.data.timeFormat : 'H24'

    const existing = await prisma.userSettings.findUnique({ where: { userId } })
    if (existing) return NextResponse.json(existing)

    const created = await prisma.userSettings.create({
      data: {
        userId,
        timezone: tz,
        timeFormat: tf as any,
        defaultChannels: ['EMAIL'],
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    console.error('[ensure-settings] error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
