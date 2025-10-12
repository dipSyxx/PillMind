import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/prisma-client'
import { getUserIdFromSession } from '@/lib/session'

/**
 * Cron job to send low stock alerts
 * Should run daily at 09:00 in each user's timezone
 *
 * Usage: POST /api/cron/low-stock-alerts
 * Headers: Authorization: Bearer <token> (for testing)
 */
export async function POST(request: NextRequest) {
  try {
    // For production, this should be called by a cron service
    const userId = await getUserIdFromSession()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

      if (lowStockMedications.length > 0) {
        // Check if we already sent an alert today
        const today = new Date()
        today.setHours(0, 0, 0, 0)

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
          for (const channel of userChannels) {
            try {
              // Create notification log
              const notificationLog = await prisma.notificationLog.create({
                data: {
                  userId: user.id,
                  doseLogId: null, // Not related to a specific dose
                  channel: channel as any,
                  status: 'SENT',
                  sentAt: new Date(),
                  meta: {
                    type: 'low_stock_alert',
                    medications: lowStockMedications.map(med => ({
                      id: med.id,
                      name: med.name,
                      currentQty: med.inventory?.currentQty || 0,
                      lowThreshold: med.inventory?.lowThreshold || 0,
                      unit: med.inventory?.unit || 'TAB'
                    }))
                  }
                }
              })

              totalAlerts++

              results.push({
                userId: user.id,
                userEmail: user.email,
                channel,
                lowStockCount: lowStockMedications.length,
                medications: lowStockMedications.map(med => ({
                  id: med.id,
                  name: med.name,
                  currentQty: med.inventory?.currentQty || 0,
                  lowThreshold: med.inventory?.lowThreshold || 0
                })),
                notificationId: notificationLog.id
              })

              // Here you would integrate with actual notification services
              console.log(`Low stock alert sent to ${user.email} for ${lowStockMedications.length} medications`)

            } catch (error) {
              console.error(`Failed to send low stock alert for user ${user.id}:`, error)

              // Log failed notification
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
