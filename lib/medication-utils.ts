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
  setMilliseconds
} from 'date-fns'
import { DoseLog, DoseStatus, TimeFormat, Weekday } from '@/types/medication'

// Custom startOfWeek that starts on Monday (weekStartsOn: 1)
export function startOfWeek(date: Date): Date {
  return dateFnsStartOfWeek(date, { weekStartsOn: 1 })
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
