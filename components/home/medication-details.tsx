'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { weekdayLabelShort } from '@/lib/medication-utils'
import { Inventory, Medication, Prescription, Schedule } from '@/types/medication'
import { format, parseISO } from 'date-fns'
import { AlertCircle, Calendar, Clock, Pill } from 'lucide-react'

interface MedicationDetailsProps {
  medication: Medication & { inventory?: Inventory | null }
  prescriptions: (Prescription & { schedules?: Schedule[]; medication?: Medication | null })[]
  timeFormat: 'H12' | 'H24'
  open?: boolean
  onClose: () => void
  onEdit: () => void
}

export function MedicationDetails({
  medication,
  prescriptions,
  timeFormat,
  open = true,
  onClose,
  onEdit,
}: MedicationDetailsProps) {
  const activePrescriptions = prescriptions.filter((rx) => !rx.endDate || new Date(rx.endDate) > new Date())

  const strengthDisplay =
    medication.strengthValue && medication.strengthUnit
      ? `${medication.strengthValue} ${medication.strengthUnit}`
      : null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-[#0EA8BC]" />
            {medication.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
                    </div>

                    {/* Schedules */}
                    {rx.schedules && rx.schedules.length > 0 && (
                      <div className="pt-3 border-t border-[#E2E8F0]">
                        <div className="text-xs font-medium text-[#64748B] mb-2">Schedules:</div>
                        <div className="space-y-2">
                          {rx.schedules.map((schedule) => (
                            <div key={schedule.id} className="bg-white rounded-lg p-3 border border-[#E2E8F0]">
                              <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-3 h-3 text-[#64748B]" />
                                <span className="text-xs font-medium text-[#0F172A]">
                                  {schedule.doseQuantity} {schedule.doseUnit}
                                </span>
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
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-[#E2E8F0]">
            <Button variant="pillmind" className="flex-1" onClick={onEdit}>
              Edit Medication
            </Button>
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
