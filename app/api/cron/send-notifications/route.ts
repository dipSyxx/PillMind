import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/prisma-client'
import { getUserIdFromSession } from '@/lib/session'
import { isCronAuthorized } from '@/lib/cron-auth'
import { sendPushToUser } from '@/lib/notifications/send-push'
import { sendReminderEmail } from '@/lib/notifications/send-email'
import { format } from 'date-fns'

/**
 * Cron job to send medication reminder notifications. Runs daily (e.g. 08:00 UTC).
 * Finds ALL scheduled doses for today that haven't been notified yet and sends
 * reminders via the user's configured channels (PUSH / EMAIL).
 * Auth: set CRON_SECRET and send Authorization: Bearer <CRON_SECRET>, or call with session (manual test).
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

    const now = new Date()

    // Build a full-day window (UTC) so the daily cron catches every dose today
    const startOfDay = new Date(now)
    startOfDay.setUTCHours(0, 0, 0, 0)
    const endOfDay = new Date(now)
    endOfDay.setUTCHours(23, 59, 59, 999)

    console.log('[send-notifications] cron fired', { now: now.toISOString(), startOfDay: startOfDay.toISOString(), endOfDay: endOfDay.toISOString() })

    // Get all users with their settings
    const users = await prisma.user.findMany({
      where: {
        settings: {
          isNot: null
        }
      },
      include: {
        settings: true
      }
    })

    console.log(`[send-notifications] found ${users.length} user(s) with settings`)

    let totalSent = 0
    const results = []

    for (const user of users) {
      const userTimezone = user.settings?.timezone || 'UTC'
      const userChannels = user.settings?.defaultChannels || ['EMAIL']

      // Find all SCHEDULED doses for today that haven't been notified yet
      const dosesToNotify = await prisma.doseLog.findMany({
        where: {
          prescription: {
            userId: user.id
          },
          status: 'SCHEDULED',
          scheduledFor: {
            gte: startOfDay,
            lte: endOfDay,
          }
        },
        include: {
          prescription: {
            include: {
              medication: true
            }
          },
          notifications: {
            where: {
              status: 'SENT'
            }
          }
        }
      })

      console.log(`[send-notifications] user ${user.id}: ${dosesToNotify.length} dose(s) scheduled today`)

      for (const dose of dosesToNotify) {
        // Check if notification was already sent
        const alreadyNotified = dose.notifications.length > 0

        if (!alreadyNotified) {
          const medicationName = dose.prescription.medication.name
          const metaBase = {
            medicationName,
            scheduledFor: dose.scheduledFor,
            timezone: userTimezone
          }

          for (const channel of userChannels) {
            if (channel === 'SMS') continue
            try {
              if (channel === 'PUSH') {
                const pushResult = await sendPushToUser(user.id, {
                  title: 'Medication reminder',
                  body: `${medicationName} — due ${format(new Date(dose.scheduledFor), 'HH:mm', {})}`,
                  url: '/home'
                })
                const status = pushResult.sent > 0 ? 'SENT' : 'FAILED'
                const notificationLog = await prisma.notificationLog.create({
                  data: {
                    userId: user.id,
                    doseLogId: dose.id,
                    channel: 'PUSH',
                    status: status as any,
                    sentAt: now,
                    meta: status === 'SENT' ? metaBase : { ...metaBase, reason: pushResult.sent === 0 && pushResult.removed === 0 ? 'no_subscription' : 'delivery_failed' }
                  }
                })
                if (status === 'SENT') {
                  totalSent++
                  results.push({
                    userId: user.id,
                    userEmail: user.email,
                    doseLogId: dose.id,
                    medicationName,
                    channel: 'PUSH',
                    scheduledFor: dose.scheduledFor,
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
                      doseLogId: dose.id,
                      channel: 'EMAIL',
                      status: 'FAILED',
                      sentAt: now,
                      meta: { ...metaBase, reason: 'no_email' }
                    }
                  })
                  continue
                }
                const emailResult = await sendReminderEmail(email, {
                  medicationName,
                  scheduledFor: dose.scheduledFor,
                  timezone: userTimezone,
                  name: user.name ?? undefined
                })
                console.log(`[send-notifications] email to ${email} for "${medicationName}":`, emailResult)
                const status = emailResult.ok ? 'SENT' : 'FAILED'
                const notificationLog = await prisma.notificationLog.create({
                  data: {
                    userId: user.id,
                    doseLogId: dose.id,
                    channel: 'EMAIL',
                    status: status as any,
                    sentAt: now,
                    meta: status === 'SENT' ? metaBase : { ...metaBase, error: emailResult.error }
                  }
                })
                if (status === 'SENT') {
                  totalSent++
                  results.push({
                    userId: user.id,
                    userEmail: user.email,
                    doseLogId: dose.id,
                    medicationName,
                    channel: 'EMAIL',
                    scheduledFor: dose.scheduledFor,
                    notificationId: notificationLog.id
                  })
                }
                continue
              }
            } catch (error) {
              console.error(`Failed to send notification for dose ${dose.id}:`, error)
              await prisma.notificationLog.create({
                data: {
                  userId: user.id,
                  doseLogId: dose.id,
                  channel: channel as any,
                  status: 'FAILED',
                  sentAt: now,
                  meta: {
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
      totalSent,
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error sending notifications:', error)
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    )
  }
}

/** Vercel Cron sends GET */
export async function GET(request: NextRequest) {
  return POST(request)
}
