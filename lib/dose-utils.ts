import { DoseLog } from '@/types/medication'
import { toZonedTime } from 'date-fns-tz'

/**
 * Check if a dose should be marked as MISSED
 * A dose is missed if:
 * - Status is SCHEDULED
 * - scheduledFor time has passed (in the user's timezone)
 *
 * @param doseLog - The dose log to check
 * @param userTimezone - User's timezone (e.g., 'Europe/Oslo')
 * @param now - Current time (defaults to new Date())
 * @returns true if the dose should be marked as MISSED
 */
export function shouldBeMarkedAsMissed(
  doseLog: DoseLog,
  userTimezone: string,
  now: Date = new Date()
): boolean {
  // Only check SCHEDULED doses
  if (doseLog.status !== 'SCHEDULED') {
    return false
  }

  // Convert scheduledFor to user's timezone for comparison
  const scheduledFor = new Date(doseLog.scheduledFor)
  const scheduledInTz = toZonedTime(scheduledFor, userTimezone)
  const nowInTz = toZonedTime(now, userTimezone)

  // If scheduled time has passed, it should be marked as MISSED
  return scheduledInTz < nowInTz
}

