import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/prisma-client'
import { getUserIdFromSession } from '@/lib/session'

interface SubscribeBody {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

/**
 * POST /api/notifications/push/subscribe
 * Store push subscription for the current user.
 */
export async function POST(request: NextRequest) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: SubscribeBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { endpoint, keys } = body
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json(
      { error: 'Missing endpoint or keys.p256dh or keys.auth' },
      { status: 400 }
    )
  }

  const userAgent = request.headers.get('user-agent') ?? undefined

  await prisma.pushSubscription.upsert({
    where: {
      userId_endpoint: { userId, endpoint }
    },
    create: {
      userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent
    },
    update: {
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent
    }
  })

  return NextResponse.json({ success: true })
}

/**
 * DELETE /api/notifications/push/subscribe
 * Remove push subscription by endpoint or id.
 * Body: { endpoint: string } or { id: string }
 */
export async function DELETE(request: NextRequest) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { endpoint?: string; id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (body.id) {
    const deleted = await prisma.pushSubscription.deleteMany({
      where: { id: body.id, userId }
    })
    return NextResponse.json({ success: true, deleted: deleted.count })
  }

  if (body.endpoint) {
    const deleted = await prisma.pushSubscription.deleteMany({
      where: { userId, endpoint: body.endpoint }
    })
    return NextResponse.json({ success: true, deleted: deleted.count })
  }

  return NextResponse.json(
    { error: 'Provide endpoint or id in body' },
    { status: 400 }
  )
}
