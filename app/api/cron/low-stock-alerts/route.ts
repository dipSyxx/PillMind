import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/prisma-client'
import { getUserIdFromSession } from '@/lib/session'
import { isCronAuthorized } from '@/lib/cron-auth'
import { sendPushToUser } from '@/lib/notifications/send-push'
import { sendLowStockEmail } from '@/lib/notifications/send-email'

/**
 * Cron job to send low stock alerts. Run daily (e.g. 09:00).
 * Auth: CRON_SECRET (Authorization: Bearer) or session for manual test.
 */
export async function POST(request: NextRequest) {
  try {
    const isCron = isCronAuthorized(request)
    if (!isCron) {
      const userId = await getUserIdFromSession()
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    console.log('[low-stock-alerts] cron fired', { now: new Date().toISOString() })

    // Get all users with their medications and inventory
    const users = await prisma.user.findMany({
      where: {
        settings: {
          isNot: null
        }
      },
      include: {
        settings: true,
        medications: {
          include: {
            inventory: true
          }
        }
      }
    })

    console.log(`[low-stock-alerts] found ${users.length} user(s) with settings`)

    let totalAlerts = 0
    const results = []

    for (const user of users) {
      const userChannels = user.settings?.defaultChannels || ['EMAIL']

      // Find medications with low stock
      const lowStockMedications = user.medications.filter(med => {
        if (!med.inventory) return false

        const currentQty = med.inventory.currentQty
        const lowThreshold = med.inventory.lowThreshold || 0

        return currentQty <= lowThreshold
      })

      console.log(`[low-stock-alerts] user ${user.id}: ${lowStockMedications.length} low-stock medication(s), channels: [${userChannels.join(', ')}]`)

      if (lowStockMedications.length > 0) {
        // Check if we already sent an alert today
        const today = new Date()
        today.setUTCHours(0, 0, 0, 0)

        const existingAlert = await prisma.notificationLog.findFirst({
          where: {
            userId: user.id,
            channel: 'EMAIL',
            status: 'SENT',
            sentAt: {
              gte: today
            },
            meta: {
              path: ['type'],
              equals: 'low_stock_alert'
            }
          }
        })

        // Only send one alert per day per user
        if (!existingAlert) {
          const metaPayload = {
            type: 'low_stock_alert',
            medications: lowStockMedications.map(med => ({
              id: med.id,
              name: med.name,
              currentQty: med.inventory?.currentQty || 0,
              lowThreshold: med.inventory?.lowThreshold || 0,
              unit: med.inventory?.unit || 'TAB'
            }))
          }
          const medicationNames = lowStockMedications.map(m => m.name).join(', ')

          for (const channel of userChannels) {
            if (channel === 'SMS') continue
            try {
              if (channel === 'PUSH') {
                const pushResult = await sendPushToUser(user.id, {
                  title: 'Low stock alert',
                  body: `${lowStockMedications.length} medication(s) low: ${medicationNames}`,
                  url: '/home'
                })
                const status = pushResult.sent > 0 ? 'SENT' : 'FAILED'
                const notificationLog = await prisma.notificationLog.create({
                  data: {
                    userId: user.id,
                    doseLogId: null,
                    channel: 'PUSH',
                    status: status as any,
                    sentAt: new Date(),
                    meta: status === 'SENT' ? metaPayload : { ...metaPayload, reason: pushResult.sent === 0 && pushResult.removed === 0 ? 'no_subscription' : 'delivery_failed' }
                  }
                })
                if (status === 'SENT') {
                  totalAlerts++
                  results.push({
                    userId: user.id,
                    userEmail: user.email,
                    channel: 'PUSH',
                    lowStockCount: lowStockMedications.length,
                    medications: lowStockMedications.map(med => ({
                      id: med.id,
                      name: med.name,
                      currentQty: med.inventory?.currentQty || 0,
                      lowThreshold: med.inventory?.lowThreshold || 0
                    })),
                    notificationId: notificationLog.id
                  })
                }
                continue
              }

              if (channel === 'EMAIL') {
                const email = user.email
                if (!email) {
                  await prisma.notificationLog.create({
                    data: {
                      userId: user.id,
                      doseLogId: null,
                      channel: 'EMAIL',
                      status: 'FAILED',
                      sentAt: new Date(),
                      meta: { ...metaPayload, reason: 'no_email' }
                    }
                  })
                  continue
                }
                const emailResult = await sendLowStockEmail(email, {
                  medications: metaPayload.medications.map(m => ({
                    name: m.name,
                    currentQty: Number(m.currentQty),
                    lowThreshold: Number(m.lowThreshold),
                    unit: m.unit
                  }))
                })
                console.log(`[low-stock-alerts] email to ${email}:`, emailResult)
                const status = emailResult.ok ? 'SENT' : 'FAILED'
                const notificationLog = await prisma.notificationLog.create({
                  data: {
                    userId: user.id,
                    doseLogId: null,
                    channel: 'EMAIL',
                    status: status as any,
                    sentAt: new Date(),
                    meta: status === 'SENT' ? metaPayload : { ...metaPayload, error: emailResult.error }
                  }
                })
                if (status === 'SENT') {
                  totalAlerts++
                  results.push({
                    userId: user.id,
                    userEmail: user.email,
                    channel: 'EMAIL',
                    lowStockCount: lowStockMedications.length,
                    medications: lowStockMedications.map(med => ({
                      id: med.id,
                      name: med.name,
                      currentQty: med.inventory?.currentQty || 0,
                      lowThreshold: med.inventory?.lowThreshold || 0
                    })),
                    notificationId: notificationLog.id
                  })
                }
                continue
              }
            } catch (error) {
              console.error(`Failed to send low stock alert for user ${user.id}:`, error)
              await prisma.notificationLog.create({
                data: {
                  userId: user.id,
                  doseLogId: null,
                  channel: channel as any,
                  status: 'FAILED',
                  sentAt: new Date(),
                  meta: {
                    type: 'low_stock_alert',
                    error: error instanceof Error ? error.message : 'Unknown error'
                  }
                }
              })
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      totalAlerts,
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error sending low stock alerts:', error)
    return NextResponse.json(
      { error: 'Failed to send low stock alerts' },
      { status: 500 }
    )
  }
}

/** Vercel Cron sends GET */
export async function GET(request: NextRequest) {
  return POST(request)
}
