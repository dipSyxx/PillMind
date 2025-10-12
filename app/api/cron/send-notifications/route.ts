import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/prisma-client'
import { getUserIdFromSession } from '@/lib/session'
import { nowInTz, addMinutes } from '@/lib/medication-utils'

/**
 * Cron job to send notifications
 * Should run every minute
 *
 * Usage: POST /api/cron/send-notifications
 * Headers: Authorization: Bearer <token> (for testing)
 */
export async function POST(request: NextRequest) {
  try {
    // For production, this should be called by a cron service
    const userId = await getUserIdFromSession()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const notificationWindow = 2 // minutes window

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

    let totalSent = 0
    const results = []

    for (const user of users) {
      const userTimezone = user.settings?.timezone || 'UTC'
      const userChannels = user.settings?.defaultChannels || ['EMAIL']

      // Find doses that need notifications (within the time window)
      const dosesToNotify = await prisma.doseLog.findMany({
        where: {
          prescription: {
            userId: user.id
          },
          status: 'SCHEDULED',
          scheduledFor: {
            gte: now,
            lte: addMinutes(now, notificationWindow)
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

      for (const dose of dosesToNotify) {
        // Check if notification was already sent
        const alreadyNotified = dose.notifications.length > 0

        if (!alreadyNotified) {
          // Send notifications for each channel
          for (const channel of userChannels) {
            try {
              // Create notification log
              const notificationLog = await prisma.notificationLog.create({
                data: {
                  userId: user.id,
                  doseLogId: dose.id,
                  channel: channel as any,
                  status: 'SENT',
                  sentAt: now,
                  meta: {
                    medicationName: dose.prescription.medication.name,
                    scheduledFor: dose.scheduledFor,
                    timezone: userTimezone
                  }
                }
              })

              totalSent++

              results.push({
                userId: user.id,
                userEmail: user.email,
                doseLogId: dose.id,
                medicationName: dose.prescription.medication.name,
                channel,
                scheduledFor: dose.scheduledFor,
                notificationId: notificationLog.id
              })

              // Here you would integrate with actual notification services
              // For now, we just log the notification
              console.log(`Notification sent to ${user.email} for ${dose.prescription.medication.name} at ${dose.scheduledFor}`)

            } catch (error) {
              console.error(`Failed to send notification for dose ${dose.id}:`, error)

              // Log failed notification
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
