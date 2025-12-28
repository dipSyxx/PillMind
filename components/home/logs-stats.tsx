'use client'

import React from 'react'
import { TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DoseLog, DoseStatus } from '@/types/medication'
import { cn } from '@/lib/utils'

interface LogsStatsProps {
  doseLogs: DoseLog[]
  dateRange?: { from: Date | undefined; to: Date | undefined }
}

export function LogsStats({ doseLogs, dateRange }: LogsStatsProps) {
  // Filter logs by date range if provided
  const filteredLogs = React.useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return doseLogs

    return doseLogs.filter((log) => {
      const logDate = new Date(log.scheduledFor)
      return logDate >= dateRange.from! && logDate <= dateRange.to!
    })
  }, [doseLogs, dateRange])

  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = filteredLogs.length
    const taken = filteredLogs.filter((log) => log.status === 'TAKEN').length
    const missed = filteredLogs.filter((log) => log.status === 'MISSED').length
    const skipped = filteredLogs.filter((log) => log.status === 'SKIPPED').length
    const scheduled = filteredLogs.filter((log) => log.status === 'SCHEDULED').length

    // Adherence = (taken / (taken + missed + skipped)) * 100
    // Only count non-scheduled doses
    const actionable = taken + missed + skipped
    const adherence = actionable > 0 ? Math.round((taken / actionable) * 100) : 0

    return {
      total,
      taken,
      missed,
      skipped,
      scheduled,
      adherence,
    }
  }, [filteredLogs])

  if (stats.total === 0) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 text-center">
        <p className="text-sm text-[#64748B]">No dose logs in the selected period.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 space-y-4">
      {/* Adherence */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#0EA8BC]" />
          <span className="font-semibold text-[#0F172A]">Adherence</span>
        </div>
        <Badge
          variant={
            stats.adherence >= 85
              ? 'success'
              : stats.adherence >= 60
                ? 'warning'
                : stats.adherence > 0
                  ? 'destructive'
                  : 'secondary'
          }
          className="text-base px-3 py-1"
        >
          {stats.adherence}%
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all',
            stats.adherence >= 85
              ? 'bg-green-500'
              : stats.adherence >= 60
                ? 'bg-yellow-500'
                : stats.adherence > 0
                  ? 'bg-red-500'
                  : 'bg-slate-300',
          )}
          style={{ width: `${stats.adherence}%` }}
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#F8FAFC] rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-xs text-[#64748B]">Taken</span>
          </div>
          <div className="text-2xl font-bold text-[#0F172A]">{stats.taken}</div>
        </div>

        <div className="bg-[#F8FAFC] rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-xs text-[#64748B]">Missed</span>
          </div>
          <div className="text-2xl font-bold text-[#0F172A]">{stats.missed}</div>
        </div>

        <div className="bg-[#F8FAFC] rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-slate-600" />
            <span className="text-xs text-[#64748B]">Skipped</span>
          </div>
          <div className="text-2xl font-bold text-[#0F172A]">{stats.skipped}</div>
        </div>

        <div className="bg-[#F8FAFC] rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-[#64748B]" />
            <span className="text-xs text-[#64748B]">Scheduled</span>
          </div>
          <div className="text-2xl font-bold text-[#0F172A]">{stats.scheduled}</div>
        </div>
      </div>

      {/* Total */}
      <div className="pt-3 border-t border-[#E2E8F0] text-center">
        <span className="text-sm text-[#64748B]">
          Total: <span className="font-semibold text-[#0F172A]">{stats.total}</span> doses
        </span>
      </div>
    </div>
  )
}

