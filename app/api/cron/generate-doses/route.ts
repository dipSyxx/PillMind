import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/prisma-client'
import { getUserIdFromSession } from '@/lib/session'
import {
  nowInTz,
  addDaysInTz,
} from '@/lib/medication-utils'
import { generateDosesForSchedule } from '@/lib/dose-generation'

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
        const prescriptionEndDate = prescription.endDate ? startOfDayInTz(prescription.endDate, userTimezone) : null

        for (const schedule of prescription.schedules) {
          const scheduleTimezone = schedule.timezone || userTimezone

          // Generate doses for the next horizon days
          const startDate = nowInTz(scheduleTimezone)
          const endDate = addDaysInTz(startDate, horizonDays, scheduleTimezone)

          try {
            const result = await generateDosesForSchedule({
              scheduleId: schedule.id,
              prescriptionId: prescription.id,
              schedule: {
                daysOfWeek: schedule.daysOfWeek as any,
                times: schedule.times,
                doseQuantity: schedule.doseQuantity?.toNumber() ?? null,
                doseUnit: schedule.doseUnit as any,
              },
              from: startDate,
              to: endDate,
              timezone: scheduleTimezone,
              prescriptionEndDate: prescription.endDate,
              scheduleStartDate: schedule.startDate,
              scheduleEndDate: schedule.endDate,
            })

            if (result.generated > 0) {
              totalGenerated += result.generated

              results.push({
                userId: user.id,
                userEmail: user.email,
                prescriptionId: prescription.id,
                scheduleId: schedule.id,
                timezone: scheduleTimezone,
                generatedCount: result.generated,
                skippedCount: result.skipped,
                errors: result.errors,
                horizonDays
              })
            }
          } catch (error) {
            console.error(`Error generating doses for schedule ${schedule.id}:`, error)
            results.push({
              userId: user.id,
              userEmail: user.email,
              prescriptionId: prescription.id,
              scheduleId: schedule.id,
              timezone: scheduleTimezone,
              generatedCount: 0,
              skippedCount: 0,
              errors: [error instanceof Error ? error.message : 'Unknown error'],
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
