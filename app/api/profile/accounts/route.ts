import { NextResponse, NextRequest } from 'next/server'
import prisma from '@/prisma/prisma-client'
import { getUserIdFromSession } from '@/lib/session'

export async function GET() {
  const userId = await getUserIdFromSession()
  if (!userId) return NextResponse.json({ accounts: [] })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true, accounts: { select: { provider: true } } },
  })
  return NextResponse.json({
    userId: user?.id ?? null,
    providers: (user?.accounts ?? []).map((a) => a.provider),
    hasPassword: !!user?.passwordHash,
  })
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserIdFromSession()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { provider } = await req.json()
  if (!provider) return NextResponse.json({ error: 'Missing provider' }, { status: 400 })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true, accounts: { select: { provider: true } } },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const connected = user.accounts.map((a) => a.provider)
  const isOnlyThis = connected.length === 1 && connected[0] === provider
  const hasPassword = !!user.passwordHash

  // noone allows unlinking the last connected account if there is no password
  if (isOnlyThis && !hasPassword) {
    return NextResponse.json(
      { error: 'You must set a password before unlinking your last connected account.' },
      { status: 400 },
    )
  }

  await prisma.account.deleteMany({
    where: { userId: user.id, provider },
  })

  return NextResponse.json({ ok: true })
}
