'use client'

import { Badge } from '@/components/ui/badge'
import { useUserSettings } from '@/stores/user-store'
import { ListChecks } from 'lucide-react'

interface WeeklySummaryProps {
  taken: number
  scheduled: number
  missed: number
  skipped: number
  adherence: number
}

export function WeeklySummary({ taken, scheduled, missed, skipped, adherence }: WeeklySummaryProps) {
  const settings = useUserSettings()
  const totalDoses = taken + scheduled + missed + skipped
  const actionableDoses = taken + missed + skipped
  const hasActionableDoses = actionableDoses > 0
  const isValidAdherence = !isNaN(adherence) && isFinite(adherence)

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-[#0EA8BC]" />
          <h3 className="font-semibold text-[#0F172A]">Weekly Summary</h3>
        </div>
        <Badge
          variant={
            totalDoses === 0
              ? 'secondary'
              : !hasActionableDoses || !isValidAdherence
                ? 'secondary'
                : adherence >= 85
                  ? 'success'
                  : adherence >= 60
                    ? 'warning'
                    : 'destructive'
          }
        >
          {totalDoses === 0
            ? 'No doses'
            : !hasActionableDoses || !isValidAdherence
              ? 'Pending'
              : `${adherence}% adherence`}
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
          <div
            className="h-full bg-[#0EA8BC]"
            style={{ width: `${hasActionableDoses && isValidAdherence ? adherence : 0}%` }}
          />
        </div>
      </div>
      <p className="text-xs text-[#64748B] mt-2">
        {totalDoses === 0
          ? 'No medications scheduled for this week. Add medications to start tracking adherence.'
          : !hasActionableDoses || !isValidAdherence
            ? 'Doses are scheduled for this week. Adherence will be calculated as you take or miss doses.'
            : 'Aim for consistent intake to keep adherence above 85%.'}
      </p>
    </div>
  )
}
