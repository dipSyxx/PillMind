import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import prisma from '@/prisma/prisma-client'

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  code: z.string().length(6), // add code
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const { name, email, password, code } = parsed.data

    // Email у використанні?
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    // Find the verification token (the latest one for this email)
    const tokenRow = await prisma.verificationToken.findFirst({
      where: { identifier: email },
      orderBy: { expires: 'desc' },
    })

    if (!tokenRow) {
      return NextResponse.json({ error: 'Verification code not found. Please request a new code.' }, { status: 400 })
    }

    // Checking the expiration date
    if (tokenRow.expires < new Date()) {
      // expired
      await prisma.verificationToken.delete({ where: { token: tokenRow.token } }).catch(() => {})
      return NextResponse.json({ error: 'Verification code expired. Please request a new code.' }, { status: 400 })
    }

    // Compare with hash
    const ok = await bcrypt.compare(code, tokenRow.token)
    if (!ok) {
      return NextResponse.json({ error: 'Invalid verification code.' }, { status: 400 })
    }

    // Code is valid -> delete token (one-time use)
    await prisma.verificationToken.deleteMany({ where: { identifier: email } })

    // Password hash
    const passwordHash = await bcrypt.hash(password, 12)

    // Creating a user + emailVerified
    await prisma.user.create({
      data: { name, email, passwordHash, emailVerified: new Date() },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
