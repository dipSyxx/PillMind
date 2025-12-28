'use client'

import React from 'react'
import { LogEntry } from './log-entry'
import { DoseLog, TimeFormat } from '@/types/medication'
import { parseISO, compareDesc } from 'date-fns'

interface LogsTimelineProps {
  doseLogs: DoseLog[]
  getMedicationName: (medicationId: string) => string
  timeFormat: TimeFormat
  timezone: string
}

export function LogsTimeline({
  doseLogs,
  getMedicationName,
  timeFormat,
  timezone,
}: LogsTimelineProps) {
  // Sort logs by scheduledFor date (newest first)
  const sortedLogs = React.useMemo(() => {
    return [...doseLogs].sort((a, b) => compareDesc(parseISO(a.scheduledFor), parseISO(b.scheduledFor)))
  }, [doseLogs])

  if (sortedLogs.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-[#E2E8F0] rounded-2xl">
        <p className="text-[#64748B] text-sm">No dose logs found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sortedLogs.map((doseLog) => {
        const medicationId = doseLog.prescription?.medicationId || ''
        const medicationName = medicationId
          ? getMedicationName(medicationId)
          : doseLog.prescription?.medication?.name || `Unknown Medication (${doseLog.prescriptionId.slice(-6)})`

        return (
          <LogEntry
            key={doseLog.id}
            doseLog={doseLog}
            medicationName={medicationName}
            timeFormat={timeFormat}
            timezone={timezone}
          />
        )
      })}
    </div>
  )
}

