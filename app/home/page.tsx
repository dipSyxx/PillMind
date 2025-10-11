'use client'

import React, { useMemo, useState, useEffect } from 'react'
import {
  CalendarDays,
  Home,
  ListChecks,
  Pill,
  Plus,
  User,
  Check,
  Clock,
  AlarmClock,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Syringe,
  Thermometer,
  Droplets,
  PauseCircle,
  PlayCircle,
  Info,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
  DrawerTrigger,
  DrawerFooter,
} from '@/components/ui/drawer'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/* =============================================================================
   TYPES (дзеркалять твою Prisma-схему)
============================================================================= */
type Weekday = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'
type MedForm = 'TABLET' | 'CAPSULE' | 'LIQUID' | 'INJECTION' | 'INHALER' | 'TOPICAL' | 'DROPS' | 'OTHER'
type RouteKind =
  | 'ORAL'
  | 'SUBLINGUAL'
  | 'INHALATION'
  | 'TOPICAL'
  | 'INJECTION'
  | 'OPHTHALMIC'
  | 'NASAL'
  | 'RECTAL'
  | 'OTHER'
type Unit = 'MG' | 'MCG' | 'G' | 'ML' | 'IU' | 'DROP' | 'PUFF' | 'UNIT' | 'TAB' | 'CAPS'
type DoseStatus = 'SCHEDULED' | 'TAKEN' | 'SKIPPED' | 'MISSED'
type TimeFormat = 'H12' | 'H24'
type Channel = 'PUSH' | 'EMAIL' | 'SMS'

type UserSettings = {
  userId: string
  timezone: string
  timeFormat: TimeFormat
  defaultChannels: Channel[]
}

type Medication = {
  id: string
  userId: string
  name: string
  brandName?: string | null
  form: MedForm
  strengthValue?: number | null
  strengthUnit?: Unit | null
  route?: RouteKind | null
  notes?: string | null
}

type Inventory = {
  id: string
  medicationId: string
  currentQty: number
  unit: Unit
  lowThreshold?: number | null
  lastRestockedAt?: string | null
}

type Prescription = {
  id: string
  userId: string
  medicationId: string
  providerId?: string | null
  indication?: string | null
  asNeeded: boolean
  maxDailyDose?: number | null
  instructions?: string | null
  startDate: string
  endDate?: string | null
}

type Schedule = {
  id: string
  prescriptionId: string
  timezone: string
  daysOfWeek: Weekday[]
  times: string[] // 'HH:mm' 24h
  doseQuantity?: number | null
  doseUnit?: Unit | null
  startDate?: string | null
  endDate?: string | null
}

type DoseLog = {
  id: string
  prescriptionId: string
  scheduleId?: string | null
  scheduledFor: string // ISO UTC
  takenAt?: string | null
  status: DoseStatus
  quantity?: number | null
  unit?: Unit | null
}

/* =============================================================================
   UTILITIES (спрощені, TZ по браузеру; в проді — використай твої time utils)
============================================================================= */

/** Формує ключ дня у вказаному IANA TZ: YYYY-MM-DD */
function dayKeyInTz(d: Date | string, tz = SETTINGS.timezone) {
  const dt = typeof d === 'string' ? new Date(d) : d
  // en-CA дає формат YYYY-MM-DD — зручно для порівнянь
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dt)
}

/** Порівняння днів у TZ: -1, 0, 1 */
function compareDayTz(a: Date | string, b: Date | string, tz = SETTINGS.timezone) {
  const ka = dayKeyInTz(a, tz)
  const kb = dayKeyInTz(b, tz)
  return ka < kb ? -1 : ka > kb ? 1 : 0
}

function isSameDayTz(a: Date | string, b: Date | string, tz = SETTINGS.timezone) {
  return compareDayTz(a, b, tz) === 0
}

/** Нормалізація статусу по днях у TZ користувача */
function statusByDay(dl: DoseLog): DoseStatus {
  const today = new Date()
  const cmp = compareDayTz(dl.scheduledFor, today)
  if (cmp < 0) {
    // минулі дні — якщо НЕ TAKEN і НЕ SKIPPED → MISSED
    return dl.status === 'TAKEN' || dl.status === 'SKIPPED' ? dl.status : 'MISSED'
  }
  if (cmp > 0) {
    // майбутні дні завжди SCHEDULED (тільки для відображення)
    return 'SCHEDULED'
  }
  // сьогодні — показуємо реальний статус
  return dl.status
}

