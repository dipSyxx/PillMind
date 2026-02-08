'use client'

import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { analyticsService } from '@/lib/api/analytics-service'
import { endOfMonthInTz, endOfWeekInTz, startOfMonthInTz, startOfWeekInTz } from '@/lib/medication-utils'
import { cn } from '@/lib/utils'
import { TimeFormat } from '@/types/medication'
import { format } from 'date-fns'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  TrendingDown,
  TrendingUp,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

interface AnalyticsPageProps {
  timezone: string
  timeFormat: TimeFormat
}

type PeriodFilter = 'week' | 'month' | 'custom'

export function AnalyticsPage({ timezone, timeFormat }: AnalyticsPageProps) {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('week')
  const [loading, setLoading] = useState(true)
  const [weeklyReport, setWeeklyReport] = useState<any>(null)
  const [previousReport, setPreviousReport] = useState<any>(null)
  const [inventoryReport, setInventoryReport] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [medicationFilter, setMedicationFilter] = useState<string>('all')
  const [medications, setMedications] = useState<Array<{ id: string; name: string }>>([])
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>(undefined)
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>(undefined)
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false)

  const dateRange = useMemo(() => {
    const now = new Date()
    if (periodFilter === 'custom' && customDateFrom && customDateTo) {
      return { from: customDateFrom, to: customDateTo }
    }
    switch (periodFilter) {
      case 'week':
        return { from: startOfWeekInTz(now, timezone), to: endOfWeekInTz(now, timezone) }
      case 'month':
        return { from: startOfMonthInTz(now, timezone), to: endOfMonthInTz(now, timezone) }
      default:
        return { from: startOfWeekInTz(now, timezone), to: endOfWeekInTz(now, timezone) }
    }
  }, [periodFilter, timezone, customDateFrom, customDateTo])

  // Load medications for filter
  useEffect(() => {
    const loadMedications = async () => {
      try {
        const res = await fetch('/api/prescriptions')
        if (res.ok) {
          const prescriptions = await res.json()
          const meds = prescriptions
            .map((rx: any) => ({
              id: rx.id,
              name: rx.medication?.name || 'Unknown',
            }))
            .filter((med: any, index: number, self: any[]) => self.findIndex((m) => m.name === med.name) === index)
          setMedications(meds)
        }
      } catch (e) {
        console.error('Failed to load medications:', e)
      }
    }
    void loadMedications()
  }, [])

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true)
      setError(null)
      try {
        const from = dateRange.from.toISOString()
        const to = dateRange.to.toISOString()

        // Load current period report
        const report = await analyticsService.getComprehensiveAdherenceReport({
          from,
          to,
          prescriptionId: medicationFilter !== 'all' ? medicationFilter : undefined,
          includeTrends: true,
          includeInsights: true,
        })

        // Get daily breakdown
        const dailyBreakdown = await analyticsService.getDailyBreakdown(from, to)

        const weekReport = {
          weekStart: from,
          weekEnd: to,
          overallMetrics: report.overall,
          medicationBreakdown: report.byMedication,
          dailyBreakdown,
          insights: report.insights || [],
          recommendations: report.recommendations || [],
        }
        setWeeklyReport(weekReport)

        // Load previous period for comparison
        const periodDays = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
        const prevFrom = new Date(dateRange.from.getTime() - periodDays * 24 * 60 * 60 * 1000)
        const prevTo = new Date(dateRange.from.getTime() - 24 * 60 * 60 * 1000)
        try {
          const prevReport = await analyticsService.getComprehensiveAdherenceReport({
            from: prevFrom.toISOString(),
            to: prevTo.toISOString(),
            prescriptionId: medicationFilter !== 'all' ? medicationFilter : undefined,
          })
          setPreviousReport(prevReport)
        } catch (e) {
          // Previous period might not have data, ignore
        }

        const invReport = await analyticsService.getInventoryReport()
        setInventoryReport(invReport)
      } catch (e: any) {
        console.error('Failed to load analytics:', e)
        setError(e?.message || 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }
    void loadAnalytics()
  }, [dateRange.from, dateRange.to, medicationFilter])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-medium">Error loading analytics</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  const metrics = weeklyReport?.overallMetrics || {
    adherenceRate: 0,
    onTimeRate: 0,
    lateRate: 0,
    takenDoses: 0,
    missedDoses: 0,
    skippedDoses: 0,
    scheduledDoses: 0,
  }

  const handleExport = (format: 'csv' | 'json') => {
    if (!weeklyReport) return

    if (format === 'json') {
      const dataStr = JSON.stringify(weeklyReport, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.json`
      link.click()
      URL.revokeObjectURL(url)
    } else {
      // CSV export
      const rows: string[] = []
      rows.push('Date,Adherence Rate,Taken,Missed,Skipped')
      weeklyReport.dailyBreakdown?.forEach((day: any) => {
        rows.push(
          `${day.date},${day.metrics.adherenceRate},${day.metrics.takenDoses},${day.metrics.missedDoses},${day.metrics.skippedDoses}`,
        )
      })
      const csv = rows.join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  const calculateTrend = (current: number, previous: number | undefined): { value: number; trend: 'up' | 'down' | 'neutral' } => {
    if (!previous) return { value: 0, trend: 'neutral' }
    const diff = current - previous
    const percentChange = previous > 0 ? (diff / previous) * 100 : 0
    return {
      value: Math.abs(percentChange),
      trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral',
    }
  }

  return (
    <div className="pb-24 px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#0F172A]">Analytics</h1>
        <div className="flex flex-wrap items-center gap-2">
          {/* Medication Filter */}
          <Select value={medicationFilter} onValueChange={setMedicationFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Medications" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Medications</SelectItem>
              {medications.map((med) => (
                <SelectItem key={med.id} value={med.id}>
                  {med.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Period Filter */}
          <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {/* Custom Date Range Picker */}
          {periodFilter === 'custom' && (
            <Popover open={showCustomDatePicker} onOpenChange={setShowCustomDatePicker}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                  <Calendar className="mr-2 h-4 w-4" />
                  {customDateFrom && customDateTo
                    ? `${format(customDateFrom, 'MMM dd')} - ${format(customDateTo, 'MMM dd')}`
                    : 'Select date range'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">From</label>
                    <Input
                      type="date"
                      value={customDateFrom ? format(customDateFrom, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setCustomDateFrom(e.target.value ? new Date(e.target.value) : undefined)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">To</label>
                    <Input
                      type="date"
                      value={customDateTo ? format(customDateTo, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setCustomDateTo(e.target.value ? new Date(e.target.value) : undefined)}
                    />
                  </div>
                  <Button
                    onClick={() => {
                      if (customDateFrom && customDateTo) {
                        setShowCustomDatePicker(false)
                      }
                    }}
                    className="w-full"
                  >
                    Apply
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Export Button */}
          <Button variant="outline" onClick={() => handleExport('csv')} className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('json')} className="gap-2">
            <Download className="w-4 h-4" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Overall Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Adherence Rate"
          value={`${metrics.adherenceRate.toFixed(1)}%`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          trend={metrics.adherenceRate >= 80 ? 'up' : metrics.adherenceRate >= 60 ? 'neutral' : 'down'}
          comparison={
            previousReport
              ? calculateTrend(metrics.adherenceRate, previousReport.overall.adherenceRate)
              : undefined
          }
        />
        <MetricCard
          label="Taken"
          value={metrics.takenDoses.toString()}
          icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
          comparison={
            previousReport
              ? calculateTrend(metrics.takenDoses, previousReport.overall.takenDoses)
              : undefined
          }
        />
        <MetricCard
          label="Missed"
          value={metrics.missedDoses.toString()}
          icon={<XCircle className="w-5 h-5 text-red-500" />}
          comparison={
            previousReport
              ? calculateTrend(metrics.missedDoses, previousReport.overall.missedDoses)
              : undefined
          }
        />
        <MetricCard
          label="Skipped"
          value={metrics.skippedDoses.toString()}
          icon={<Clock className="w-5 h-5 text-amber-500" />}
          comparison={
            previousReport
              ? calculateTrend(metrics.skippedDoses, previousReport.overall.skippedDoses)
              : undefined
          }
        />
      </div>

      {/* Daily Breakdown Chart */}
      {weeklyReport?.dailyBreakdown && weeklyReport.dailyBreakdown.length > 0 && (
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-6">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Daily Adherence</h2>
          <div className="space-y-3">
            {weeklyReport.dailyBreakdown.map((day: any) => {
              const adherence = day.metrics.adherenceRate || 0
              return (
                <div key={day.date} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#64748B]">
                      {new Date(day.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="font-medium text-[#0F172A]">{adherence.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0EA8BC] transition-all"
                      style={{ width: `${Math.max(0, Math.min(100, adherence))}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Medication Breakdown */}
      {weeklyReport?.medicationBreakdown && weeklyReport.medicationBreakdown.length > 0 && (
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-6">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4">By Medication</h2>
          <div className="space-y-4">
            {weeklyReport.medicationBreakdown.map((med: any) => {
              const adherence = med.metrics.adherenceRate || 0
              return (
                <div key={med.medicationId} className="border-b border-[#E2E8F0] pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-[#0F172A]">{med.medicationName}</h3>
                    <span className="text-sm font-medium text-[#0F172A]">{adherence.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-[#0EA8BC] transition-all"
                      style={{ width: `${Math.max(0, Math.min(100, adherence))}%` }}
                    />
                  </div>
                  <div className="flex gap-4 text-xs text-[#64748B]">
                    <span>✓ {med.metrics.takenDoses} taken</span>
                    <span>✗ {med.metrics.missedDoses} missed</span>
                    {med.metrics.skippedDoses > 0 && <span>⊘ {med.metrics.skippedDoses} skipped</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Insights & Recommendations */}
      {(weeklyReport?.insights?.length > 0 || weeklyReport?.recommendations?.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {weeklyReport.insights?.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Insights
              </h3>
              <ul className="space-y-1 text-sm text-blue-800">
                {weeklyReport.insights.map((insight: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span>•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {weeklyReport.recommendations?.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Recommendations
              </h3>
              <ul className="space-y-1 text-sm text-green-800">
                {weeklyReport.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span>•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Inventory Insights */}
      {inventoryReport && (
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-6">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Inventory Status</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-amber-50 rounded-lg">
              <p className="text-2xl font-bold text-amber-700">{inventoryReport.lowStockCount}</p>
              <p className="text-xs text-amber-600">Low Stock</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-700">{inventoryReport.outOfStockCount}</p>
              <p className="text-xs text-red-600">Out of Stock</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-700">
                {inventoryReport.totalMedications - inventoryReport.lowStockCount - inventoryReport.outOfStockCount}
              </p>
              <p className="text-xs text-green-600">In Stock</p>
            </div>
          </div>
          {inventoryReport.medications?.length > 0 && (
            <div className="space-y-2">
              {inventoryReport.medications
                .filter(
                  (m: any) => m.usage.daysRemaining < 30 || m.inventory.currentQty <= (m.inventory.lowThreshold || 0),
                )
                .slice(0, 5)
                .map((item: any) => (
                  <div key={item.medication.id} className="flex items-center justify-between p-2 bg-[#F8FAFC] rounded">
                    <span className="text-sm text-[#0F172A]">{item.medication.name}</span>
                    <span className="text-xs text-[#64748B]">
                      {item.usage.daysRemaining > 0 ? `${item.usage.daysRemaining} days left` : 'Needs restock'}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon,
  trend,
  comparison,
}: {
  label: string
  value: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  comparison?: { value: number; trend: 'up' | 'down' | 'neutral' }
}) {
  return (
    <div className="bg-white rounded-lg border border-[#E2E8F0] p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[#64748B]">{icon}</div>
        <div className="flex items-center gap-1">
          {comparison && comparison.value > 0 && (
            <span
              className={cn(
                'text-xs font-medium',
                comparison.trend === 'up' ? 'text-green-600' : 'text-red-600',
              )}
            >
              {comparison.trend === 'up' ? '+' : '-'}
              {comparison.value.toFixed(1)}%
            </span>
          )}
          {trend && (
            <div>
              {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
              {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
            </div>
          )}
        </div>
      </div>
      <p className="text-2xl font-bold text-[#0F172A]">{value}</p>
      <p className="text-xs text-[#64748B] mt-1">{label}</p>
    </div>
  )
}
