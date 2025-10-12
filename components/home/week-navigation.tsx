'use client'

import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  addDays,
  formatDayKey,
  formatHumanDate,
  isSameDay,
  startOfWeek,
  weekdayFromDate,
  weekdayLabelShort,
} from '@/lib/medication-utils'
import { format } from 'date-fns'

interface WeekNavigationProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
  dayProgress: (date: Date) => number
}

export function WeekNavigation({ selectedDate, onDateChange, dayProgress }: WeekNavigationProps) {
  const weekStart = startOfWeek(selectedDate)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="px-3">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="pillmindWhite"
            size="sm"
            onClick={() => onDateChange(addDays(selectedDate, -7))}
            className="rounded-xl"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-sm font-medium text-[#0F172A]">{formatHumanDate(selectedDate)}</div>
          <Button
            variant="pillmindWhite"
            size="sm"
            onClick={() => onDateChange(addDays(selectedDate, +7))}
            className="rounded-xl"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((d) => {
            const wd = weekdayFromDate(d)
            const prog = dayProgress(d)
            const isToday = isSameDay(d, new Date())
            const isActive = isSameDay(d, selectedDate)
            return (
              <button
                key={formatDayKey(d)}
                onClick={() => onDateChange(d)}
                className={cn(
                  'rounded-xl p-2 flex flex-col items-center border transition-all',
                  isActive ? 'bg-[#0EA8BC]/10 border-[#0EA8BC]' : 'bg-white border-[#E2E8F0] hover:bg-slate-50',
                )}
              >
                <span className={cn('text-[11px] mb-1', isToday ? 'text-[#0EA8BC] font-semibold' : 'text-[#64748B]')}>
                  {weekdayLabelShort[wd]}
                </span>
                <div className="relative size-9 grid place-items-center">
                  <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32"
                      fill="none"
                      stroke="#E2E8F0"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    <path
                      d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32"
                      fill="none"
                      stroke="#0EA8BC"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${(prog / 100) * 100} ${100 - (prog / 100) * 100}`}
                    />
                  </svg>
                  <span className="text-[11px] font-semibold">{format(d, 'd')}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
