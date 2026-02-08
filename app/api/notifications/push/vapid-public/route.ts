import { NextResponse } from 'next/server'

/**
 * GET /api/notifications/push/vapid-public
 * Returns the VAPID public key for client-side push subscription.
 * No auth required for the key itself; subscribe endpoint requires auth.
 */
export async function GET() {
  const key = process.env.VAPID_PUBLIC_KEY
  if (!key) {
    return NextResponse.json(
      { error: 'Push notifications are not configured' },
      { status: 503 }
    )
  }
  return NextResponse.json({ publicKey: key })
}
