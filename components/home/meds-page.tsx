'use client'

import { LoadingSpinner } from '@/components/shared/loading-spinner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { useUserActions, useUserData } from '@/hooks/useUserStore'
import { DraftMedication, Inventory, Medication, Prescription } from '@/types/medication'
import { useEffect, useMemo, useState } from 'react'
import { MedicationDetails } from './medication-details'
import { MedicationList } from './medication-list'
import { MedicationWizard } from './medication-wizard'

interface MedsPageProps {
  timezone: string
  timeFormat: 'H12' | 'H24'
}

export function MedsPage({ timezone, timeFormat }: MedsPageProps) {
  const { medications, prescriptions, isLoading } = useUserData()
  const { updateMedication, removeMedication, initialize } = useUserActions()

  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null)
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string | null>(null)
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [medicationToDelete, setMedicationToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Group prescriptions by medicationId
  const prescriptionsByMedId = useMemo(() => {
    const map = new Map<string, (Prescription & { schedules?: any[] })[]>()
    prescriptions.forEach((rx) => {
      if (rx.medicationId) {
        const existing = map.get(rx.medicationId) || []
        map.set(rx.medicationId, [...existing, rx])
      }
    })
    return map
  }, [prescriptions])

  const handleEdit = (medication: Medication) => {
    setSelectedMedication(medication)
    setIsEditOpen(true)
  }

  const handleDelete = (medicationId: string) => {
    setMedicationToDelete(medicationId)
    setIsDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!medicationToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/medications/${medicationToDelete}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        removeMedication(medicationToDelete)
        setIsDeleteOpen(false)
        setMedicationToDelete(null)
        // Refresh data
        await initialize()
      } else {
        console.error('Failed to delete medication')
      }
    } catch (error) {
      console.error('Error deleting medication:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleViewDetails = (medication: Medication) => {
    setSelectedMedication(medication)
    setIsDetailsOpen(true)
  }

  const handleSaveEdit = async (draft: DraftMedication) => {
    if (!selectedMedication) return

    try {
      // Update medication
      const medicationResponse = await fetch(`/api/medications/${selectedMedication.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draft.name,
          brandName: draft.brandName,
          form: draft.form,
          strengthValue: draft.strengthValue,
          strengthUnit: draft.strengthUnit,
          route: draft.route,
          notes: draft.notes,
        }),
      })

      if (!medicationResponse.ok) {
        throw new Error('Failed to update medication')
      }

      const updatedMedication = await medicationResponse.json()
      updateMedication(selectedMedication.id, updatedMedication)

      // Update or create prescription
      if (selectedPrescriptionId) {
        // Update existing prescription
        const prescriptionResponse = await fetch(`/api/prescriptions/${selectedPrescriptionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            indication: draft.indication,
            asNeeded: draft.asNeeded,
            maxDailyDose: draft.maxDailyDose,
            instructions: draft.instructions,
          }),
        })

        if (!prescriptionResponse.ok) {
          console.error('Failed to update prescription')
        }
      } else {
        // Create new prescription if medication doesn't have one
        const prescriptionResponse = await fetch('/api/prescriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            medicationId: selectedMedication.id,
            indication: draft.indication,
            asNeeded: draft.asNeeded,
            maxDailyDose: draft.maxDailyDose,
            instructions: draft.instructions,
            startDate: new Date().toISOString(),
          }),
        })

        if (prescriptionResponse.ok) {
          const newPrescription = await prescriptionResponse.json()
          setSelectedPrescriptionId(newPrescription.id)
        } else {
          console.error('Failed to create prescription')
        }
      }

      // Update or create schedule (only if not asNeeded)
      if (!draft.asNeeded && selectedPrescriptionId) {
        if (selectedScheduleId) {
          // Update existing schedule
          const scheduleResponse = await fetch(`/api/schedules/${selectedScheduleId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              timezone: timezone,
              daysOfWeek: draft.daysOfWeek,
              times: draft.times,
              doseQuantity: draft.doseQuantity,
              doseUnit: draft.doseUnit,
            }),
          })

          if (!scheduleResponse.ok) {
            console.error('Failed to update schedule')
          }
        } else {
          // Create new schedule
          const scheduleResponse = await fetch(`/api/prescriptions/${selectedPrescriptionId}/schedules`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              timezone: timezone,
              daysOfWeek: draft.daysOfWeek,
              times: draft.times,
              doseQuantity: draft.doseQuantity,
              doseUnit: draft.doseUnit,
            }),
          })

          if (!scheduleResponse.ok) {
            console.error('Failed to create schedule')
          }
        }
      }

      // Update or create inventory
      const inventoryResponse = await fetch(`/api/medications/${selectedMedication.id}/inventory`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentQty: draft.inventoryCurrentQty ?? 0,
          unit: draft.inventoryUnit || 'TAB',
          lowThreshold: draft.inventoryLowThreshold,
          lastRestockedAt: draft.inventoryLastRestockedAt,
        }),
      })

      if (!inventoryResponse.ok) {
        console.error('Failed to update inventory')
      }

      setIsEditOpen(false)
      setSelectedMedication(null)
      setSelectedPrescriptionId(null)
      setSelectedScheduleId(null)
      // Refresh data
      await initialize()
    } catch (error) {
      console.error('Error updating medication:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const medicationForDetails = selectedMedication
    ? (medications.find((m) => m.id === selectedMedication.id) as
        | (Medication & { inventory?: Inventory | null })
        | undefined)
    : null

  // Collect all data for editing medication
  const editInitialData = useMemo(() => {
    if (!selectedMedication || !isEditOpen) return null

    const medication = medications.find((m) => m.id === selectedMedication.id)
    if (!medication) return null

    // Get prescriptions for this medication
    const medPrescriptions = prescriptionsByMedId.get(medication.id) || []
    // Find the first (or most recent) prescription
    const prescription =
      medPrescriptions.length > 0
        ? medPrescriptions.sort((a, b) => {
            // Sort by startDate descending to get the most recent
            const aDate = new Date(a.startDate).getTime()
            const bDate = new Date(b.startDate).getTime()
            return bDate - aDate
          })[0]
        : null

    // Get the first schedule from the prescription
    const schedule = prescription?.schedules && prescription.schedules.length > 0 ? prescription.schedules[0] : null

    // Get inventory data
    const inventory = medication.inventory || null

    // Build initial data object
    return {
      // Medication data
      name: medication.name,
      brandName: medication.brandName || undefined,
      form: medication.form,
      strengthValue: medication.strengthValue ? Number(medication.strengthValue) : undefined,
      strengthUnit: medication.strengthUnit || undefined,
      route: medication.route || undefined,
      notes: medication.notes || undefined,
      // Prescription data
      asNeeded: prescription?.asNeeded ?? false,
      indication: prescription?.indication || undefined,
      instructions: prescription?.instructions || undefined,
      maxDailyDose: prescription?.maxDailyDose ? Number(prescription.maxDailyDose) : undefined,
      // Schedule data
      daysOfWeek: schedule?.daysOfWeek || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      times: schedule?.times || [],
      doseQuantity: schedule?.doseQuantity ? Number(schedule.doseQuantity) : 1,
      doseUnit: schedule?.doseUnit || 'TAB',
      // Inventory data
      inventoryCurrentQty: inventory?.currentQty ? Number(inventory.currentQty) : 30,
      inventoryUnit: inventory?.unit || schedule?.doseUnit || 'TAB',
      inventoryLowThreshold: inventory?.lowThreshold ? Number(inventory.lowThreshold) : 10,
      inventoryLastRestockedAt: inventory?.lastRestockedAt || undefined,
    }
  }, [selectedMedication, medications, prescriptionsByMedId, isEditOpen])

  // Store prescription and schedule IDs when edit data is prepared
  useEffect(() => {
    if (!selectedMedication || !isEditOpen) {
      setSelectedPrescriptionId(null)
      setSelectedScheduleId(null)
      return
    }

    const medication = medications.find((m) => m.id === selectedMedication.id)
    if (!medication) {
      setSelectedPrescriptionId(null)
      setSelectedScheduleId(null)
      return
    }

    const medPrescriptions = prescriptionsByMedId.get(medication.id) || []
    const prescription =
      medPrescriptions.length > 0
        ? medPrescriptions.sort((a, b) => {
            const aDate = new Date(a.startDate).getTime()
            const bDate = new Date(b.startDate).getTime()
            return bDate - aDate
          })[0]
        : null

    const schedule = prescription?.schedules && prescription.schedules.length > 0 ? prescription.schedules[0] : null

    setSelectedPrescriptionId(prescription?.id || null)
    setSelectedScheduleId(schedule?.id || null)
  }, [selectedMedication, medications, prescriptionsByMedId, isEditOpen])

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#F8FAFC] to-[#E2E8F0] pb-[88px]">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">My Medications</h1>
            <p className="text-sm text-[#64748B]">
              {medications.length} medication{medications.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Medications List */}
      <div className="px-4 mt-4">
        <MedicationList
          medications={medications}
          prescriptions={prescriptions}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewDetails={handleViewDetails}
        />
      </div>

      {/* Medication Details Dialog */}
      {medicationForDetails && (
        <MedicationDetails
          medication={medicationForDetails}
          prescriptions={prescriptionsByMedId.get(medicationForDetails.id) || []}
          timeFormat={timeFormat}
          open={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false)
            setSelectedMedication(null)
          }}
          onEdit={() => {
            setIsDetailsOpen(false)
            handleEdit(medicationForDetails)
          }}
        />
      )}

      {/* Edit Medication Drawer */}
      {selectedMedication && isEditOpen && editInitialData && (
        <Drawer open={isEditOpen} onOpenChange={setIsEditOpen} direction="bottom">
          <DrawerContent className="p-0">
            <MedicationWizard
              mode="edit"
              initial={editInitialData}
              onClose={() => {
                setIsEditOpen(false)
                setSelectedMedication(null)
                setSelectedPrescriptionId(null)
                setSelectedScheduleId(null)
              }}
              onSaved={handleSaveEdit}
              timezone={timezone}
              timeFormat={timeFormat}
            />
          </DrawerContent>
        </Drawer>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medication?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the medication and all associated prescriptions and dose logs. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
