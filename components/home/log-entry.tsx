'use client'

import React from 'react'
import { Pill, Clock, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DoseLog, DoseStatus, TimeFormat } from '@/types/medication'
import { toLocalHM, formatHumanDate } from '@/lib/medication-utils'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

interface LogEntryProps {
  doseLog: DoseLog
  medicationName: string
  timeFormat: TimeFormat
  timezone: string
}

function StatusBadge({ status }: { status: DoseStatus }) {
  if (status === 'TAKEN') return <Badge variant="success">Taken</Badge>
  if (status === 'MISSED') return <Badge variant="destructive">Missed</Badge>
  if (status === 'SKIPPED') return <Badge variant="secondary">Skipped</Badge>
  return <Badge variant="outline">Scheduled</Badge>
}

export function LogEntry({ doseLog, medicationName, timeFormat, timezone }: LogEntryProps) {
  const scheduledDate = parseISO(doseLog.scheduledFor)
  const takenDate = doseLog.takenAt ? parseISO(doseLog.takenAt) : null

  const isPRN = doseLog.prescription?.asNeeded ?? false
  const instructions =
    doseLog.prescription?.instructions ||
    (doseLog.quantity && doseLog.unit ? `${doseLog.quantity} ${doseLog.unit}` : null) ||
    'No instructions'

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            'w-12 h-12 rounded-xl grid place-items-center flex-shrink-0',
            doseLog.status === 'TAKEN'
              ? 'bg-green-50 border border-green-200'
              : doseLog.status === 'MISSED'
                ? 'bg-red-50 border border-red-200'
                : doseLog.status === 'SKIPPED'
                  ? 'bg-slate-100 border border-slate-300'
                  : 'bg-[#0EA8BC]/10 border border-[#0EA8BC]/20',
          )}
        >
          <Pill
            className={cn(
              'w-6 h-6',
              doseLog.status === 'TAKEN'
                ? 'text-green-600'
                : doseLog.status === 'MISSED'
                  ? 'text-red-600'
                  : doseLog.status === 'SKIPPED'
                    ? 'text-slate-600'
                    : 'text-[#0EA8BC]',
            )}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-[#0F172A]">{medicationName}</h3>
            {isPRN && <Badge variant="secondary">PRN</Badge>}
            <StatusBadge status={doseLog.status} />
          </div>

          <p className="text-sm text-[#64748B] mb-2">{instructions}</p>

          {/* Date and time info */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B]">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatHumanDate(scheduledDate)}</span>
            </div>
            {!isPRN && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Scheduled: {toLocalHM(doseLog.scheduledFor, timeFormat)}</span>
              </div>
            )}
            {takenDate && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Taken: {toLocalHM(doseLog.takenAt!, timeFormat)}</span>
              </div>
            )}
          </div>

          {/* Prescription info */}
          {doseLog.prescription?.indication && (
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                {doseLog.prescription.indication}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

