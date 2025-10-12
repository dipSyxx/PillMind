import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/prisma-client'
import { getUserIdFromSession } from '@/lib/session'
import {
  nowInTz,
  addDaysInTz,
  startOfDayInTz,
  weekdayOf,
  tzHmToUtcISO
} from '@/lib/medication-utils'

/**
 * Cron job to generate dose logs for the next horizon
 * Should run daily at 00:10 in each user's timezone
 *
 * Usage: POST /api/cron/generate-doses
 * Headers: Authorization: Bearer <token> (for testing)
 * Body: { horizonDays?: number } (optional, defaults to 14)
 */
export async function POST(request: NextRequest) {
  try {
    // For production, this should be called by a cron service
    const userId = await getUserIdFromSession()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const horizonDays = body.horizonDays || 14

    // Get all users with their active prescriptions
    const users = await prisma.user.findMany({
      where: {
        settings: {
          isNot: null
        }
      },
      include: {
        settings: true,
        prescriptions: {
          where: {
            asNeeded: false, // Only scheduled prescriptions
            endDate: {
              or: [
                null,
                { gt: new Date() } // Not expired
              ]
            }
          },
          include: {
            schedules: {
              where: {
                or: [
                  { endDate: null },
                  { endDate: { gt: new Date() } }
                ]
              }
            }
          }
        }
      }
    })

    let totalGenerated = 0
    const results = []

    for (const user of users) {
      const userTimezone = user.settings?.timezone || 'UTC'

      for (const prescription of user.prescriptions) {
        for (const schedule of prescription.schedules) {
          const scheduleTimezone = schedule.timezone || userTimezone

          // Generate doses for the next horizon days
          const startDate = nowInTz(scheduleTimezone)
          const endDate = addDaysInTz(startDate, horizonDays, scheduleTimezone)

          const generatedDoses = []
          const currentDate = startOfDayInTz(startDate, scheduleTimezone)

          while (currentDate <= endDate) {
            const weekday = weekdayOf(currentDate, scheduleTimezone)

            // Check if this day is in the schedule
            if (schedule.daysOfWeek.includes(weekday)) {
              // Generate doses for each time in the schedule
              for (const time of schedule.times) {
                const scheduledForUtc = tzHmToUtcISO(currentDate, time, scheduleTimezone)

                // Check if dose already exists
                const existingDose = await prisma.doseLog.findFirst({
                  where: {
                    prescriptionId: prescription.id,
                    scheduleId: schedule.id,
                    scheduledFor: new Date(scheduledForUtc),
                  },
                })

                if (!existingDose) {
                  const doseLog = await prisma.doseLog.create({
                    data: {
                      prescriptionId: prescription.id,
                      scheduleId: schedule.id,
                      scheduledFor: new Date(scheduledForUtc),
                      status: 'SCHEDULED',
                      quantity: schedule.doseQuantity,
                      unit: schedule.doseUnit,
                    },
                  })
                  generatedDoses.push(doseLog)
                }
              }
            }

            // Move to next day in timezone
            const nextDay = addDaysInTz(currentDate, 1, scheduleTimezone)
            currentDate.setTime(nextDay.getTime())
          }

          if (generatedDoses.length > 0) {
            totalGenerated += generatedDoses.length

            results.push({
              userId: user.id,
              userEmail: user.email,
              prescriptionId: prescription.id,
              scheduleId: schedule.id,
              timezone: scheduleTimezone,
              generatedCount: generatedDoses.length,
              horizonDays
            })
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      totalGenerated,
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating doses:', error)
    return NextResponse.json(
      { error: 'Failed to generate doses' },
      { status: 500 }
    )
  }
}
