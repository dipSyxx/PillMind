import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import prisma from '@/prisma/prisma-client'

// --- Zod schema for the payload ---
// You already send `code` from the VerifyCodeModal.
// Here we ALSO accept timezone + timeFormat from the client UI (best practice).
const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  code: z.string().length(6),

  // UserSettings fields:
  timezone: z.string().min(1), // e.g. "Europe/Oslo"
  timeFormat: z.enum(['H12', 'H24']).default('H24'),
  // Optional: allow the client to pass preferred default channels (fallback below)
  defaultChannels: z.array(z.enum(['PUSH', 'EMAIL'])).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const { name, email, password, code, timezone, timeFormat, defaultChannels } = parsed.data

    // 1) Email already used?
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    // 2) Load the latest verification token for this email
    const tokenRow = await prisma.verificationToken.findFirst({
      where: { identifier: email },
      orderBy: { expires: 'desc' },
    })
    if (!tokenRow) {
      return NextResponse.json({ error: 'Verification code not found. Please request a new code.' }, { status: 400 })
    }

    // 3) Expiration check
    if (tokenRow.expires < new Date()) {
      // remove expired token
      await prisma.verificationToken.deleteMany({ where: { identifier: email } })
      return NextResponse.json({ error: 'Verification code expired. Please request a new code.' }, { status: 400 })
    }

    // 4) Compare provided code with stored hash
    const isMatch = await bcrypt.compare(code, tokenRow.token)
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid verification code.' }, { status: 400 })
    }

    // 5) Prepare password hash + default settings
    const passwordHash = await bcrypt.hash(password, 12)

    // Decide default channels if client did not pass any:
    // We recommend at least EMAIL to receive reminders; PUSH can be enabled later (PWA/native).
    const channels =
      defaultChannels && defaultChannels.length > 0 ? defaultChannels : (['EMAIL'] as Array<'PUSH' | 'EMAIL'>)

    // 6) Atomically create User + UserSettings and cleanup tokens
    // All statements either succeed or fail together.
    const currentTime = new Date()
    await prisma.$transaction(async (tx) => {
      // one-time use: delete all verification tokens for this identifier first
      await tx.verificationToken.deleteMany({ where: { identifier: email } })

      // create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          emailVerified: currentTime,
        },
        select: { id: true },
      })

      // create settings (1:1 by PK = userId)
      await tx.userSettings.create({
        data: {
          userId: user.id,
          timezone,
          timeFormat, // 'H12' | 'H24' (Prisma enum)
          defaultChannels: channels as any, // Channel[]
        },
      })
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('register error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
