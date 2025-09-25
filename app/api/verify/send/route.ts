import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/prisma-client'
import bcrypt from 'bcryptjs'

const MAILEROO_API_URL = 'https://smtp.maileroo.com/api/v2/emails/template'

function generateCode(): string {
  const n = Math.floor(Math.random() * 1_000_000)
  return n.toString().padStart(6, '0')
}

export async function POST(req: NextRequest) {
  try {
    const { email, name } = (await req.json()) as { email?: string; name?: string }
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

    // --- safety checks for envs
    if (!process.env.MAILEROO_API_KEY || !process.env.MAILEROO_FROM) {
      return NextResponse.json({ error: 'Mail sending is not configured' }, { status: 500 })
    }

    // 1) generate code + expiry
    const code = generateCode()
    const ttlMinutes = Number(process.env.VERIFY_CODE_TTL_MINUTES ?? '10')
    const expires = new Date(Date.now() + ttlMinutes * 60 * 1000)

    // 2) store hash of the code
    const tokenHash = await bcrypt.hash(code, 12)
    await prisma.verificationToken.deleteMany({ where: { identifier: email } })
    await prisma.verificationToken.create({
      data: { identifier: email, token: tokenHash, expires },
    })

    // 3) send templated email (Maileroo v2)
    const templateId = Number(process.env.MAILEROO_TEMPLATE_VERIFY_ID ?? '3431')
    const res = await fetch(MAILEROO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MAILEROO_API_KEY}`,
      },
      body: JSON.stringify({
        template_id: templateId,
        subject: 'Your PillMind verification code',
        from: {
          address: process.env.MAILEROO_FROM, // e.g. 'no-reply@yourdomain.com'
          display_name: process.env.MAILEROO_FROM_NAME ?? 'PillMind',
        },
        to: [
          {
            address: email,
            display_name: name ?? undefined,
          },
        ],
        variables: {
          code, // {{code}}
          expiryMinutes: ttlMinutes, // {{expiryMinutes}}
          name: name || 'there', // {{name}}
          year: new Date().getFullYear(), // {{year}}
        },
      }),
    })

    const json = await res.json().catch(() => ({}))
    if (!res.ok || json?.success === false) {
      await prisma.verificationToken.deleteMany({ where: { identifier: email } })
      return NextResponse.json(
        { error: json?.message || 'Failed to send verification email' },
        { status: res.status || 500 },
      )
    }

    return NextResponse.json({ ok: true, expiresAt: expires.toISOString() })
  } catch (e) {
    console.error('send verify code error:', e)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
