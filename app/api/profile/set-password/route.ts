import { getUserIdFromSession } from '@/lib/session'
import { setPasswordSchema } from '@/lib/validation'
import prisma from '@/prisma/prisma-client'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromSession()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const json = await req.json()
  const parsed = setPasswordSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (user.passwordHash) {
    return NextResponse.json({ error: 'Password already set. Use change password instead.' }, { status: 400 })
  }

  const { newPassword } = parsed.data
  const passwordHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } })

  return NextResponse.json({ ok: true })
}
