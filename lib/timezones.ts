/**
 * Common timezones list for user selection
 * Used across the application for timezone dropdowns
 */
export const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Kyiv', label: 'Kyiv (EET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
] as const

/**
 * Get timezones list with current timezone included if not in common list
 * @param currentTimezone - Current user timezone
 * @returns Array of timezone options
 */
export function getTimezonesWithCurrent(currentTimezone?: string | null) {
  if (!currentTimezone) return COMMON_TIMEZONES

  const exists = COMMON_TIMEZONES.some((tz) => tz.value === currentTimezone)
  if (exists) {
    return COMMON_TIMEZONES
  }

  // Add current timezone at the beginning if it's not in the common list
  return [{ value: currentTimezone, label: currentTimezone }, ...COMMON_TIMEZONES]
}
