export function getClientTimePrefs() {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const parts = new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).formatToParts(new Date())
  const uses12h = parts.some((p) => p.type === 'dayPeriod')
  return { timeZone, uses12h }
}
