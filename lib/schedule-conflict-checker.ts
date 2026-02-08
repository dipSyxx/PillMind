import { Weekday } from '@/types/medication'

export interface ScheduleConflict {
  scheduleId: string
  conflictingDays: Weekday[]
  conflictingTimes: string[]
}

export interface ScheduleData {
  daysOfWeek: Weekday[]
  times: string[]
  startDate: Date | null
  endDate: Date | null
}

export interface ExistingSchedule extends ScheduleData {
  id: string
}

/**
 * Check if two date ranges overlap
 * @param start1 - Start date of first range (null means no start limit)
 * @param end1 - End date of first range (null means no end limit)
 * @param start2 - Start date of second range (null means no start limit)
 * @param end2 - End date of second range (null means no end limit)
 * @returns true if ranges overlap
 */
export function checkDateRangesOverlap(
  start1: Date | null,
  end1: Date | null,
  start2: Date | null,
  end2: Date | null,
): boolean {
  // If both ranges are unbounded (no start/end) - they always overlap
  if (!start1 && !end1 && !start2 && !end2) return true

  // If one range is unbounded - it overlaps with everything
  if (!start1 && !end1) return true
  if (!start2 && !end2) return true

  // Convert to Date objects for comparison
  const start1Date = start1 ? new Date(start1) : null
  const end1Date = end1 ? new Date(end1) : null
  const start2Date = start2 ? new Date(start2) : null
  const end2Date = end2 ? new Date(end2) : null

  // If one range ends before the other starts - no overlap
  if (end1Date && start2Date && end1Date < start2Date) return false
  if (end2Date && start1Date && end2Date < start1Date) return false

  return true
}

/**
 * Check for conflicts between a new/updated schedule and existing schedules
 * A conflict occurs when schedules have:
 * - Overlapping days of week
 * - Overlapping times
 * - Overlapping date ranges (startDate/endDate)
 *
 * @param newSchedule - The new or updated schedule data
 * @param existingSchedules - Array of existing schedules to check against
 * @param excludeScheduleId - Optional: ID of schedule to exclude from check (for updates)
 * @returns Array of conflicts found
 */
export function checkScheduleConflicts(
  newSchedule: ScheduleData,
  existingSchedules: ExistingSchedule[],
  excludeScheduleId?: string,
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = []

  for (const existing of existingSchedules) {
    // Skip the schedule being updated
    if (excludeScheduleId && existing.id === excludeScheduleId) continue

    // Check if days overlap
    const daysOverlap = newSchedule.daysOfWeek.some((day) => existing.daysOfWeek.includes(day))

    // Check if times overlap
    const timesOverlap = newSchedule.times.some((time) => existing.times.includes(time))

    // Check if date ranges overlap
    const periodsOverlap = checkDateRangesOverlap(
      newSchedule.startDate,
      newSchedule.endDate,
      existing.startDate,
      existing.endDate,
    )

    // Conflict exists if all three conditions are met
    if (daysOverlap && timesOverlap && periodsOverlap) {
      const conflictingDays = newSchedule.daysOfWeek.filter((day) =>
        existing.daysOfWeek.includes(day),
      )
      const conflictingTimes = newSchedule.times.filter((time) => existing.times.includes(time))

      conflicts.push({
        scheduleId: existing.id,
        conflictingDays,
        conflictingTimes,
      })
    }
  }

  return conflicts
}
