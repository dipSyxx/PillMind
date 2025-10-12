import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { UserStore, UserProfile } from '@/types/user-store'
import { UserSettings, Medication, Prescription, DoseLog, Inventory } from '@/types/medication'

// Default settings
const defaultSettings: UserSettings = {
  userId: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  timeFormat: 'H24',
  defaultChannels: ['EMAIL'],
}

// Initial state
const initialState = {
  profile: null,
  settings: defaultSettings,
  medications: [],
  prescriptions: [],
  doseLogs: [],
  isLoading: false,
  isInitialized: false,
  error: null,
}

export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Profile actions
        setProfile: (profile) =>
          set({ profile }, false, 'setProfile'),

        updateProfile: (updates) =>
          set(
            (state) => ({
              profile: state.profile ? { ...state.profile, ...updates } : null,
            }),
            false,
            'updateProfile'
          ),

        // Settings actions
        setSettings: (settings) =>
          set({ settings }, false, 'setSettings'),

        updateSettings: (updates) =>
          set(
            (state) => ({
              settings: state.settings ? { ...state.settings, ...updates } : defaultSettings,
            }),
            false,
            'updateSettings'
          ),

        // Medications actions
        setMedications: (medications) =>
          set({ medications }, false, 'setMedications'),

        addMedication: (medication) =>
          set(
            (state) => ({
              medications: [...state.medications, medication],
            }),
            false,
            'addMedication'
          ),

        updateMedication: (id, updates) =>
          set(
            (state) => ({
              medications: state.medications.map((med) =>
                med.id === id ? { ...med, ...updates } : med
              ),
            }),
            false,
            'updateMedication'
          ),

        removeMedication: (id) =>
          set(
            (state) => ({
              medications: state.medications.filter((med) => med.id !== id),
            }),
            false,
            'removeMedication'
          ),

        // Prescriptions actions
        setPrescriptions: (prescriptions) =>
          set({ prescriptions }, false, 'setPrescriptions'),

        addPrescription: (prescription) =>
          set(
            (state) => ({
              prescriptions: [...state.prescriptions, prescription],
            }),
            false,
            'addPrescription'
          ),

        updatePrescription: (id, updates) =>
          set(
            (state) => ({
              prescriptions: state.prescriptions.map((rx) =>
                rx.id === id ? { ...rx, ...updates } : rx
              ),
            }),
            false,
            'updatePrescription'
          ),

        removePrescription: (id) =>
          set(
            (state) => ({
              prescriptions: state.prescriptions.filter((rx) => rx.id !== id),
            }),
            false,
            'removePrescription'
          ),

        // Dose logs actions
        setDoseLogs: (doseLogs) => set({ doseLogs }, false, 'setDoseLogs'),

        addDoseLog: (doseLog) =>
          set(
            (state) => ({
              doseLogs: [...state.doseLogs, doseLog],
            }),
            false,
            'addDoseLog'
          ),

        updateDoseLog: (id, updates) =>
          set(
            (state) => ({
              doseLogs: state.doseLogs.map((log) =>
                log.id === id ? { ...log, ...updates } : log
              ),
            }),
            false,
            'updateDoseLog'
          ),

        removeDoseLog: (id) =>
          set(
            (state) => ({
              doseLogs: state.doseLogs.filter((log) => log.id !== id),
            }),
            false,
            'removeDoseLog'
          ),

        // API actions
        createMedication: async (medicationData: any) => {
          const { setLoading, setError, addMedication } = get()
          setLoading(true)
          setError(null)

          try {
            const response = await fetch('/api/medications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(medicationData),
            })

            if (response.ok) {
              const newMedication = await response.json()
              addMedication(newMedication)
              return newMedication
            } else {
              const errorData = await response.json()
              throw new Error(errorData.error || 'Failed to create medication')
            }
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to create medication')
            throw error
          } finally {
            setLoading(false)
          }
        },

        createPrescription: async (prescriptionData: any) => {
          const { setLoading, setError, addPrescription } = get()
          setLoading(true)
          setError(null)

          try {
            const response = await fetch('/api/prescriptions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(prescriptionData),
            })

            if (response.ok) {
              const newPrescription = await response.json()
              addPrescription(newPrescription)
              return newPrescription
            } else {
              const errorData = await response.json()
              throw new Error(errorData.error || 'Failed to create prescription')
            }
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to create prescription')
            throw error
          } finally {
            setLoading(false)
          }
        },

        generateDoses: async (prescriptionId: string, from: string, to: string) => {
          const { setLoading, setError } = get()
          setLoading(true)
          setError(null)

          try {
            const response = await fetch('/api/dose/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prescriptionId, from, to }),
            })

            if (response.ok) {
              const result = await response.json()
              // Reload dose logs after generation
              const { initialize } = get()
              await initialize()
              return result
            } else {
              const errorData = await response.json()
              throw new Error(errorData.error || 'Failed to generate doses')
            }
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to generate doses')
            throw error
          } finally {
            setLoading(false)
          }
        },

        updateInventory: async (medicationId: string, inventoryData: any) => {
          const { setLoading, setError, updateMedication } = get()
          setLoading(true)
          setError(null)

          try {
            const response = await fetch(`/api/medications/${medicationId}/inventory`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(inventoryData),
            })

            if (response.ok) {
              const updatedInventory = await response.json()
              // Update medication in store with new inventory
              const currentMedication = get().medications.find(m => m.id === medicationId)
              if (currentMedication) {
                updateMedication(medicationId, { ...currentMedication, inventory: updatedInventory })
              }
              return updatedInventory
            } else {
              const errorData = await response.json()
              throw new Error(errorData.error || 'Failed to update inventory')
            }
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to update inventory')
            throw error
          } finally {
            setLoading(false)
          }
        },

        // Utility actions
        setLoading: (loading) =>
          set({ isLoading: loading }, false, 'setLoading'),

        setError: (error) =>
          set({ error }, false, 'setError'),

        initialize: async () => {
          const { setLoading, setError, setProfile, setSettings, setMedications, setPrescriptions, setDoseLogs } = get()

          setLoading(true)
          setError(null)

          try {
    // Load user profile
    const profileResponse = await fetch('/api/profile/user')
    if (profileResponse.ok) {
      const profileData = await profileResponse.json()
      setProfile(profileData)
    } else if (profileResponse.status === 401) {
      throw new Error('User not authenticated')
    } else {
      const errorText = await profileResponse.text()
      console.error('Failed to load profile:', profileResponse.status, profileResponse.statusText, errorText)
    }

            // Load user settings
            const settingsResponse = await fetch('/api/profile/settings')
            if (settingsResponse.ok) {
              const settingsData = await settingsResponse.json()
              setSettings(settingsData)
            } else {
              const errorText = await settingsResponse.text()
              console.error('Failed to load settings:', settingsResponse.status, settingsResponse.statusText, errorText)
            }

            // Load medications
            const medicationsResponse = await fetch('/api/medications')
            if (medicationsResponse.ok) {
              const medicationsData = await medicationsResponse.json()
              setMedications(medicationsData)
            } else {
              const errorText = await medicationsResponse.text()
              console.error('Failed to load medications:', medicationsResponse.status, medicationsResponse.statusText, errorText)
            }

            // Load prescriptions
            const prescriptionsResponse = await fetch('/api/prescriptions')
            if (prescriptionsResponse.ok) {
              const prescriptionsData = await prescriptionsResponse.json()
              setPrescriptions(prescriptionsData)
            } else {
              const errorText = await prescriptionsResponse.text()
              console.error('Failed to load prescriptions:', prescriptionsResponse.status, prescriptionsResponse.statusText, errorText)
            }

            // Skip loading dose logs here - let the home page manage it
            // This prevents conflicts between different week ranges

          } catch (error) {
            console.error('Failed to initialize user data:', error)
            setError(error instanceof Error ? error.message : 'Failed to initialize user data')
          } finally {
            setLoading(false)
            set({ isInitialized: true }, false, 'initialize')
          }
        },

        reset: () =>
          set(initialState, false, 'reset'),
      }),
      {
        name: 'user-store',
        partialize: (state) => ({
          // Only persist certain parts of the state
          profile: state.profile,
          settings: state.settings,
          isInitialized: state.isInitialized,
        }),
      }
    ),
    {
      name: 'user-store',
    }
  )
)

// Selectors for common use cases
export const useUserProfile = () => useUserStore((state) => state.profile)
export const useUserSettings = () => useUserStore((state) => state.settings)
export const useMedications = () => useUserStore((state) => state.medications)
export const usePrescriptions = () => useUserStore((state) => state.prescriptions)
export const useDoseLogs = () => useUserStore((state) => state.doseLogs)
export const useUserLoading = () => useUserStore((state) => state.isLoading)
export const useUserError = () => useUserStore((state) => state.error)
