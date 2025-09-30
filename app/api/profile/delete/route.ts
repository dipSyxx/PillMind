import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/prisma-client'
import { getUserIdFromSession } from '@/lib/session'

export async function POST(_req: NextRequest) {
  const userId = await getUserIdFromSession()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // thanks to onDelete: Cascade in Prisma, related records (sessions/accounts) will be removed
  await prisma.user.delete({ where: { id: user.id } })
  return NextResponse.json({ ok: true })
}
