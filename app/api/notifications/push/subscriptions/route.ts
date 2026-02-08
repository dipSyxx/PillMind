import { NextResponse } from 'next/server'
import prisma from '@/prisma/prisma-client'
import { getUserIdFromSession } from '@/lib/session'

/**
 * GET /api/notifications/push/subscriptions
 * List current user's push subscriptions (for profile UI).
 */
export async function GET() {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
    select: {
      id: true,
      endpoint: true,
      userAgent: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json({ subscriptions })
}
