// app/api/user/settings/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/prisma/prisma-client'
import { z } from 'zod'

/** Enums (із Prisma):
 * enum TimeFormat { H12 H24 }
 * enum Channel { PUSH EMAIL SMS }
 */

const SettingsSchema = z.object({
  timezone: z.string().min(1, 'Timezone is required'),
  timeFormat: z.enum(['H12', 'H24']),
  defaultChannels: z
    .array(z.enum(['PUSH', 'EMAIL', 'SMS']))
    .max(3)
    .optional()
    .default([]),
})

async function getUserIdFromSession() {
  const session = await getServerSession(authOptions)

  const sessionUserId = (session as any)?.user?.id as string | undefined
  if (sessionUserId) return sessionUserId

  const email = session?.user?.email
  if (!email) return null

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })

  return user?.id ?? null
}

export async function GET() {
  const userId = await getUserIdFromSession()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const settings = await prisma.userSettings.findUnique({ where: { userId } })

  return NextResponse.json(
    settings ?? {
      userId,
      timezone: 'UTC',
      timeFormat: 'H24',
      defaultChannels: ['EMAIL'],
    },
  )
}

export async function PATCH(req: Request) {
  const userId = await getUserIdFromSession()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const parsed = SettingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid settings', details: parsed.error.flatten() }, { status: 400 })
  }

  const { timezone, timeFormat, defaultChannels } = parsed.data

  const updated = await prisma.userSettings.upsert({
    where: { userId },
    create: { userId, timezone, timeFormat, defaultChannels },
    update: { timezone, timeFormat, defaultChannels },
  })

  return NextResponse.json(updated)
}