/** Чи дозволено взаємодія (лише сьогодні у TZ користувача) */
function canInteractWithDose(dl: DoseLog) {
  return isSameDayTz(dl.scheduledFor, new Date())
}

function stripTime(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
function isBeforeDay(a: Date, b: Date) {
  return stripTime(a).getTime() < stripTime(b).getTime()
}
function isAfterDay(a: Date, b: Date) {
  return stripTime(a).getTime() > stripTime(b).getTime()
}

const WEEKDAYS: Weekday[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const weekdayLabelShort: Record<Weekday, string> = {
  MON: 'Mon',
  TUE: 'Tue',
  WED: 'Wed',
  THU: 'Thu',
  FRI: 'Fri',
  SAT: 'Sat',
  SUN: 'Sun',
}

function startOfWeek(date: Date, mondayFirst = true) {
  const d = new Date(date)
  const day = d.getDay() // 0..6 (Sun..Sat)
  const diff = mondayFirst ? (day === 0 ? -6 : 1 - day) : -day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function formatDayKey(d: Date) {
  return d.toISOString().slice(0, 10) // YYYY-MM-DD
}
function formatHumanDate(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
}

function toLocalHM(isoUtc: string, timeFormat: TimeFormat) {
  const dt = new Date(isoUtc)
  const opts: Intl.DateTimeFormatOptions =
    timeFormat === 'H12'
      ? { hour: 'numeric', minute: '2-digit', hour12: true }
      : { hour: '2-digit', minute: '2-digit', hour12: false }
  return dt.toLocaleTimeString([], opts)
}

function hmToLocalTodayISO(hm: string) {
  // "HH:mm" -> today local ISO (approx, без TZ конвертації на сервері)
  const [h, m] = hm.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

function weekdayFromDate(d: Date): Weekday {
  const wd = d.getDay() // Sun=0
  return WEEKDAYS[(wd + 6) % 7] // Mon=0
}

/* =============================================================================
   STATIC SEED DATA (поки що мок-дані; заміниш на API)
============================================================================= */

// TODO: GET /api/profile/settings → settings
const SETTINGS: UserSettings = {
  userId: 'u_1',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  timeFormat: 'H24',
  defaultChannels: ['EMAIL'],
}

// TODO: GET /api/medications?include=inventory
const MEDS: (Medication & { inventory?: Inventory | null })[] = [
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
const RX: (Prescription & { medication: Medication; schedules: Schedule[] })[] = [
  {
    id: 'rx_metformin',
    userId: 'u_1',
    medicationId: 'm_metformin',
    asNeeded: false,
    maxDailyDose: null,
    instructions: '1 tab twice daily',
    indication: 'Type 2 diabetes',
    startDate: new Date(Date.now() - 7 * 864e5).toISOString(),
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
    startDate: new Date(Date.now() - 3 * 864e5).toISOString(),
    endDate: null,
    providerId: null,
    medication: MEDS[1],
    schedules: [
      {
        id: 'sch_ibuprofen_prn',
        prescriptionId: 'rx_ibuprofen_prn',
        timezone: SETTINGS.timezone,
        daysOfWeek: [], // PRN — немає фіксованих днів/часів
        times: [],
        doseQuantity: 1,
        doseUnit: 'TAB',
      },
    ],
  },
]

// Сгенеруємо мок-DoseLog’и для поточного тижня під Metformin на 7 днів * 2
// TODO: GET /api/dose?from=YYYY-MM-DD&to=YYYY-MM-DD → DoseLog[]
function seedDoseLogsForWeek(): DoseLog[] {
  const today = new Date()
  const weekStart = startOfWeek(today)
  const out: DoseLog[] = []
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i)
    for (const t of RX[0].schedules[0].times) {
      const iso = hmToLocalTodayISO(t)
      // виставимо дату на конкретний день (локально)
      const dt = new Date(iso)
      dt.setFullYear(d.getFullYear(), d.getMonth(), d.getDate())
      const scheduledFor = dt.toISOString()
      const id = `dl_${i}_${t.replace(':', '')}`

      // маленька різноманітність статусів
      let status: DoseStatus = 'SCHEDULED'
      let takenAt: string | null = null
      if (isSameDay(d, today)) {
        // сьогодні: перший прийом SCHEDULED, другий — якщо час вже минув — MISSED
        if (t === '08:00') {
          if (dt.getTime() < Date.now()) {
            status = 'TAKEN'
            takenAt = new Date(dt.getTime() + 20 * 60 * 1000).toISOString()
          }
        } else {
          if (dt.getTime() < Date.now()) status = 'MISSED'
        }
      } else if (d.getTime() < today.getTime()) {
        // минулі
        status = Math.random() < 0.8 ? 'TAKEN' : 'MISSED'
        if (status === 'TAKEN') takenAt = new Date(dt.getTime() + 15 * 60 * 1000).toISOString()
      } else {
        // майбутні
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

const SEEDED_LOGS = seedDoseLogsForWeek()

/* =============================================================================
   HOME PAGE
============================================================================= */

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>(SEEDED_LOGS) // TODO: завантажити з API за вікном тижня
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState<null | string>(null) // medicationId
  const [snoozeFor, setSnoozeFor] = useState<null | DoseLog>(null)

  const weekStart = startOfWeek(selectedDate)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // === Тижнева статистика ===
  const weekKeySet = new Set(weekDays.map((d) => dayKeyInTz(d)))
  const weekLogs = doseLogs.filter((dl) => weekKeySet.has(dayKeyInTz(dl.scheduledFor)))

  const { taken, scheduled, missed, skipped } = useMemo(() => {
    let taken = 0,
      scheduled = 0,
      missed = 0,
      skipped = 0
    for (const dl of weekLogs) {
      const st = statusByDay(dl)
      if (st === 'TAKEN') taken++
      else if (st === 'SCHEDULED') scheduled++
      else if (st === 'MISSED') missed++
      else if (st === 'SKIPPED') skipped++
    }
    return { taken, scheduled, missed, skipped }
  }, [weekLogs])

  const adherence = useMemo(() => {
    const denom = taken + missed + skipped + scheduled
    if (!denom) return 100
    return Math.round((taken / (taken + missed + skipped)) * 100)
  }, [taken, missed, skipped, scheduled])

  // === Логи на день ===
  const dayLogs = useMemo(() => {
    const k = dayKeyInTz(selectedDate)
    const items = doseLogs.filter((x) => dayKeyInTz(x.scheduledFor) === k)
    // сортуємо за часом
    return items.sort((a, b) => +new Date(a.scheduledFor) - +new Date(b.scheduledFor))
  }, [doseLogs, selectedDate])

  // === Прив'язка до Prescription/Medication ===
  const rxById = useMemo(() => Object.fromEntries(RX.map((r) => [r.id, r])), [])
  const medById = useMemo(() => Object.fromEntries(MEDS.map((m) => [m.id, m])), [])

  // === Дії над дозами (локальні; у проді — виклик API + оптимістичний апдейт) ===
  async function takeDose(doseLogId: string) {
    const dl = doseLogs.find((x) => x.id === doseLogId)
    if (!dl || !canInteractWithDose(dl)) return
    // TODO: PATCH /api/dose/[id]/take
    setDoseLogs((prev) =>
      prev.map((d) => (d.id === doseLogId ? { ...d, status: 'TAKEN', takenAt: new Date().toISOString() } : d)),
    )
  }

  async function skipDose(doseLogId: string) {
    const dl = doseLogs.find((x) => x.id === doseLogId)
    if (!dl || !canInteractWithDose(dl)) return
    // TODO: PATCH /api/dose/[id] { status: 'SKIPPED' }
    setDoseLogs((prev) => prev.map((d) => (d.id === doseLogId ? { ...d, status: 'SKIPPED' } : d)))
  }

  async function snoozeDose(doseLogId: string, minutes: number) {
    const dl = doseLogs.find((x) => x.id === doseLogId)
    if (!dl || !canInteractWithDose(dl)) return
    // TODO: PATCH /api/dose/[id]/snooze { minutes }
    setDoseLogs((prev) =>
      prev.map((d) =>
        d.id === doseLogId
          ? { ...d, scheduledFor: new Date(Date.now() + minutes * 60 * 1000).toISOString(), status: 'SCHEDULED' }
          : d,
      ),
    )
    setSnoozeFor(null)
  }

  // === PRN "Take now" ===
  async function prnTakeNow(prescriptionId: string) {
    // TODO: POST /api/dose/take-smart { prescriptionId }
    const rx = rxById[prescriptionId]
    const defaultQ = rx?.schedules[0]?.doseQuantity ?? 1
    const defaultU = rx?.schedules[0]?.doseUnit ?? 'TAB'
    const id = `dl_prn_${Date.now()}`
    setDoseLogs((prev) => [
      ...prev,
      {
        id,
        prescriptionId,
        scheduleId: null,
        scheduledFor: new Date().toISOString(),
        takenAt: new Date().toISOString(),
        status: 'TAKEN',
        quantity: defaultQ ?? undefined,
        unit: defaultU ?? undefined,
      },
    ])
  }

  // === Прогрес для “баблів” на тижневому стріпі ===
  function dayProgress(d: Date) {
    const k = dayKeyInTz(d)
    const logs = doseLogs.filter((x) => dayKeyInTz(x.scheduledFor) === k)
    if (!logs.length) return 0
    const done = logs.filter((x) => statusByDay(x) === 'TAKEN').length
    return Math.round((done / logs.length) * 100)
  }

  const lowStock = MEDS.filter(
    (m) => m.inventory && m.inventory.lowThreshold != null && m.inventory.currentQty <= (m.inventory.lowThreshold || 0),
  )

  // (мобільна) нижня навігація — демо, без роутінгу
  const [activeTab, setActiveTab] = useState<'home' | 'meds' | 'logs' | 'profile'>('home')

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#F8FAFC] to-[#E2E8F0] pb-[88px]">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">PillMind</h1>
            <p className="text-sm text-[#64748B]">Stay on track with your meds</p>
          </div>
          <Button variant="pillmindGhost" size="sm" className="rounded-xl">
            <CalendarDays className="w-4 h-4 mr-2" />
            This week
          </Button>
        </div>
      </div>

      {/* Week strip */}
      <div className="px-3">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="pillmindWhite"
              size="sm"
              onClick={() => setSelectedDate(addDays(selectedDate, -7))}
              className="rounded-xl"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-sm font-medium text-[#0F172A]">{formatHumanDate(selectedDate)}</div>
            <Button
              variant="pillmindWhite"
              size="sm"
              onClick={() => setSelectedDate(addDays(selectedDate, +7))}
              className="rounded-xl"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((d) => {
              const wd = weekdayFromDate(d)
              const prog = dayProgress(d)
              const isToday = isSameDay(d, new Date())
              const isActive = isSameDay(d, selectedDate)
              return (
                <button
                  key={formatDayKey(d)}
                  onClick={() => setSelectedDate(d)}
                  className={cn(
                    'rounded-xl p-2 flex flex-col items-center border transition-all',
                    isActive ? 'bg-[#0EA8BC]/10 border-[#0EA8BC]' : 'bg-white border-[#E2E8F0] hover:bg-slate-50',
                  )}
                >
                  <span className={cn('text-[11px] mb-1', isToday ? 'text-[#0EA8BC] font-semibold' : 'text-[#64748B]')}>
                    {weekdayLabelShort[wd]}
                  </span>
                  <div className="relative size-9 grid place-items-center">
                    <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32"
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                      <path
                        d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32"
                        fill="none"
                        stroke="#0EA8BC"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${(prog / 100) * 100} ${100 - (prog / 100) * 100}`}
                      />
                    </svg>
                    <span className="text-[11px] font-semibold">{new Date(d).getDate()}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Weekly summary + low stock + PRN */}
      <div className="px-4 mt-4 space-y-3">
        {/* Weekly summary */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-[#0EA8BC]" />
              <h3 className="font-semibold text-[#0F172A]">Weekly Summary</h3>
            </div>
            <Badge variant={adherence >= 85 ? 'success' : adherence >= 60 ? 'warning' : 'destructive'}>
              {adherence}% adherence
            </Badge>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="rounded-lg bg-[#F8FAFC] p-2">
              <div className="text-xs text-[#64748B]">Taken</div>
              <div className="text-lg font-bold">{taken}</div>
            </div>
            <div className="rounded-lg bg-[#F8FAFC] p-2">
              <div className="text-xs text-[#64748B]">Scheduled</div>
              <div className="text-lg font-bold">{scheduled}</div>
            </div>
            <div className="rounded-lg bg-[#F8FAFC] p-2">
              <div className="text-xs text-[#64748B]">Missed</div>
              <div className="text-lg font-bold">{missed}</div>
            </div>
            <div className="rounded-lg bg-[#F8FAFC] p-2">
              <div className="text-xs text-[#64748B]">Skipped</div>
              <div className="text-lg font-bold">{skipped}</div>
            </div>
          </div>

          {/* simple progress bar */}
          <div className="mt-3">
            <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div className="h-full bg-[#0EA8BC]" style={{ width: `${adherence}%` }} />
            </div>
          </div>
          <p className="text-xs text-[#64748B] mt-2">
            Aim for consistent intake to keep adherence above <strong>85%</strong>.
          </p>
        </div>

        {/* Low stock alerts */}
        {lowStock.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <p className="text-sm font-semibold text-red-700">Low stock</p>
            </div>
            <div className="space-y-2">
              {lowStock.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-sm">
                  <span className="text-red-700">
                    {m.name} • {m.inventory?.currentQty} {m.inventory?.unit} left
                  </span>
                  <Button variant="pillmindOutline" size="sm" className="rounded-xl">
                    Refill
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PRN quick actions */}
        {RX.filter((r) => r.asNeeded).map((r) => (
          <div key={r.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-[#0EA8BC]" />
                <div>
                  <div className="text-sm font-semibold text-[#0F172A]">{r.medication.name}</div>
                  <div className="text-xs text-[#64748B]">PRN • {r.instructions}</div>
                </div>
              </div>
              <Button variant="pillmind" size="sm" onClick={() => prnTakeNow(r.id)} className="rounded-xl">
                <Check className="w-4 h-4 mr-1" />
                Take now
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Day schedule list */}
      <div className="px-4 mt-5 mb-28">
        <h3 className="text-sm font-semibold text-[#0F172A] mb-2">Doses on {formatHumanDate(selectedDate)}</h3>

        {dayLogs.length === 0 ? (
          <div className="text-center text-[#64748B] text-sm bg-white border border-[#E2E8F0] rounded-xl p-6">
            No doses for this day.
          </div>
        ) : (
          <div className="space-y-3">
            {dayLogs.map((dl) => {
              const uiStatus = statusByDay(dl) // ✅ що показуємо
              const actionable = canInteractWithDose(dl) // ✅ чи показувати кнопки
              const rx = rxById[dl.prescriptionId]
              const med = medById[rx.medicationId]
              return (
                <div
                  key={dl.id}
                  className="bg-white border border-[#E2E8F0] rounded-2xl p-3 flex items-start justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0EA8BC]/10 border border-[#0EA8BC]/20 grid place-items-center">
                      <Pill className="w-5 h-5 text-[#0EA8BC]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-[#0F172A]">{med.name}</div>
                        {rx.asNeeded ? (
                          <Badge variant="secondary">PRN</Badge>
                        ) : (
                          <Badge variant="outline">{toLocalHM(dl.scheduledFor, SETTINGS.timeFormat)}</Badge>
                        )}
                      </div>
                      <div className="text-xs text-[#64748B]">
                        {rx.instructions ?? `${dl.quantity ?? ''} ${dl.unit ?? ''}`.trim()}
                      </div>
                      <div className="mt-1">
                        <StatusBadge status={uiStatus} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {actionable && dl.status !== 'TAKEN' && (
                      <Button variant="pillmindGhost" size="sm" onClick={() => takeDose(dl.id)} className="rounded-xl">
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    {actionable && dl.status === 'SCHEDULED' && (
                      <Button
                        variant="pillmindGhost"
                        size="sm"
                        onClick={() => setSnoozeFor(dl)}
                        className="rounded-xl"
                        title="Snooze"
                      >
                        <AlarmClock className="w-4 h-4" />
                      </Button>
                    )}
                    {actionable && dl.status !== 'TAKEN' && (
                      <Button variant="pillmindGhost" size="sm" onClick={() => skipDose(dl.id)} className="rounded-xl">
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Snooze dialog */}
      <Dialog open={!!snoozeFor} onOpenChange={(v) => !v && setSnoozeFor(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Snooze dose</DialogTitle>
            <DialogDescription>Remind me again in…</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 15, 60].map((m) => (
              <Button
                key={m}
                variant="pillmindWhite"
                onClick={() => snoozeDose(snoozeFor!.id, m)}
                className="rounded-xl"
              >
                {m}m
              </Button>
            ))}
          </div>
          <DialogClose asChild>
            <Button variant="pillmind" className="w-full mt-3 rounded-xl">
              Done
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Medication (multi-step) */}
      <Drawer open={isAddOpen} onOpenChange={setIsAddOpen} direction="bottom">
        <DrawerTrigger asChild>
          <button className="fixed bottom-[90px] left-1/2 -translate-x-1/2 z-40 bg-[#0EA8BC] text-white rounded-full w-14 h-14 shadow-[0_10px_30px_rgba(14,168,188,0.4)] active:scale-95 transition">
            <Plus className="w-6 h-6 mx-auto" />
            <span className="sr-only">Add medication</span>
          </button>
        </DrawerTrigger>

        <DrawerContent className="p-0">
          <CreateOrEditMedication
            mode="create"
            onClose={() => setIsAddOpen(false)}
            // TODO: onSave → POST /api/medications + /api/prescriptions + /api/schedules
            onSaved={(draft) => {
              // оптимістично: додамо у локальний список (мінімально)
              const newMed: Medication = {
                id: `m_${Date.now()}`,
                userId: 'u_1',
                name: draft.name,
                form: draft.form,
                strengthValue: draft.strengthValue ?? null,
                strengthUnit: draft.strengthUnit ?? null,
                route: draft.route,
                notes: draft.notes ?? null,
                brandName: draft.brandName ?? null,
              }
              const newRx: Prescription = {
                id: `rx_${Date.now()}`,
                userId: 'u_1',
                medicationId: newMed.id,
                asNeeded: draft.asNeeded,
                maxDailyDose: draft.maxDailyDose ?? null,
                instructions: draft.instructions ?? null,
                indication: draft.indication ?? null,
                startDate: new Date().toISOString(),
                endDate: null,
                providerId: null,
              }
              const newSch: Schedule | null = draft.asNeeded
                ? {
                    id: `sch_${Date.now()}`,
                    prescriptionId: newRx.id,
                    timezone: SETTINGS.timezone,
                    daysOfWeek: [],
                    times: [],
                    doseQuantity: draft.doseQuantity ?? null,
                    doseUnit: draft.doseUnit ?? null,
                  }
                : {
                    id: `sch_${Date.now()}`,
                    prescriptionId: newRx.id,
                    timezone: SETTINGS.timezone,
                    daysOfWeek: draft.daysOfWeek,
                    times: draft.times,
                    doseQuantity: draft.doseQuantity ?? null,
                    doseUnit: draft.doseUnit ?? null,
                  }

              // TODO: оновити глобальні RX/MEDS зі стейту або SWR/React Query
              setIsAddOpen(false)
            }}
          />
        </DrawerContent>
      </Drawer>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur border-t border-[#E2E8F0]">
        <div className="grid grid-cols-4 px-4 py-2 text-xs">
          <NavItem icon={Home} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavItem icon={Pill} label="Meds" active={activeTab === 'meds'} onClick={() => setActiveTab('meds')} />
          <NavItem icon={ListChecks} label="Logs" active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
          <NavItem
            icon={User}
            label="Profile"
            active={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
          />
        </div>
      </nav>
    </div>
  )
}

/* =============================================================================
   SMALL PARTS
============================================================================= */

function StatusBadge({ status }: { status: DoseStatus }) {
  if (status === 'TAKEN') return <Badge variant="success">Taken</Badge>
  if (status === 'MISSED') return <Badge variant="destructive">Missed</Badge>
  if (status === 'SKIPPED') return <Badge variant="secondary">Skipped</Badge>
  return <Badge variant="outline">Scheduled</Badge>
}

function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<any>
  label: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center py-1 rounded-xl transition',
        active ? 'text-[#0EA8BC]' : 'text-[#64748B] hover:text-[#0F172A]',
      )}
    >
      <Icon className="w-5 h-5 mb-0.5" />
      {label}
    </button>
  )
}

/* =============================================================================
   CREATE / EDIT MEDICATION WIZARD (Sheet)
============================================================================= */

type DraftMedication = {
  // Medication
  name: string
  brandName?: string
  form: MedForm
  strengthValue?: number
  strengthUnit?: Unit
  route?: RouteKind
  notes?: string
  // Prescription
  asNeeded: boolean
  indication?: string
  instructions?: string
  maxDailyDose?: number
  // Schedule
  doseQuantity?: number
  doseUnit?: Unit
  daysOfWeek: Weekday[]
  times: string[]
}

function CreateOrEditMedication({
  mode,
  initial,
  onSaved,
  onClose,
}: {
  mode: 'create' | 'edit'
  initial?: Partial<DraftMedication>
  onSaved: (draft: DraftMedication) => void
  onClose: () => void
}) {
  // кроки
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<DraftMedication>({
    name: initial?.name ?? '',
    brandName: initial?.brandName ?? '',
    form: initial?.form ?? 'TABLET',
    strengthValue: initial?.strengthValue,
    strengthUnit: initial?.strengthUnit ?? 'MG',
    route: initial?.route ?? 'ORAL',
    notes: initial?.notes ?? '',
    asNeeded: initial?.asNeeded ?? false,
    indication: initial?.indication ?? '',
    instructions: initial?.instructions ?? '',
    maxDailyDose: initial?.maxDailyDose,
    doseQuantity: initial?.doseQuantity ?? 1,
    doseUnit: initial?.doseUnit ?? 'TAB',
    daysOfWeek: initial?.daysOfWeek ?? ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    times: initial?.times ?? ['08:00', '20:00'],
  })

  function update<K extends keyof DraftMedication>(k: K, v: DraftMedication[K]) {
    setDraft((d) => ({ ...d, [k]: v }))
  }

  async function save() {
    setSaving(true)
    try {
      // TODO:
      // 1) POST /api/medications (body: Medication fields)
      // 2) POST /api/prescriptions (link to medicationId)
      // 3) if !asNeeded → POST /api/schedules
      //    else → optional POST /api/schedules for default doseQuantity/unit (no fixed times)
      onSaved(draft)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <DrawerHeader>
        <DrawerTitle>{mode === 'create' ? 'Add medication' : 'Edit medication'}</DrawerTitle>
        <DrawerDescription>Complete 3 quick steps to configure medication and reminders.</DrawerDescription>
      </DrawerHeader>

      {/* Steps */}
      <div className="flex items-center justify-center gap-2 text-xs">
        <StepDot done={step > 1} active={step === 1}>
          Medication
        </StepDot>
        <StepDot done={step > 2} active={step === 2}>
          Prescription
        </StepDot>
        <StepDot done={step > 3} active={step === 3}>
          Schedule
        </StepDot>
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <Input
            label="Name"
            placeholder="e.g., Metformin"
            value={draft.name}
            onChange={(e) => update('name', e.target.value)}
          />
          <Input
            label="Brand name (optional)"
            value={draft.brandName}
            onChange={(e) => update('brandName', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1">Form</label>
              <Select value={draft.form} onValueChange={(v) => update('form', v as MedForm)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select form" />
                </SelectTrigger>
                <SelectContent>
                  {(
                    ['TABLET', 'CAPSULE', 'LIQUID', 'INJECTION', 'INHALER', 'TOPICAL', 'DROPS', 'OTHER'] as MedForm[]
                  ).map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1">Route</label>
              <Select value={draft.route} onValueChange={(v) => update('route', v as RouteKind)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  {(
                    [
                      'ORAL',
                      'SUBLINGUAL',
                      'INHALATION',
                      'TOPICAL',
                      'INJECTION',
                      'OPHTHALMIC',
                      'NASAL',
                      'RECTAL',
                      'OTHER',
                    ] as RouteKind[]
                  ).map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Input
              label="Strength"
              type="number"
              placeholder="500"
              value={draft.strengthValue ?? ''}
              onChange={(e) => update('strengthValue', Number(e.target.value))}
            />
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1">Unit</label>
              <Select value={draft.strengthUnit} onValueChange={(v) => update('strengthUnit', v as Unit)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  {(['MG', 'MCG', 'G', 'ML', 'IU', 'TAB', 'CAPS', 'DROP', 'PUFF', 'UNIT'] as Unit[]).map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              label="Notes"
              placeholder="e.g., take with food"
              value={draft.notes}
              onChange={(e) => update('notes', e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="pillmindWhite" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button variant="pillmind" onClick={() => setStep(2)} className="rounded-xl">
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-[#E2E8F0] rounded-xl bg-white">
            <div>
              <div className="text-sm font-medium text-[#0F172A]">As needed (PRN)</div>
              <div className="text-xs text-[#64748B]">Enable for non-scheduled, on-demand intake</div>
            </div>
            <Switch checked={draft.asNeeded} onCheckedChange={(v) => update('asNeeded', !!v)} />
          </div>

          <Input
            label="Indication (optional)"
            placeholder="e.g., Diabetes"
            value={draft.indication}
            onChange={(e) => update('indication', e.target.value)}
          />
          <Input
            label="Instructions (optional)"
            placeholder="e.g., 1 tab twice daily"
            value={draft.instructions}
            onChange={(e) => update('instructions', e.target.value)}
          />
          {draft.asNeeded && (
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Max/day (optional)"
                type="number"
                placeholder="e.g., 6"
                value={draft.maxDailyDose ?? ''}
                onChange={(e) => update('maxDailyDose', Number(e.target.value))}
              />
              <div className="p-3 border border-[#E2E8F0] rounded-xl text-xs text-[#64748B] bg-[#F8FAFC]">
                PRN has no fixed times. You can still set default dose amount on next step.
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="pillmindWhite" onClick={() => setStep(1)} className="rounded-xl">
              Back
            </Button>
            <Button variant="pillmind" onClick={() => setStep(3)} className="rounded-xl">
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Dose quantity"
              type="number"
              value={draft.doseQuantity ?? ''}
              onChange={(e) => update('doseQuantity', Number(e.target.value))}
            />
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1">Dose unit</label>
              <Select value={draft.doseUnit} onValueChange={(v) => update('doseUnit', v as Unit)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  {(['TAB', 'CAPS', 'ML', 'MG', 'UNIT', 'DROP', 'PUFF'] as Unit[]).map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!draft.asNeeded && (
            <>
              <div>
                <div className="text-sm font-medium text-[#334155] mb-2">Weekdays</div>
                <div className="grid grid-cols-7 gap-1">
                  {WEEKDAYS.map((w) => {
                    const on = draft.daysOfWeek.includes(w)
                    return (
                      <label
                        key={w}
                        className={cn(
                          'text-xs px-2 py-1 rounded-lg border cursor-pointer text-center',
                          on ? 'bg-[#0EA8BC]/10 border-[#0EA8BC] text-[#0F172A]' : 'border-[#E2E8F0] text-[#64748B]',
                        )}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={on}
                          onChange={(e) => {
                            const set = new Set(draft.daysOfWeek)
                            e.target.checked ? set.add(w) : set.delete(w)
                            update('daysOfWeek', Array.from(set) as Weekday[])
                          }}
                        />
                        {weekdayLabelShort[w]}
                      </label>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-[#334155] mb-2">Times (24h “HH:mm”)</div>
                <TimesEditor value={draft.times} onChange={(arr) => update('times', arr)} placeholder="08:00, 20:00" />
                <p className="text-xs text-[#64748B] mt-1">Timezone: {SETTINGS.timezone}</p>
              </div>
            </>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="pillmindWhite" onClick={() => setStep(2)} className="rounded-xl">
              Back
            </Button>
            <Button variant="pillmind" onClick={save} disabled={saving} className="rounded-xl">
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      )}

      <DrawerFooter className="pt-1" />
    </div>
  )
}

function StepDot({ active, done, children }: { active?: boolean; done?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] transition-colors',
        done
          ? 'bg-green-50 border-green-500 text-green-700'
          : active
            ? 'bg-[#0EA8BC]/10 border-[#0EA8BC] text-[#0F172A]'
            : 'border-[#E2E8F0] text-[#64748B]',
      )}
      aria-current={active ? 'step' : undefined}
    >
      {done && <Check className="w-3 h-3" aria-hidden />}
      {children}
    </div>
  )
}

function TimesEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
}) {
  const [draft, setDraft] = useState(value.join(', '))
  useEffect(() => setDraft(value.join(', ')), [value])

  function apply() {
    const clean = draft
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        // нормалізуємо 8:0 → 08:00
        const m = s.match(/^(\d{1,2}):(\d{1,2})$/)
        if (!m) return s
        const hh = String(Math.min(23, Number(m[1]))).padStart(2, '0')
        const mm = String(Math.min(59, Number(m[2]))).padStart(2, '0')
        return `${hh}:${mm}`
      })
    onChange(Array.from(new Set(clean)))
  }

  return (
    <div className="flex gap-2">
      <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} className="flex-1" />
      <Button variant="pillmindOutline" onClick={apply} className="rounded-xl">
        Apply
      </Button>
    </div>
  )
}

/* =============================================================================
   TODO (підключення до справжніх API)
============================================================================= */
/**
 * - Завантаження даних:
 *   - GET /api/profile/settings → UserSettings (TZ, H12/H24)
 *   - GET /api/medications?include=inventory
 *   - GET /api/prescriptions?include=medication,schedules
 *   - GET /api/dose?from=YYYY-MM-DD&to=YYYY-MM-DD (вікно обраного тижня)
 *
 * - Дії над дозами:
 *   - PATCH /api/dose/[id]/take
 *   - PATCH /api/dose/[id] { status: 'SKIPPED' }
 *   - PATCH /api/dose/[id]/snooze { minutes } (або scheduledFor: ISO)
 *   - POST  /api/dose/take-smart { prescriptionId } — для PRN або “розумного” тейку
 *
 * - CRUD Medication/Prescription/Schedule:
 *   - POST /api/medications
 *   - POST /api/prescriptions (medicationId)
 *   - POST /api/schedules (prescriptionId)
 *   - PATCH/DELETE відповідно для редагування/видалення
 *
 * - Інвентар:
 *   - GET /api/inventory?medicationId=...
 *   - PATCH /api/inventory/[medicationId] { currentQty, lowThreshold }
 *
 * - Усі часи рахувати у TZ користувача (UserSettings.timezone), в БД зберігати UTC.
 */
