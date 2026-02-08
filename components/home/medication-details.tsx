'use client'

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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { weekdayLabelShort } from '@/lib/medication-utils'
import { Inventory, Medication, Prescription, Schedule } from '@/types/medication'
import { format, parseISO } from 'date-fns'
import { AlertCircle, Calendar, Clock, Edit, Pill, Plus, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { PrescriptionEditDialog } from './prescription-edit-dialog'
import { ScheduleAddDialog } from './schedule-add-dialog'
import { ScheduleEditDialog } from './schedule-edit-dialog'

interface MedicationDetailsProps {
  medication: Medication & { inventory?: Inventory | null }
  prescriptions: (Prescription & { schedules?: Schedule[]; medication?: Medication | null })[]
  timeFormat: 'H12' | 'H24'
  timezone: string
  open?: boolean
  onClose: () => void
  onEdit: () => void
  onPrescriptionDeleted?: () => void
}

export function MedicationDetails({
  medication,
  prescriptions,
  timeFormat,
  timezone,
  open = true,
  onClose,
  onEdit,
  onPrescriptionDeleted,
}: MedicationDetailsProps) {
  const [prescriptionToDelete, setPrescriptionToDelete] = useState<string | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const isDeletingRef = useRef(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [addingScheduleForPrescription, setAddingScheduleForPrescription] = useState<string | null>(null)
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null)

  const activePrescriptions = prescriptions.filter((rx) => !rx.endDate || new Date(rx.endDate) > new Date())

  const strengthDisplay =
    medication.strengthValue && medication.strengthUnit
      ? `${medication.strengthValue} ${medication.strengthUnit}`
      : null

  const handleDeletePrescription = (prescriptionId: string) => {
    setPrescriptionToDelete(prescriptionId)
    setIsDeleteOpen(true)
  }

  const confirmDeletePrescription = async () => {
    if (!prescriptionToDelete || isDeletingRef.current) return

    // Set ref immediately to prevent duplicate calls
    isDeletingRef.current = true
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/prescriptions/${prescriptionToDelete}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Prescription deleted successfully', {
          id: 'delete-prescription-success',
        })
        setIsDeleteOpen(false)
        setPrescriptionToDelete(null)
        // Refresh data
        if (onPrescriptionDeleted) {
          onPrescriptionDeleted()
        }
      } else {
        // Parse error response
        let errorMessage = 'Failed to delete prescription'
        const contentType = response.headers.get('content-type')

        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } catch (parseError) {
            console.error('Failed to parse JSON error response:', parseError)
          }
        } else {
          try {
            const text = await response.text()
            errorMessage = text || errorMessage
          } catch (textError) {
            console.error('Failed to parse text error response:', textError)
          }
        }

        // Show toast notification with unique ID to prevent duplicates
        toast.error(errorMessage, {
          id: 'delete-prescription-error',
        })
        console.error('Failed to delete prescription:', errorMessage)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      toast.error('Error deleting prescription', {
        id: 'delete-prescription-error',
        description: errorMessage,
      })
      console.error('Error deleting prescription:', error)
    } finally {
      isDeletingRef.current = false
      setIsDeleting(false)
    }
  }

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    confirmDeletePrescription()
  }

  return (
    <Drawer open={open} onOpenChange={onClose} direction="bottom">
      <DrawerContent className="w-full sm:max-w-2xl flex flex-col max-h-[90vh] p-0">
        {/* Fixed Header */}
        <DrawerHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-[#E2E8F0]">
          <DrawerTitle className="flex items-center gap-2 text-left">
            <Pill className="w-5 h-5 text-[#0EA8BC]" />
            {medication.name}
          </DrawerTitle>
        </DrawerHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-[#0F172A]">Basic Information</h3>
            <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-2 text-sm">
              {medication.brandName && (
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Brand name:</span>
                  <span className="font-medium text-[#0F172A]">{medication.brandName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#64748B]">Form:</span>
                <span className="font-medium text-[#0F172A] capitalize">{medication.form.toLowerCase()}</span>
              </div>
              {strengthDisplay && (
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Strength:</span>
                  <span className="font-medium text-[#0F172A]">{strengthDisplay}</span>
                </div>
              )}
              {medication.route && (
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Route:</span>
                  <span className="font-medium text-[#0F172A] capitalize">{medication.route.toLowerCase()}</span>
                </div>
              )}
              {medication.notes && (
                <div className="pt-2 border-t border-[#E2E8F0]">
                  <span className="text-[#64748B]">Notes:</span>
                  <p className="text-[#0F172A] mt-1">{medication.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Inventory */}
          {medication.inventory && (
            <div className="space-y-3">
              <h3 className="font-semibold text-[#0F172A]">Inventory</h3>
              <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Current quantity:</span>
                  <span className="font-medium text-[#0F172A]">
                    {medication.inventory.currentQty} {medication.inventory.unit}
                  </span>
                </div>
                {medication.inventory.lowThreshold != null && (
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Low threshold:</span>
                    <span className="font-medium text-[#0F172A]">
                      {medication.inventory.lowThreshold} {medication.inventory.unit}
                    </span>
                  </div>
                )}
                {medication.inventory.lastRestockedAt && (
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Last restocked:</span>
                    <span className="font-medium text-[#0F172A]">
                      {format(parseISO(medication.inventory.lastRestockedAt), 'PPP')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Prescriptions */}
          <div className="space-y-3">
            <h3 className="font-semibold text-[#0F172A]">Prescriptions ({activePrescriptions.length} active)</h3>

            {activePrescriptions.length === 0 ? (
              <div className="bg-[#F8FAFC] rounded-xl p-4 text-center text-sm text-[#64748B]">
                No active prescriptions
              </div>
            ) : (
              <div className="space-y-3">
                {activePrescriptions.map((rx) => (
                  <div key={rx.id} className="bg-[#F8FAFC] rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {rx.asNeeded && <Badge variant="secondary">PRN</Badge>}
                          {rx.indication && (
                            <Badge variant="outline" className="text-xs">
                              {rx.indication}
                            </Badge>
                          )}
                        </div>
                        {rx.instructions && <p className="text-sm text-[#0F172A] mb-2">{rx.instructions}</p>}
                        <div className="text-xs text-[#64748B] space-y-1">
                          {rx.startDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Started: {format(parseISO(rx.startDate), 'PPP')}
                            </div>
                          )}
                          {rx.endDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Ends: {format(parseISO(rx.endDate), 'PPP')}
                            </div>
                          )}
                          {rx.maxDailyDose && (
                            <div className="flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Max daily: {rx.maxDailyDose}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setEditingPrescription(rx)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeletePrescription(rx.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Schedules */}
                    <div className="pt-3 border-t border-[#E2E8F0]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-[#64748B]">
                          Schedules ({rx.schedules?.length || 0}):
                        </div>
                        {(!rx.endDate || new Date(rx.endDate) > new Date()) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setAddingScheduleForPrescription(rx.id)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Schedule
                          </Button>
                        )}
                      </div>
                      {rx.schedules && rx.schedules.length > 0 && (
                        <div className="space-y-2">
                          {rx.schedules.map((schedule) => (
                            <div key={schedule.id} className="bg-white rounded-lg p-3 border border-[#E2E8F0]">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3 h-3 text-[#64748B]" />
                                  <span className="text-xs font-medium text-[#0F172A]">
                                    {schedule.doseQuantity} {schedule.doseUnit}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => {
                                      setEditingSchedule(schedule)
                                    }}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                    onClick={async () => {
                                      if (confirm('Are you sure you want to delete this schedule?')) {
                                        try {
                                          const res = await fetch(`/api/schedules/${schedule.id}`, {
                                            method: 'DELETE',
                                          })
                                          if (res.ok) {
                                            toast.success('Schedule deleted')
                                            // Refresh the component
                                            if (onPrescriptionDeleted) {
                                              await onPrescriptionDeleted()
                                            }
                                          } else {
                                            const error = await res.json()
                                            toast.error(error.error || 'Failed to delete schedule')
                                          }
                                        } catch (e) {
                                          toast.error('Failed to delete schedule')
                                        }
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {schedule.daysOfWeek.map((day) => (
                                  <Badge key={day} variant="outline" className="text-xs">
                                    {weekdayLabelShort[day]}
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {schedule.times.map((time) => (
                                  <Badge key={time} variant="secondary" className="text-xs">
                                    {timeFormat === 'H12' ? format(parseISO(`2000-01-01T${time}:00`), 'h:mm a') : time}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {(!rx.schedules || rx.schedules.length === 0) && (
                        <div className="text-xs text-[#64748B] py-2">No schedules yet</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer with Actions */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-[#E2E8F0] bg-white">
          <div className="flex gap-2">
            <Button variant="pillmind" className="flex-1" onClick={onEdit}>
              Edit Medication
            </Button>
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DrawerContent>

      {/* Delete Prescription Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prescription?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this prescription and all associated schedules and dose logs. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Schedule Edit Dialog */}
      {editingSchedule && (
        <ScheduleEditDialog
          schedule={editingSchedule}
          open={!!editingSchedule}
          onClose={() => setEditingSchedule(null)}
          onSaved={async () => {
            if (onPrescriptionDeleted) {
              await onPrescriptionDeleted()
            }
          }}
          timezone={timezone}
          timeFormat={timeFormat}
        />
      )}

      {/* Schedule Add Dialog */}
      {addingScheduleForPrescription && (
        <ScheduleAddDialog
          prescriptionId={addingScheduleForPrescription}
          open={!!addingScheduleForPrescription}
          onClose={() => setAddingScheduleForPrescription(null)}
          onSaved={async () => {
            if (onPrescriptionDeleted) {
              await onPrescriptionDeleted()
            }
          }}
          timezone={timezone}
          timeFormat={timeFormat}
        />
      )}

      {/* Prescription Edit Dialog */}
      {editingPrescription && (
        <PrescriptionEditDialog
          prescription={editingPrescription}
          open={!!editingPrescription}
          onClose={() => setEditingPrescription(null)}
          onSaved={async () => {
            if (onPrescriptionDeleted) {
              await onPrescriptionDeleted()
            }
          }}
        />
      )}
    </Drawer>
  )
}
