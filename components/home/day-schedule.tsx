'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatHumanDate, toLocalHM } from '@/lib/medication-utils'
import { DoseLog, DoseStatus, TimeFormat } from '@/types/medication'
import { AlarmClock, Check, Clock, Pill, X } from 'lucide-react'

interface DayScheduleProps {
  dayLogs: DoseLog[]
  timeFormat: TimeFormat
  onTakeDose: (doseLogId: string) => void
  onSkipDose: (doseLogId: string) => void
  onSnoozeDose: (doseLog: DoseLog) => void
  getMedicationName: (medicationId: string) => string
  getPrescription: (prescriptionId: string) => any
  canInteractWithDose: (doseLog: DoseLog) => boolean
  getStatusByDay: (doseLog: DoseLog) => DoseStatus
  selectedDate: Date
}

export function DaySchedule({
  dayLogs,
  timeFormat,
  onTakeDose,
  onSkipDose,
  onSnoozeDose,
  getMedicationName,
  getPrescription,
  canInteractWithDose,
  getStatusByDay,
  selectedDate,
}: DayScheduleProps) {
  return (
    <div className="px-4 mt-5 mb-28">
      <h3 className="text-sm font-semibold text-[#0F172A] mb-2">Doses on {formatHumanDate(selectedDate)}</h3>

      {dayLogs.length === 0 ? (
        <div className="text-center text-[#64748B] text-sm bg-white border border-[#E2E8F0] rounded-xl p-6">
          No doses for this day.
        </div>
      ) : (
        <div className="space-y-3">
          {dayLogs.map((dl) => {
            const uiStatus = getStatusByDay(dl)
            const actionable = canInteractWithDose(dl)
            const rx = getPrescription(dl.prescriptionId)
            const medName = rx?.medicationId
              ? getMedicationName(rx.medicationId)
              : (dl as any).prescription?.medication?.name || `Unknown Medication (${dl.prescriptionId.slice(-6)})`

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
                      <div className="font-semibold text-[#0F172A]">{medName}</div>
                      {(rx?.asNeeded ?? (dl as any).prescription?.asNeeded) ? (
                        <Badge variant="secondary">PRN</Badge>
                      ) : (
                        <Badge variant="outline">{toLocalHM(dl.scheduledFor, timeFormat)}</Badge>
                      )}
                    </div>
                    <div className="text-xs text-[#64748B]">
                      {rx?.instructions ??
                        (dl as any).prescription?.instructions ??
                        (`${dl.quantity ?? ''} ${dl.unit ?? ''}`.trim() || 'No instructions available')}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <StatusBadge status={uiStatus} />
                      {uiStatus === 'TAKEN' && dl.takenAt && (
                        <span className="inline-flex items-center gap-1 text-xs text-[#64748B]">
                          <Clock className="w-3 h-3" />
                          Taken: {toLocalHM(dl.takenAt, timeFormat)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {actionable && dl.status !== 'TAKEN' && (
                    <Button variant="pillmindGhost" size="sm" onClick={() => onTakeDose(dl.id)} className="rounded-xl">
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                  {actionable && dl.status === 'SCHEDULED' && (
                    <Button
                      variant="pillmindGhost"
                      size="sm"
                      onClick={() => onSnoozeDose(dl)}
                      className="rounded-xl"
                      title="Snooze"
                    >
                      <AlarmClock className="w-4 h-4" />
                    </Button>
                  )}
                  {actionable && dl.status !== 'TAKEN' && (
                    <Button variant="pillmindGhost" size="sm" onClick={() => onSkipDose(dl.id)} className="rounded-xl">
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
  )
}

function StatusBadge({ status }: { status: DoseStatus }) {
  if (status === 'TAKEN') return <Badge variant="success">Taken</Badge>
  if (status === 'MISSED') return <Badge variant="destructive">Missed</Badge>
  if (status === 'SKIPPED') return <Badge variant="secondary">Skipped</Badge>
  return <Badge variant="outline">Scheduled</Badge>
}
