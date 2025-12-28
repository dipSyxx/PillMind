'use client'

import React, { useState, useMemo } from 'react'
import { Plus, Pill } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer'
import { MedicationList } from './medication-list'
import { MedicationDetails } from './medication-details'
import { MedicationWizard } from './medication-wizard'
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
import { Medication, Inventory, Prescription, UserSettings, DraftMedication } from '@/types/medication'
import { useUserData, useUserActions } from '@/hooks/useUserStore'
import { LoadingSpinner } from '@/components/shared/loading-spinner'

interface MedsPageProps {
  timezone: string
  timeFormat: 'H12' | 'H24'
}

export function MedsPage({ timezone, timeFormat }: MedsPageProps) {
  const { medications, prescriptions, isLoading } = useUserData()
  const { updateMedication, removeMedication, initialize } = useUserActions()

  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null)
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
      const response = await fetch(`/api/medications/${selectedMedication.id}`, {
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

      if (response.ok) {
        const updated = await response.json()
        updateMedication(selectedMedication.id, updated)
        setIsEditOpen(false)
        setSelectedMedication(null)
        // Refresh data
        await initialize()
      }
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
      {selectedMedication && isEditOpen && (
        <Drawer open={isEditOpen} onOpenChange={setIsEditOpen} direction="bottom">
          <DrawerContent className="p-0">
            <MedicationWizard
              mode="edit"
              initial={{
                name: selectedMedication.name,
                brandName: selectedMedication.brandName || undefined,
                form: selectedMedication.form,
                strengthValue: selectedMedication.strengthValue || undefined,
                strengthUnit: selectedMedication.strengthUnit || undefined,
                route: selectedMedication.route || undefined,
                notes: selectedMedication.notes || undefined,
                asNeeded: false,
                daysOfWeek: [],
                times: [],
              }}
              onClose={() => {
                setIsEditOpen(false)
                setSelectedMedication(null)
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
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

