// Medication-related types that mirror the Prisma schema

export type Weekday = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'

export type MedForm = 'TABLET' | 'CAPSULE' | 'LIQUID' | 'INJECTION' | 'INHALER' | 'TOPICAL' | 'DROPS' | 'OTHER'

export type RouteKind =
  | 'ORAL'
  | 'SUBLINGUAL'
  | 'INHALATION'
  | 'TOPICAL'
  | 'INJECTION'
  | 'OPHTHALMIC'
  | 'NASAL'
  | 'RECTAL'
  | 'OTHER'

export type Unit = 'MG' | 'MCG' | 'G' | 'ML' | 'IU' | 'DROP' | 'PUFF' | 'UNIT' | 'TAB' | 'CAPS'

export type DoseStatus = 'SCHEDULED' | 'TAKEN' | 'SKIPPED' | 'MISSED'

export type TimeFormat = 'H12' | 'H24'

export type Channel = 'PUSH' | 'EMAIL' | 'SMS'

export type UserSettings = {
  userId: string
  timezone: string
  timeFormat: TimeFormat
  defaultChannels: Channel[]
}

export type Medication = {
  id: string
  userId: string
  name: string
  brandName?: string | null
  form: MedForm
  strengthValue?: number | null
  strengthUnit?: Unit | null
  route?: RouteKind | null
  notes?: string | null
  inventory?: Inventory | null
}

export type Inventory = {
  id: string
  medicationId: string
  currentQty: number
  unit: Unit
  lowThreshold?: number | null
  lastRestockedAt?: string | null
}

export type CareProvider = {
  id: string
  userId: string
  name: string
  email?: string | null
  phone?: string | null
  clinic?: string | null
}

export type Prescription = {
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

export type Schedule = {
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

export type DoseLog = {
  id: string
  prescriptionId: string
  scheduleId?: string | null
  scheduledFor: string // ISO UTC
  takenAt?: string | null
  status: DoseStatus
  quantity?: number | null
  unit?: Unit | null
}

export type DraftMedication = {
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
  // Inventory
  inventoryCurrentQty?: number
  inventoryUnit?: Unit
  inventoryLowThreshold?: number
  inventoryLastRestockedAt?: string
}
