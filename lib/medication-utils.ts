import {
  format,
  startOfWeek as dateFnsStartOfWeek,
  addDays,
  isSameDay,
  isBefore,
  isAfter,
  startOfDay,
  parseISO,
  getDay,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  addMinutes,
  addDays as dateFnsAddDays,
  startOfDay as dateFnsStartOfDay
} from 'date-fns'
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz'
import { DoseLog, DoseStatus, TimeFormat, Weekday } from '@/types/medication'

// Custom startOfWeek that starts on Monday (weekStartsOn: 1)
export function startOfWeek(date: Date): Date {
  return dateFnsStartOfWeek(date, { weekStartsOn: 1 })
}

// ===== TIMEZONE UTILITIES =====

/**
 * Get current time in specific timezone
 */
export function nowInTz(tz: string): Date {
  return toZonedTime(new Date(), tz)
}

/**
 * Get start of day in specific timezone
 */
export function startOfDayInTz(date: Date, tz: string): Date {
  const zonedDate = toZonedTime(date, tz)
  const startOfDayZoned = dateFnsStartOfDay(zonedDate)
  return fromZonedTime(startOfDayZoned, tz)
}

/**
 * Add days in specific timezone
 */
export function addDaysInTz(date: Date, days: number, tz: string): Date {
  const zonedDate = toZonedTime(date, tz)
  const newZonedDate = dateFnsAddDays(zonedDate, days)
  return fromZonedTime(newZonedDate, tz)
}

/**
 * Convert timezone HH:mm to UTC ISO string for a specific day
 */
export function tzHmToUtcISO(day: Date, hm: string, tz: string): string {
  const [hours, minutes] = hm.split(':').map(Number)

  // Create date in the target timezone
  const zonedDate = toZonedTime(day, tz)
  const zonedDateTime = new Date(zonedDate)
  zonedDateTime.setHours(hours, minutes, 0, 0)

  // Convert back to UTC
  const utcDateTime = fromZonedTime(zonedDateTime, tz)
  return utcDateTime.toISOString()
}

/**
 * Get weekday from date in specific timezone
 */
export function weekdayOf(date: Date, tz: string): Weekday {
  const zonedDate = toZonedTime(date, tz)
  const dayOfWeek = zonedDate.getDay()

  const weekdays: Weekday[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  return weekdays[dayOfWeek]
}

/**
 * Check if date is today in specific timezone
 */
export function isTodayInTz(dt: Date, tz: string): boolean {
  const today = nowInTz(tz)
  const targetDate = toZonedTime(dt, tz)

  return (
    today.getFullYear() === targetDate.getFullYear() &&
    today.getMonth() === targetDate.getMonth() &&
    today.getDate() === targetDate.getDate()
  )
}

/**
 * Get timezone day range (start and end) for a specific date
 */
export function tzDayRangeToUtc(tz: string, date: Date): { start: Date; end: Date } {
  const start = startOfDayInTz(date, tz)
  const end = addDaysInTz(start, 1, tz)

  return { start, end }
}

/**
 * Assert that dose can be acted upon today
 */
export function assertCanActToday(dl: DoseLog, tz: string): void {
  if (!isTodayInTz(new Date(dl.scheduledFor), tz)) {
    throw new Error('Not actionable outside of current day')
  }
}

// Timezone utilities (simplified, in production use your time utils)
export function dayKeyInTz(d: Date | string, tz: string) {
  const dt = typeof d === 'string' ? parseISO(d) : d
  // en-CA gives YYYY-MM-DD format - convenient for comparisons
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dt)
}

export function compareDayTz(a: Date | string, b: Date | string, tz: string) {
  const ka = dayKeyInTz(a, tz)
  const kb = dayKeyInTz(b, tz)
  return ka < kb ? -1 : ka > kb ? 1 : 0
}

export function isSameDayTz(a: Date | string, b: Date | string, tz: string) {
  return compareDayTz(a, b, tz) === 0
}

export function statusByDay(dl: DoseLog, timezone: string): DoseStatus {
  const today = new Date()
  const cmp = compareDayTz(dl.scheduledFor, today, timezone)
  if (cmp < 0) {
    // past days - if NOT TAKEN and NOT SKIPPED → MISSED
    return dl.status === 'TAKEN' || dl.status === 'SKIPPED' ? dl.status : 'MISSED'
  }
  if (cmp > 0) {
    // future days always SCHEDULED (for display only)
    return 'SCHEDULED'
  }
  // today - show real status
  return dl.status
}

export function canInteractWithDose(dl: DoseLog, timezone: string) {
  return isSameDayTz(dl.scheduledFor, new Date(), timezone)
}

export function stripTime(d: Date) {
  return startOfDay(d)
}

export function isBeforeDay(a: Date, b: Date) {
  return isBefore(startOfDay(a), startOfDay(b))
}

export function isAfterDay(a: Date, b: Date) {
  return isAfter(startOfDay(a), startOfDay(b))
}

export const WEEKDAYS: Weekday[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

export const weekdayLabelShort: Record<Weekday, string> = {
  MON: 'Mon',
  TUE: 'Tue',
  WED: 'Wed',
  THU: 'Thu',
  FRI: 'Fri',
  SAT: 'Sat',
  SUN: 'Sun',
}

// Re-export date-fns functions with consistent naming
export { addDays, isSameDay }

export function formatDayKey(d: Date) {
  return format(d, 'yyyy-MM-dd')
}

export function formatHumanDate(d: Date) {
  // Use date-fns format to avoid hydration mismatches
  return format(d, 'EEEE, MMM d')
}

export function toLocalHM(isoUtc: string, timeFormat: TimeFormat) {
  const dt = parseISO(isoUtc)
  return timeFormat === 'H12'
    ? format(dt, 'h:mm a')
    : format(dt, 'HH:mm')
}

export function hmToLocalTodayISO(hm: string) {
  // "HH:mm" -> today local ISO (approx, without TZ conversion on server)
  const [h, m] = hm.split(':').map(Number)
  const d = setMilliseconds(setSeconds(setMinutes(setHours(new Date(), h), m), 0), 0)
  return d.toISOString()
}

export function weekdayFromDate(d: Date): Weekday {
  const wd = getDay(d) // Sun=0
  return WEEKDAYS[(wd + 6) % 7] // Mon=0
}
