'use client'

import React, { useState } from 'react'
import { Search, Filter, Calendar, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { DoseStatus, Medication } from '@/types/medication'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export type DateFilter = 'today' | 'week' | 'month' | 'custom' | 'all'

interface LogsFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  dateFilter: DateFilter
  onDateFilterChange: (filter: DateFilter) => void
  customDateRange: { from: Date | undefined; to: Date | undefined }
  onCustomDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void
  statusFilter: DoseStatus | 'all'
  onStatusFilterChange: (status: DoseStatus | 'all') => void
  medicationFilter: string | 'all'
  onMedicationFilterChange: (medicationId: string | 'all') => void
  medications: Medication[]
}

export function LogsFilters({
  searchQuery,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  customDateRange,
  onCustomDateRangeChange,
  statusFilter,
  onStatusFilterChange,
  medicationFilter,
  onMedicationFilterChange,
  medications,
}: LogsFiltersProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
        <Input
          placeholder="Search by medication name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-2 gap-2">
        {/* Date Filter */}
        <div className="space-y-1">
          <label className="text-xs text-[#64748B]">Date</label>
          <Select value={dateFilter} onValueChange={(value) => onDateFilterChange(value as DateFilter)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This week</SelectItem>
              <SelectItem value="month">This month</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-1">
          <label className="text-xs text-[#64748B]">Status</label>
          <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as DoseStatus | 'all')}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="TAKEN">Taken</SelectItem>
              <SelectItem value="MISSED">Missed</SelectItem>
              <SelectItem value="SKIPPED">Skipped</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Medication Filter */}
      <div className="space-y-1">
        <label className="text-xs text-[#64748B]">Medication</label>
        <Select value={medicationFilter} onValueChange={(value) => onMedicationFilterChange(value)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All medications</SelectItem>
            {medications.map((med) => (
              <SelectItem key={med.id} value={med.id}>
                {med.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Custom Date Range Picker */}
      {dateFilter === 'custom' && (
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <Calendar className="mr-2 h-4 w-4" />
              {customDateRange.from ? (
                customDateRange.to ? (
                  <>
                    {format(customDateRange.from, 'PPP')} - {format(customDateRange.to, 'PPP')}
                  </>
                ) : (
                  format(customDateRange.from, 'PPP')
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              initialFocus
              mode="range"
              defaultMonth={customDateRange.from}
              selected={{
                from: customDateRange.from,
                to: customDateRange.to,
              }}
              onSelect={(range) => {
                onCustomDateRangeChange({
                  from: range?.from,
                  to: range?.to,
                })
                if (range?.from && range?.to) {
                  setIsCalendarOpen(false)
                }
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

