import {
  UserSettings,
  Medication,
  Inventory,
  Prescription,
  Schedule,
  DoseLog,
  DoseStatus
} from '@/types/medication'
import {
  startOfWeek,
  addDays,
  isSameDay,
  hmToLocalTodayISO
} from '@/lib/medication-utils'
import { subDays, parseISO, isBefore, addMinutes } from 'date-fns'

// TODO: GET /api/profile/settings → settings
export const SETTINGS: UserSettings = {
  userId: 'u_1',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  timeFormat: 'H24',
  defaultChannels: ['EMAIL'],
}

// TODO: GET /api/medications?include=inventory
export const MEDS: (Medication & { inventory?: Inventory | null })[] = [
  {
    id: 'm_metformin',
    userId: 'u_1',
    name: 'Metformin',
    brandName: 'Glucophage',
    form: 'TABLET',
    strengthValue: 500,
    strengthUnit: 'MG',
    route: 'ORAL',
    notes: 'Take with food',
    inventory: {
      id: 'inv_metformin',
      medicationId: 'm_metformin',
      currentQty: 8,
      unit: 'TAB',
      lowThreshold: 10,
      lastRestockedAt: null,
    },
  },
  {
    id: 'm_ibuprofen',
    userId: 'u_1',
    name: 'Ibuprofen',
    brandName: undefined,
    form: 'TABLET',
    strengthValue: 200,
    strengthUnit: 'MG',
    route: 'ORAL',
    notes: 'As needed for pain',
    inventory: {
      id: 'inv_ibuprofen',
      medicationId: 'm_ibuprofen',
      currentQty: 14,
      unit: 'TAB',
      lowThreshold: 6,
      lastRestockedAt: null,
    },
  },
]

// TODO: GET /api/prescriptions?include=schedules,medication
export const RX: (Prescription & { medication: Medication; schedules: Schedule[] })[] = [
  {
    id: 'rx_metformin',
    userId: 'u_1',
    medicationId: 'm_metformin',
    asNeeded: false,
    maxDailyDose: null,
    instructions: '1 tab twice daily',
    indication: 'Type 2 diabetes',
    startDate: subDays(new Date(), 7).toISOString(),
    endDate: null,
    providerId: null,
    medication: MEDS[0],
    schedules: [
      {
        id: 'sch_metformin',
        prescriptionId: 'rx_metformin',
        timezone: SETTINGS.timezone,
        daysOfWeek: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
        times: ['08:00', '20:00'],
        doseQuantity: 1,
        doseUnit: 'TAB',
      },
    ],
  },
  {
    id: 'rx_ibuprofen_prn',
    userId: 'u_1',
    medicationId: 'm_ibuprofen',
    asNeeded: true,
    maxDailyDose: 6,
    instructions: '1–2 tabs as needed for pain',
    indication: 'Pain',
    startDate: subDays(new Date(), 3).toISOString(),
    endDate: null,
    providerId: null,
    medication: MEDS[1],
    schedules: [
      {
        id: 'sch_ibuprofen_prn',
        prescriptionId: 'rx_ibuprofen_prn',
        timezone: SETTINGS.timezone,
        daysOfWeek: [], // PRN — no fixed days/times
        times: [],
        doseQuantity: 1,
        doseUnit: 'TAB',
      },
    ],
  },
]

// Generate mock DoseLogs for current week for Metformin on 7 days * 2
// TODO: GET /api/dose?from=YYYY-MM-DD&to=YYYY-MM-DD → DoseLog[]
export function seedDoseLogsForWeek(): DoseLog[] {
  const today = new Date()
  const weekStart = startOfWeek(today)
  const out: DoseLog[] = []
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i)
    for (const t of RX[0].schedules[0].times) {
      const iso = hmToLocalTodayISO(t)
      // set date to specific day (locally)
      const dt = new Date(iso)
      dt.setFullYear(d.getFullYear(), d.getMonth(), d.getDate())
      const scheduledFor = dt.toISOString()
      const id = `dl_${i}_${t.replace(':', '')}`

      // small variety of statuses
      let status: DoseStatus = 'SCHEDULED'
      let takenAt: string | null = null
      if (isSameDay(d, today)) {
        // today: first dose SCHEDULED, second — if time already passed — MISSED
        if (t === '08:00') {
          if (isBefore(dt, new Date())) {
            status = 'TAKEN'
            takenAt = addMinutes(dt, 20).toISOString()
          }
        } else {
          if (isBefore(dt, new Date())) status = 'MISSED'
        }
      } else if (isBefore(d, today)) {
        // past
        status = Math.random() < 0.8 ? 'TAKEN' : 'MISSED'
        if (status === 'TAKEN') takenAt = addMinutes(dt, 15).toISOString()
      } else {
        // future
        status = 'SCHEDULED'
      }

      out.push({
        id,
        prescriptionId: 'rx_metformin',
        scheduleId: 'sch_metformin',
        scheduledFor,
        status,
        takenAt,
        quantity: 1,
        unit: 'TAB',
      })
    }
  }
  return out
}

export const SEEDED_LOGS = seedDoseLogsForWeek()
