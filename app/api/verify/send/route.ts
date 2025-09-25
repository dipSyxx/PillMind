import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/prisma-client'
import bcrypt from 'bcryptjs'

const MAILEROO_API_URL = 'https://smtp.maileroo.com/api/v2/emails/template'

function generateCode(): string {
  // 6-digit code, with leading zeros
  const n = Math.floor(Math.random() * 1_000_000)
  return n.toString().padStart(6, '0')
}

export async function POST(req: NextRequest) {
  try {
    const { email, name } = (await req.json()) as { email?: string; name?: string }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // 1) generate code and TTL
    const code = generateCode()
    const ttlMinutes = Number(process.env.VERIFY_CODE_TTL_MINUTES ?? '10')
    const expires = new Date(Date.now() + ttlMinutes * 60 * 1000)

    // 2) save the hash code as VerificationToken
    const tokenHash = await bcrypt.hash(code, 12)
    // при повторному запиті — почистити попередні токени цього email
    await prisma.verificationToken.deleteMany({ where: { identifier: email } })
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: tokenHash,
        expires,
      },
    })

    // 3) send an email via Maileroo "Send Templated Email"
    //    https://maileroo.com/docs/email-api/send-templated-email
    const templateId = Number(process.env.MAILEROO_TEMPLATE_VERIFY_ID ?? '3431')
    const res = await fetch(MAILEROO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Maileroo Authentication: Authorization: Bearer <SENDING_KEY>
        // Also possible X-Api-Key: <SENDING_KEY> (both methods are valid)
        Authorization: `Bearer ${process.env.MAILEROO_API_KEY}`,
      },
      body: JSON.stringify({
        template_id: templateId,
        subject: 'Your PillMind verification code',
        from: {
          email: process.env.MAILEROO_FROM,
          name: process.env.MAILEROO_FROM_NAME ?? 'PillMind',
        },
        to: [
          {
            email,
            name: name ?? undefined,
          },
        ],
        variables: {
          // matching placeholders in your template:
          // {{code}}, {{expiryMinutes}}, {{name}}, {{year}}
          code,
          expiryMinutes: ttlMinutes,
          name: name || 'there',
          year: new Date().getFullYear(),
        },
      }),
    })

    // Maileroo returns JSON with status success/message according to the documentation. :contentReference[oaicite:2]{index=2}
    const json = await res.json().catch(() => ({}))
    if (!res.ok || json?.success === false) {
      // on error — remove the token so that there is no "hanging" code left
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
