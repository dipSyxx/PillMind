import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import prisma from '@/prisma/prisma-client'

const schema = z.object({
  timezone: z.string().min(1),
  timeFormat: z.enum(['H12', 'H24']),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Bad data' }, { status: 400 })

  const { timezone, timeFormat } = parsed.data

  await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      timezone,
      timeFormat,
      defaultChannels: ['PUSH', 'EMAIL'],
    },
    update: {
      timezone,
      timeFormat,
    },
  })

  return NextResponse.json({ ok: true })
}
