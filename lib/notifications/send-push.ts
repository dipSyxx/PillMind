import webPush from 'web-push'
import prisma from '@/prisma/prisma-client'

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(
    'mailto:support@pillmind.app',
    vapidPublicKey,
    vapidPrivateKey
  )
}

export interface PushPayload {
  title: string
  body: string
  url?: string
}

/**
 * Send a push notification to all of the user's subscribed devices.
 * On 410 Gone or 404 Not Found, the subscription is removed from the database.
 * Returns { sent: number, failed: number, removed: number }.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number; removed: number }> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    return { sent: 0, failed: 0, removed: 0 }
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId }
  })

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0, removed: 0 }
  }

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? '/home'
  })

  let sent = 0
  let failed = 0
  let removed = 0

  for (const sub of subscriptions) {
    const subscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth
      }
    }

    try {
      await webPush.sendNotification(subscription, body, {
        TTL: 60 * 60 * 24
      })
      sent++
    } catch (err: unknown) {
      const statusCode = err && typeof err === 'object' && 'statusCode' in err ? (err as { statusCode?: number }).statusCode : undefined
      if (statusCode === 410 || statusCode === 404) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
        removed++
      } else {
        failed++
      }
    }
  }

  return { sent, failed, removed }
}

/**
 * Check if Web Push is configured (VAPID keys set).
 */
export function isPushConfigured(): boolean {
  return Boolean(vapidPublicKey && vapidPrivateKey)
}
