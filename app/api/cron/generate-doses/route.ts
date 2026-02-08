import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/prisma-client'
import { getUserIdFromSession } from '@/lib/session'
import { isCronAuthorized } from '@/lib/cron-auth'
import {
  nowInTz,
  addDaysInTz,
  startOfDayInTz,
} from '@/lib/medication-utils'
import { generateDosesForSchedule } from '@/lib/dose-generation'

/**
 * Cron job to generate dose logs. Run daily (e.g. 00:10).
 * Auth: CRON_SECRET (Authorization: Bearer) or session for manual test.
 * Body: { horizonDays?: number } (optional, defaults to 14)
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
            asNeeded: false,
            OR: [
              { endDate: null },
              { endDate: { gt: new Date() } }
            ]
          },
          include: {
            schedules: {
              where: {
                OR: [
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

/** Vercel Cron sends GET */
export async function GET(request: NextRequest) {
  return POST(request)
}
