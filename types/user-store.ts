import { UserSettings, Medication, Prescription, DoseLog, Inventory } from './medication'

export interface UserProfile {
  id: string
  name: string
  email: string
  emailVerified: Date | null
  image: string | null
  createdAt: Date
  updatedAt: Date
}

export interface UserState {
  // User profile data
  profile: UserProfile | null
  settings: UserSettings | null

  // Medications and prescriptions
  medications: (Medication & { inventory?: Inventory | null })[]
  prescriptions: (Prescription & { medication: Medication; schedules: any[] })[]

  // Dose logs
  doseLogs: DoseLog[]

  // Loading states
  isLoading: boolean
  isInitialized: boolean

  // Error state
  error: string | null
}

export interface UserActions {
  // Profile actions
  setProfile: (profile: UserProfile | null) => void
  updateProfile: (updates: Partial<UserProfile>) => void

  // Settings actions
  setSettings: (settings: UserSettings) => void
  updateSettings: (updates: Partial<UserSettings>) => void

  // Medications actions
  setMedications: (medications: (Medication & { inventory?: Inventory | null })[]) => void
  addMedication: (medication: Medication & { inventory?: Inventory | null }) => void
  updateMedication: (id: string, updates: Partial<Medication>) => void
  removeMedication: (id: string) => void

  // Prescriptions actions
  setPrescriptions: (prescriptions: (Prescription & { medication: Medication; schedules: any[] })[]) => void
  addPrescription: (prescription: Prescription & { medication: Medication; schedules: any[] }) => void
  updatePrescription: (id: string, updates: Partial<Prescription>) => void
  removePrescription: (id: string) => void

  // Dose logs actions
  setDoseLogs: (doseLogs: DoseLog[]) => void
  addDoseLog: (doseLog: DoseLog) => void
  updateDoseLog: (id: string, updates: Partial<DoseLog>) => void
  removeDoseLog: (id: string) => void

  // API actions
  createMedication: (medicationData: any) => Promise<any>
  createPrescription: (prescriptionData: any) => Promise<any>
  generateDoses: (prescriptionId: string, from: string, to: string, timezone: string) => Promise<any>
  updateInventory: (medicationId: string, inventoryData: any) => Promise<any>

  // Utility actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  initialize: () => Promise<void>
  reset: () => void
}

export type UserStore = UserState & UserActions
