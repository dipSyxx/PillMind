import prisma from '@/prisma/prisma-client'
import { Unit, Weekday } from '@/types/medication'
import { startOfDayInTz, weekdayOf, tzHmToUtcISO, addDaysInTz } from './medication-utils'
import { retryWithBackoff } from './retry-utils'

// Maximum period for dose generation (1 year)
const MAX_GENERATION_DAYS = 365

export interface GenerateDosesOptions {
  scheduleId: string
  prescriptionId: string
  schedule: {
    daysOfWeek: Weekday[]
    times: string[]
    doseQuantity: number | null
    doseUnit: Unit | null
  }
  from: Date
  to: Date
  timezone: string
  prescriptionEndDate?: Date | null
  scheduleStartDate?: Date | null
  scheduleEndDate?: Date | null
}

export interface GenerateDosesResult {
  requested: number
  generated: number
  skipped: number
  errors: string[]
}

/**
 * Generate doses for a schedule within a date range
 * Optimized to use batch operations instead of individual queries
 */
export async function generateDosesForSchedule(
  options: GenerateDosesOptions
): Promise<GenerateDosesResult> {
  const {
    scheduleId,
    prescriptionId,
    schedule,
    from,
    to,
    timezone,
    prescriptionEndDate,
    scheduleStartDate,
    scheduleEndDate,
  } = options

  const result: GenerateDosesResult = {
    requested: 0,
    generated: 0,
    skipped: 0,
    errors: [],
  }

  try {
    // Validate generation period (max 1 year)
    const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff > MAX_GENERATION_DAYS) {
      result.errors.push(
        `Generation period exceeds maximum allowed (${MAX_GENERATION_DAYS} days). Requested: ${daysDiff} days`
      )
      return result
    }

    // Normalize dates to timezone
    const fromDate = startOfDayInTz(from, timezone)
    const toDate = startOfDayInTz(to, timezone)
    const prescriptionEnd = prescriptionEndDate ? startOfDayInTz(prescriptionEndDate, timezone) : null
    const scheduleStart = scheduleStartDate ? startOfDayInTz(scheduleStartDate, timezone) : null
    const scheduleEnd = scheduleEndDate ? startOfDayInTz(scheduleEndDate, timezone) : null

    // Generate all potential dose dates and times
    const dosesToCreate: Array<{
      prescriptionId: string
      scheduleId: string
      scheduledFor: Date
      status: 'SCHEDULED'
      quantity: number | null
      unit: Unit | null
    }> = []

    const currentDate = new Date(fromDate)
    const now = new Date()

    while (currentDate <= toDate) {
      // Check prescription endDate
      if (prescriptionEnd && currentDate > prescriptionEnd) {
        break
      }

      // Check schedule startDate
      if (scheduleStart && currentDate < scheduleStart) {
        const nextDay = addDaysInTz(currentDate, 1, timezone)
        currentDate.setTime(nextDay.getTime())
        continue
      }

      // Check schedule endDate
      if (scheduleEnd && currentDate > scheduleEnd) {
        break
      }

      // Only generate future doses
      const dayStart = startOfDayInTz(currentDate, timezone)
      if (dayStart < startOfDayInTz(now, timezone)) {
        const nextDay = addDaysInTz(currentDate, 1, timezone)
        currentDate.setTime(nextDay.getTime())
        continue
      }

      const weekday = weekdayOf(currentDate, timezone)

      if (schedule.daysOfWeek.includes(weekday)) {
        for (const time of schedule.times) {
          const scheduledForUtc = tzHmToUtcISO(currentDate, time, timezone)
          const scheduledForDate = new Date(scheduledForUtc)

          // Only generate future doses
          if (scheduledForDate > now) {
            result.requested++
            dosesToCreate.push({
              prescriptionId,
              scheduleId,
              scheduledFor: scheduledForDate,
              status: 'SCHEDULED',
              quantity: schedule.doseQuantity,
              unit: schedule.doseUnit,
            })
          }
        }
      }

      // Move to next day
      const nextDay = addDaysInTz(currentDate, 1, timezone)
      currentDate.setTime(nextDay.getTime())
    }

    if (dosesToCreate.length === 0) {
      return result
    }

    // Get all existing doses in the date range with a single query
    const existingDoses = await prisma.doseLog.findMany({
      where: {
        scheduleId,
        scheduledFor: {
          gte: dosesToCreate[0].scheduledFor,
          lte: dosesToCreate[dosesToCreate.length - 1].scheduledFor,
        },
      },
      select: {
        scheduledFor: true,
      },
    })

    // Create a Set for O(1) lookup
    const existingSet = new Set(
      existingDoses.map((d) => d.scheduledFor.toISOString())
    )

    // Filter out existing doses
    const newDoses = dosesToCreate.filter(
      (d) => !existingSet.has(d.scheduledFor.toISOString())
    )

    result.skipped = dosesToCreate.length - newDoses.length

    if (newDoses.length === 0) {
      return result
    }

    // Create all new doses in a single batch operation with retry
    // Use createMany with skipDuplicates as additional safety
    try {
      const createResult = await retryWithBackoff(
        async () => {
          return await prisma.doseLog.createMany({
            data: newDoses,
            skipDuplicates: true,
          })
        },
        {
          maxAttempts: 3,
          initialDelayMs: 500,
          retryableErrors: ['P2002', 'P2025', 'TIMEOUT', 'ECONNRESET', 'ETIMEDOUT'],
        }
      )

      result.generated = createResult.count
    } catch (error) {
      // If createMany fails after retries, try individual creates as fallback
      // This handles edge cases where skipDuplicates might not work
      let successCount = 0
      for (const dose of newDoses) {
        try {
          await retryWithBackoff(
            async () => {
              return await prisma.doseLog.create({
                data: dose,
              })
            },
            {
              maxAttempts: 2,
              initialDelayMs: 200,
              retryableErrors: ['P2002', 'P2025', 'TIMEOUT'],
            }
          )
          successCount++
        } catch (err: any) {
          // Check if it's a unique constraint violation (expected)
          if (err?.code === 'P2002') {
            result.skipped++
          } else {
            result.errors.push(
              `Failed to create dose for ${dose.scheduledFor.toISOString()}: ${err instanceof Error ? err.message : 'Unknown error'}`
            )
          }
        }
      }
      result.generated = successCount
    }

    return result
  } catch (error) {
    result.errors.push(
      `Failed to generate doses: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
    return result
  }
}
