import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/prisma-client'
import { getUserIdFromSession } from '@/lib/session'
import { shouldBeMarkedAsMissed } from '@/lib/dose-utils'
import { toZonedTime } from 'date-fns-tz'

/**
 * Cron job to mark missed doses
 * Should run daily at 00:05 in each user's timezone
 *
 * Marks all past doses (not just yesterday) and today's doses that have passed
 * their scheduled time as MISSED.
 *
 * Usage: POST /api/cron/mark-missed
 * Headers: Authorization: Bearer <token> (for testing)
 * Body: { timezone?: string } (optional, defaults to UTC)
 */
export async function POST(request: NextRequest) {
  try {
    // For production, this should be called by a cron service
    // For now, we'll allow manual triggering with authentication
    const userId = await getUserIdFromSession()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const timezone = body.timezone || 'UTC' // Fallback for manual testing

    // Get all users with their timezones
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

    let totalMarked = 0
    const results = []
    const now = new Date()

    for (const user of users) {
      const userTimezone = user.settings?.timezone || timezone

      // Get current time in user's timezone for comparison
      const nowInUserTz = toZonedTime(now, userTimezone)

      // Find all scheduled doses that should be marked as missed
      // We check all doses with status SCHEDULED and filter by time
      const allScheduledDoses = await prisma.doseLog.findMany({
        where: {
          prescription: {
            userId: user.id
          },
          status: 'SCHEDULED'
        },
        include: {
          prescription: {
            include: {
              medication: true
            }
          }
        }
      })

      // Filter doses that should be marked as missed
      const missedDoses = allScheduledDoses.filter(dose => {
        const scheduledFor = new Date(dose.scheduledFor)
        const scheduledInTz = toZonedTime(scheduledFor, userTimezone)

        // Mark as missed if scheduled time has passed
        return scheduledInTz < nowInUserTz
      })

      if (missedDoses.length > 0) {
        // Mark as missed
        await prisma.doseLog.updateMany({
          where: {
            id: {
              in: missedDoses.map(d => d.id)
            }
          },
          data: {
            status: 'MISSED'
          }
        })

        totalMarked += missedDoses.length

        results.push({
          userId: user.id,
          userEmail: user.email,
          timezone: userTimezone,
          markedCount: missedDoses.length,
          medications: missedDoses.map(d => ({
            medicationName: d.prescription.medication.name,
            scheduledFor: d.scheduledFor
          }))
        })
      }
    }

    return NextResponse.json({
      success: true,
      totalMarked,
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error marking missed doses:', error)
    return NextResponse.json(
      { error: 'Failed to mark missed doses' },
      { status: 500 }
    )
  }
}
