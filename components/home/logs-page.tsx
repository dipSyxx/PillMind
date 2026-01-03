'use client'

import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Button } from '@/components/ui/button'
import { useUserActions, useUserData } from '@/hooks/useUserStore'
import { TimeFormat } from '@/types/medication'
import { endOfDay, endOfMonth, endOfWeek, parseISO, startOfDay, startOfMonth, startOfWeek } from 'date-fns'
import { Download } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { LogsFilters, type DateFilter } from './logs-filters'
import { LogsStats } from './logs-stats'
import { LogsTimeline } from './logs-timeline'

interface LogsPageProps {
  timezone: string
  timeFormat: TimeFormat
}

export function LogsPage({ timezone, timeFormat }: LogsPageProps) {
  const { medications, doseLogs, isLoading } = useUserData()
  const { setDoseLogs } = useUserActions()

  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [statusFilter, setStatusFilter] = useState<'TAKEN' | 'MISSED' | 'SKIPPED' | 'SCHEDULED' | 'all'>('all')
  const [medicationFilter, setMedicationFilter] = useState<string | 'all'>('all')
  const [isExporting, setIsExporting] = useState(false)

  // Get date range based on filter
  const dateRange = useMemo(() => {
    const now = new Date()
    switch (dateFilter) {
      case 'today':
        return { from: startOfDay(now), to: endOfDay(now) }
      case 'week':
        return { from: startOfWeek(now), to: endOfWeek(now) }
      case 'month':
        return { from: startOfMonth(now), to: endOfMonth(now) }
      case 'custom':
        return customDateRange
      default:
        return undefined
    }
  }, [dateFilter, customDateRange])

  // Filter dose logs
  const filteredLogs = useMemo(() => {
    let filtered = doseLogs || []

    // Filter by date range
    if (dateRange?.from && dateRange?.to) {
      filtered = filtered.filter((log) => {
        const logDate = parseISO(log.scheduledFor)
        return logDate >= dateRange.from! && logDate <= dateRange.to!
      })
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((log) => log.status === statusFilter)
    }

    // Filter by medication
    if (medicationFilter !== 'all') {
      filtered = filtered.filter((log) => {
        const medicationId = log.prescription?.medicationId
        return medicationId === medicationFilter
      })
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((log) => {
        const medicationName =
          log.prescription?.medication?.name ||
          medications.find((m) => m.id === log.prescription?.medicationId)?.name ||
          ''
        return medicationName.toLowerCase().includes(query)
      })
    }

    return filtered
  }, [doseLogs, dateRange, statusFilter, medicationFilter, searchQuery, medications])

  // Get medication name helper
  const getMedicationName = (medicationId: string): string => {
    const medication = medications.find((m) => m.id === medicationId)
    return medication?.name || `Unknown Medication (${medicationId.slice(-6)})`
  }

  // Export logs
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const params = new URLSearchParams()
      if (dateRange?.from) params.append('from', dateRange.from.toISOString())
      if (dateRange?.to) params.append('to', dateRange.to.toISOString())
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (medicationFilter !== 'all') params.append('prescriptionId', medicationFilter)

      const response = await fetch(`/api/dose/export?${params.toString()}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `pillmind-logs-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        console.error('Failed to export logs')
      }
    } catch (error) {
      console.error('Error exporting logs:', error)
    } finally {
      setIsExporting(false)
    }
  }

  // Load dose logs on mount if not already loaded
  useEffect(() => {
    if (!doseLogs || doseLogs.length === 0) {
      // Load all dose logs if none are loaded
      fetch('/api/dose')
        .then((res) => res.json())
        .then((logs) => {
          setDoseLogs(logs)
        })
        .catch((err) => console.error('Failed to load dose logs:', err))
    }
  }, [doseLogs, setDoseLogs]) // Only run when doseLogs is empty

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#F8FAFC] to-[#E2E8F0] pb-[88px]">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">Dose Logs</h1>
            <p className="text-sm text-[#64748B]">
              {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <Button
            variant="pillmindOutline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting || filteredLogs.length === 0}
          >
            {isExporting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 mt-4">
        <LogsFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          customDateRange={customDateRange}
          onCustomDateRangeChange={setCustomDateRange}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          medicationFilter={medicationFilter}
          onMedicationFilterChange={setMedicationFilter}
          medications={medications}
        />
      </div>

      {/* Stats */}
      <div className="px-4 mt-4">
        <LogsStats doseLogs={filteredLogs} dateRange={dateRange} />
      </div>

      {/* Timeline */}
      <div className="px-4 mt-4">
        <LogsTimeline
          doseLogs={filteredLogs}
          getMedicationName={getMedicationName}
          timeFormat={timeFormat}
          timezone={timezone}
        />
      </div>
    </div>
  )
}
