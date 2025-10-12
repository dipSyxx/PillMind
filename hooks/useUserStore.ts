import { useEffect } from 'react'
import { useUserStore } from '@/stores/user-store'

/**
 * Hook to initialize and manage user store
 * Should be used in the root layout or app component
 */
export function useUserStoreInit() {
  const { initialize, isInitialized, isLoading } = useUserStore()

  useEffect(() => {
    if (!isInitialized && !isLoading) {
      initialize()
    }
  }, [initialize, isInitialized, isLoading])

  return {
    isInitialized,
    isLoading,
  }
}

/**
 * Hook to get user data with loading state
 */
export function useUserData() {
  const profile = useUserStore((state) => state.profile)
  const settings = useUserStore((state) => state.settings)
  const medications = useUserStore((state) => state.medications)
  const prescriptions = useUserStore((state) => state.prescriptions)
  const doseLogs = useUserStore((state) => state.doseLogs)
  const isLoading = useUserStore((state) => state.isLoading)
  const error = useUserStore((state) => state.error)
  const isInitialized = useUserStore((state) => state.isInitialized)

  return {
    profile,
    settings,
    medications,
    prescriptions,
    doseLogs,
    isLoading,
    error,
    isInitialized,
  }
}

/**
 * Hook to get user actions
 */
export function useUserActions() {
  const setProfile = useUserStore((state) => state.setProfile)
  const updateProfile = useUserStore((state) => state.updateProfile)
  const setSettings = useUserStore((state) => state.setSettings)
  const updateSettings = useUserStore((state) => state.updateSettings)
  const setMedications = useUserStore((state) => state.setMedications)
  const addMedication = useUserStore((state) => state.addMedication)
  const updateMedication = useUserStore((state) => state.updateMedication)
  const removeMedication = useUserStore((state) => state.removeMedication)
  const setPrescriptions = useUserStore((state) => state.setPrescriptions)
  const addPrescription = useUserStore((state) => state.addPrescription)
  const updatePrescription = useUserStore((state) => state.updatePrescription)
  const removePrescription = useUserStore((state) => state.removePrescription)
  const setDoseLogs = useUserStore((state) => state.setDoseLogs)
  const addDoseLog = useUserStore((state) => state.addDoseLog)
  const updateDoseLog = useUserStore((state) => state.updateDoseLog)
  const removeDoseLog = useUserStore((state) => state.removeDoseLog)
  const setLoading = useUserStore((state) => state.setLoading)
  const setError = useUserStore((state) => state.setError)
  const reset = useUserStore((state) => state.reset)
  const initialize = useUserStore((state) => state.initialize)
  const createMedication = useUserStore((state) => state.createMedication)
  const createPrescription = useUserStore((state) => state.createPrescription)
  const generateDoses = useUserStore((state) => state.generateDoses)
  const updateInventory = useUserStore((state) => state.updateInventory)

  return {
    setProfile,
    updateProfile,
    setSettings,
    updateSettings,
    setMedications,
    addMedication,
    updateMedication,
    removeMedication,
    setPrescriptions,
    addPrescription,
    updatePrescription,
    removePrescription,
    setDoseLogs,
    addDoseLog,
    updateDoseLog,
    removeDoseLog,
    createMedication,
    createPrescription,
    generateDoses,
    updateInventory,
    setLoading,
    setError,
    reset,
    initialize,
  }
}
