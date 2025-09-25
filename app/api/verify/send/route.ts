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
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // --- Env sanity checks
    const apiKey = process.env.MAILEROO_API_KEY
    const fromAddress = process.env.MAILEROO_FROM_ADDRESS // e.g. no-reply@yourdomain.com
    const fromName = process.env.MAILEROO_FROM_NAME ?? 'PillMind'
    const templateId = Number(process.env.MAILEROO_TEMPLATE_VERIFY_ID ?? '3431')
    const ttlMinutes = Number(process.env.VERIFY_CODE_TTL_MINUTES ?? '10')

    if (!apiKey || !fromAddress || !templateId) {
      return NextResponse.json({ error: 'Mail sending is not configured (check MAILEROO_* envs)' }, { status: 500 })
    }

    // 1) Generate code + expiry
    const code = generateCode()
    const expires = new Date(Date.now() + ttlMinutes * 60 * 1000)

    // 2) Store bcrypt-hash of the code for this email
    const tokenHash = await bcrypt.hash(code, 12)
    await prisma.verificationToken.deleteMany({ where: { identifier: email } })
    await prisma.verificationToken.create({
      data: { identifier: email, token: tokenHash, expires },
    })

    // 3) Send templated email (STRICT Maileroo payload)
    const payload = {
      from: {
        address: fromAddress,
        display_name: fromName,
      },
      to: [
        {
          address: email,
          display_name: name || undefined,
        },
      ],
      subject: 'Your PillMind verification code',
      template_id: templateId,
      template_data: {
        code, // {{code}}
        expiryMinutes: ttlMinutes, // {{expiryMinutes}}
        name: name || 'there', // {{name}}
        year: new Date().getFullYear(), // {{year}}
      },
      // optional:
      tracking: true,
      tags: { type: 'email-verification' },
    }

    const res = await fetch(MAILEROO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    const json = await res.json().catch(() => ({}) as any)

    // Maileroo returns: { success: boolean, message: string, data?: { reference_id } }
    // https://maileroo.com/docs/email-api/send-templated-email/
    if (!res.ok || json?.success === false) {
      // Clean up the stored token if sending failed
      await prisma.verificationToken.deleteMany({ where: { identifier: email } })

      const msg =
        json?.message || 'Failed to send verification email. Ensure from.address is a verified domain in Maileroo.'
      return NextResponse.json({ error: msg }, { status: res.status || 500 })
    }

    return NextResponse.json({
      ok: true,
      expiresAt: expires.toISOString(),
      referenceId: json?.data?.reference_id ?? null,
    })
  } catch (e) {
    console.error('send verify code error:', e)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
