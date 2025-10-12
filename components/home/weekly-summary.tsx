'use client'

import React from 'react'
import { ListChecks } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useUserSettings } from '@/stores/user-store'

interface WeeklySummaryProps {
  taken: number
  scheduled: number
  missed: number
  skipped: number
  adherence: number
}

export function WeeklySummary({ taken, scheduled, missed, skipped, adherence }: WeeklySummaryProps) {
  const settings = useUserSettings()
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-[#0EA8BC]" />
          <h3 className="font-semibold text-[#0F172A]">Weekly Summary</h3>
        </div>
        <Badge
          variant={
            taken + scheduled + missed + skipped === 0
              ? 'secondary'
              : adherence >= 85
                ? 'success'
                : adherence >= 60
                  ? 'warning'
                  : 'destructive'
          }
        >
          {taken + scheduled + missed + skipped === 0 ? 'No doses' : `${adherence}% adherence`}
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="rounded-lg bg-[#F8FAFC] p-2">
          <div className="text-xs text-[#64748B]">Taken</div>
          <div className="text-lg font-bold">{taken}</div>
        </div>
        <div className="rounded-lg bg-[#F8FAFC] p-2">
          <div className="text-xs text-[#64748B]">Scheduled</div>
          <div className="text-lg font-bold">{scheduled}</div>
        </div>
        <div className="rounded-lg bg-[#F8FAFC] p-2">
          <div className="text-xs text-[#64748B]">Missed</div>
          <div className="text-lg font-bold">{missed}</div>
        </div>
        <div className="rounded-lg bg-[#F8FAFC] p-2">
          <div className="text-xs text-[#64748B]">Skipped</div>
          <div className="text-lg font-bold">{skipped}</div>
        </div>
      </div>

      {/* Simple progress bar */}
      <div className="mt-3">
        <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
          <div className="h-full bg-[#0EA8BC]" style={{ width: `${adherence}%` }} />
        </div>
      </div>
      <p className="text-xs text-[#64748B] mt-2">
        {taken + scheduled + missed + skipped === 0
          ? 'No medications scheduled for this week. Add medications to start tracking adherence.'
          : 'Aim for consistent intake to keep adherence above 85%.'}
      </p>
    </div>
  )
}
