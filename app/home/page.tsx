'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { CalendarDays, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer'
import {
  WeekNavigation,
  WeeklySummary,
  LowStockAlerts,
  PrnQuickActions,
  DaySchedule,
  MedicationWizard,
  BottomNavigation,
  SnoozeDialog,
} from '@/components/home'
import { DoseLog } from '@/types/medication'
import { dayKeyInTz, statusByDay, canInteractWithDose, startOfWeek, addDays } from '@/lib/medication-utils'
import { addMinutes, compareAsc, parseISO } from 'date-fns'
import { useUserData, useUserActions } from '@/hooks/useUserStore'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { pillMindService } from '@/lib/api/pillmind-service'
import { medicationService } from '@/lib/api/medication-service'
import { analyticsService } from '@/lib/api/analytics-service'

/* =============================================================================
   HOME PAGE
============================================================================= */

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [snoozeFor, setSnoozeFor] = useState<null | DoseLog>(null)
  const [activeTab, setActiveTab] = useState<'home' | 'meds' | 'logs' | 'profile'>('home')

  // Get data from user store
  const { settings, medications, prescriptions, doseLogs, isLoading, isInitialized } = useUserData()

  const {
    updateDoseLog,
    addDoseLog,
    removeDoseLog,
    createMedication,
    createPrescription,
    generateDoses,
    updateInventory,
    initialize,
    setDoseLogs,
  } = useUserActions()

  // Use real data from store
  const userSettings = settings || {
    userId: 'default',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    timeFormat: 'H24' as const,
    defaultChannels: ['EMAIL'] as const,
  }
  const userMeds = medications || []
  const userRx = prescriptions || []
  const userDoseLogs = doseLogs || []

  const weekStart = startOfWeek(selectedDate)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Function to load dose logs for selected week
  const loadWeekDoseLogs = async (weekStartDate: Date) => {
    const weekEnd = new Date(weekStartDate)
    weekEnd.setDate(weekEnd.getDate() + 6) // Sunday
    weekEnd.setHours(23, 59, 59, 999)

    try {
      const response = await fetch(`/api/dose?from=${weekStartDate.toISOString()}&to=${weekEnd.toISOString()}`)
      if (response.ok) {
        const weekDoseLogs = await response.json()
        setDoseLogs(weekDoseLogs)
      }
    } catch (error) {
      console.error('Failed to load week dose logs:', error)
    }
  }

  // === Weekly statistics ===
  const weekKeySet = new Set(weekDays.map((d) => dayKeyInTz(d, userSettings.timezone)))
  const weekLogs = userDoseLogs.filter((dl) => weekKeySet.has(dayKeyInTz(dl.scheduledFor, userSettings.timezone)))

  const { taken, scheduled, missed, skipped } = useMemo(() => {
    let taken = 0,
      scheduled = 0,
      missed = 0,
      skipped = 0
    for (const dl of weekLogs) {
      const st = statusByDay(dl, userSettings.timezone)
      if (st === 'TAKEN') taken++
      else if (st === 'SCHEDULED') scheduled++
      else if (st === 'MISSED') missed++
      else if (st === 'SKIPPED') skipped++
    }
    return { taken, scheduled, missed, skipped }
  }, [weekLogs])

  const adherence = useMemo(() => {
    const denom = taken + missed + skipped + scheduled
    if (!denom) return 0 // No doses means 0% adherence, not 100%
    return Math.round((taken / (taken + missed + skipped)) * 100)
  }, [taken, missed, skipped, scheduled])

  // === Prescription/Medication mapping ===
  const rxById = useMemo(() => {
    if (!userRx || userRx.length === 0) return {}
    return Object.fromEntries(userRx.map((r) => [r.id, r]))
  }, [userRx])

  const medById = useMemo(() => {
    if (!userMeds || userMeds.length === 0) return {}
    return Object.fromEntries(userMeds.map((m) => [m.id, m]))
  }, [userMeds])

  // === Day logs ===
  const dayLogs = useMemo(() => {
    const k = dayKeyInTz(selectedDate, userSettings.timezone)
    const items = userDoseLogs.filter((x) => dayKeyInTz(x.scheduledFor, userSettings.timezone) === k)
    // sort by time
    return items.sort((a, b) => compareAsc(parseISO(a.scheduledFor), parseISO(b.scheduledFor)))
  }, [userDoseLogs, selectedDate, userSettings.timezone])

  // === Advanced Dose actions with smart features ===
  async function takeDose(doseLogId: string) {
    const dl = userDoseLogs.find((x) => x.id === doseLogId)
    if (!dl || !userSettings || !canInteractWithDose(dl, userSettings.timezone)) return

    // Optimistic update
    updateDoseLog(doseLogId, { status: 'TAKEN', takenAt: new Date().toISOString() })

    try {
      // Use advanced medication service with smart features
      const result = await pillMindService.takeDoseWithSmartFeatures(doseLogId, {
        updateInventory: true,
        rescheduleNext: (dl.prescriptionId && userRx.find((rx) => rx.id === dl.prescriptionId)?.asNeeded) || false,
        notifyCareProvider: false, // Can be enabled based on user preferences
      })

      // Update local state with any additional data
    } catch (error) {
      console.error('Failed to take dose:', error)
      // Revert optimistic update on error
      updateDoseLog(doseLogId, { status: dl.status, takenAt: dl.takenAt })
    }
  }

  async function skipDose(doseLogId: string) {
    const dl = userDoseLogs.find((x) => x.id === doseLogId)
    if (!dl || !userSettings || !canInteractWithDose(dl, userSettings.timezone)) return

    // Optimistic update
    updateDoseLog(doseLogId, { status: 'SKIPPED' })

    try {
      // API call
      await fetch(`/api/dose/${doseLogId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SKIPPED' }),
      })
    } catch (error) {
      console.error('Failed to skip dose:', error)
      // Revert optimistic update on error
      updateDoseLog(doseLogId, { status: dl.status })
    }
  }

  async function snoozeDose(doseLogId: string, minutes: number) {
    const dl = userDoseLogs.find((x) => x.id === doseLogId)
    if (!dl || !userSettings || !canInteractWithDose(dl, userSettings.timezone)) return

    const newScheduledFor = addMinutes(new Date(), minutes).toISOString()

    // Optimistic update
    updateDoseLog(doseLogId, {
      scheduledFor: newScheduledFor,
      status: 'SCHEDULED',
    })
    setSnoozeFor(null)

    try {
      // Use advanced snooze with smart reschedule
      const result = await pillMindService.snoozeDoseWithSmartReschedule(doseLogId, minutes, {
        respectSchedule: true,
        maxSnoozeHours: 24,
        notifyOnReschedule: true,
      })

      // Update local state with any additional data
    } catch (error) {
      console.error('Failed to snooze dose:', error)
      // Revert optimistic update on error
      updateDoseLog(doseLogId, {
        scheduledFor: dl.scheduledFor,
        status: dl.status,
      })
    }
  }

  // === Advanced PRN "Take now" with smart features ===
  async function prnTakeNow(prescriptionId: string) {
    const rx = rxById[prescriptionId]
    const defaultQ = rx?.schedules[0]?.doseQuantity ?? 1
    const defaultU = rx?.schedules[0]?.doseUnit ?? 'TAB'
    const id = `dl_prn_${Date.now()}`

    const newDoseLog = {
      id,
      prescriptionId,
      scheduleId: null,
      scheduledFor: new Date().toISOString(),
      takenAt: new Date().toISOString(),
      status: 'TAKEN' as const,
      quantity: defaultQ ?? undefined,
      unit: defaultU ?? undefined,
    }

    // Optimistic update
    addDoseLog(newDoseLog)

    try {
      // Use advanced PRN dose creation with inventory management
      const result = await medicationService.createPRNDose(prescriptionId, {
        quantity: defaultQ,
        unit: defaultU,
        updateInventory: true,
        notes: 'Taken via PRN quick action',
      })

      // Update local state with the actual created dose log
      updateDoseLog(id, result)
    } catch (error) {
      console.error('Failed to create PRN dose:', error)
      // Remove from store on error
      removeDoseLog(id)
    }
  }

  // === Progress for "bubbles" on weekly strip ===
  function dayProgress(d: Date) {
    if (!userSettings || !userDoseLogs) return 0

    const k = dayKeyInTz(d, userSettings.timezone)
    const logs = userDoseLogs.filter((x) => dayKeyInTz(x.scheduledFor, userSettings.timezone) === k)
    if (!logs.length) return 0 // No doses scheduled for this day

    const taken = logs.filter((x) => statusByDay(x, userSettings.timezone) === 'TAKEN').length
    const total = logs.filter((x) => {
      const status = statusByDay(x, userSettings.timezone)
      return status === 'TAKEN' || status === 'MISSED' || status === 'SKIPPED'
    }).length

    if (total === 0) return 0 // No completed doses yet
    return Math.round((taken / total) * 100)
  }

  const lowStock = (userMeds || []).filter(
    (m) => m.inventory && m.inventory.lowThreshold != null && m.inventory.currentQty <= (m.inventory.lowThreshold || 0),
  )

  const prnPrescriptions = (userRx || []).filter((r) => r.asNeeded)

  // Load dose logs for current week on mount and process daily routine
  useEffect(() => {
    if (isInitialized && userSettings) {
      loadWeekDoseLogs(weekStart)

      // Process daily medication routine with advanced features
      pillMindService
        .processDailyMedicationRoutine(userSettings)
        .then((dailyRoutine) => {
          // Handle any missed doses
          if (dailyRoutine.missedDoses.length > 0) {
            // Could show a notification or alert to the user
          }

          // Handle low stock alerts
          if (dailyRoutine.lowStockAlerts.length > 0) {
            // Could show a notification or alert to the user
          }
        })
        .catch((error) => {
          console.error('Failed to process daily routine:', error)
        })
    }
  }, [isInitialized, userSettings])

  // Show loading state while initializing
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-[#F8FAFC] to-[#E2E8F0] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-sm text-[#64748B]">Loading your medications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#F8FAFC] to-[#E2E8F0] pb-[88px]">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">PillMind</h1>
            <p className="text-sm text-[#64748B]">Stay on track with your meds</p>
          </div>
          <Button
            variant="pillmindGhost"
            size="sm"
            className="rounded-xl"
            onClick={async () => {
              try {
                // Get comprehensive weekly report with advanced analytics
                const weekStart = startOfWeek(selectedDate)
                const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)

                const weeklyReport = await analyticsService.getWeeklyReport(weekStart.toISOString())

                // Get dashboard data
                const dashboardData = await fetch('/api/dashboard').then((res) => res.json())

                // Get comprehensive report with all features
                const comprehensiveReport = await pillMindService.generateComprehensiveReport({
                  from: weekStart.toISOString(),
                  to: weekEnd.toISOString(),
                  includeAnalytics: true,
                  includeInventory: true,
                  includePredictions: true,
                  includeRecommendations: true,
                })

                // You can show this data in a modal or navigate to a dashboard page
                alert(
                  `Weekly Adherence: ${weeklyReport.overallMetrics.adherenceRate}%\nInsights: ${weeklyReport.insights.join(', ')}`,
                )
              } catch (error) {
                console.error('Failed to fetch analytics data:', error)
              }
            }}
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            This week
          </Button>
        </div>
      </div>

      {/* Week Navigation */}
      <WeekNavigation
        selectedDate={selectedDate}
        onDateChange={(newDate) => {
          setSelectedDate(newDate)
          // Load dose logs for the new week
          const newWeekStart = startOfWeek(newDate)
          loadWeekDoseLogs(newWeekStart)
        }}
        dayProgress={dayProgress}
      />

      {/* Weekly summary + low stock + PRN */}
      <div className="px-4 mt-4 space-y-3">
        <WeeklySummary taken={taken} scheduled={scheduled} missed={missed} skipped={skipped} adherence={adherence} />

        {lowStock.length > 0 && (
          <LowStockAlerts
            lowStock={lowStock}
            onRefill={async (medicationId, newQuantity) => {
              await updateInventory(medicationId, {
                currentQty: newQuantity,
                lastRestockedAt: new Date().toISOString(),
              })
            }}
          />
        )}

        {prnPrescriptions.length > 0 && <PrnQuickActions prnPrescriptions={prnPrescriptions} onTakeNow={prnTakeNow} />}
      </div>

      {/* Day Schedule */}
      {dayLogs.length > 0 && (
        <DaySchedule
          dayLogs={dayLogs}
          timeFormat={userSettings?.timeFormat || 'H24'}
          onTakeDose={takeDose}
          onSkipDose={skipDose}
          onSnoozeDose={setSnoozeFor}
          getMedicationName={(medicationId) => {
            if (!medicationId) {
              return 'Unknown Medication'
            }

            // Find medication directly from store
            const medication = medById[medicationId]
            if (medication) {
              return medication.name
            }

            // If not found directly, try to find through prescriptions
            const prescription = Object.values(rxById).find((rx) => rx.medicationId === medicationId)
            if (prescription) {
              const med = medById[prescription.medicationId]
              return med?.name || 'Unknown Medication'
            }

            // Try to find medication from dose logs data
            const doseLogWithMed = userDoseLogs.find(
              (dl: any) => (dl as any).prescription?.medicationId === medicationId,
            )
            if ((doseLogWithMed as any)?.prescription?.medication) {
              return (doseLogWithMed as any).prescription.medication.name
            }

            return `Unknown Medication (${medicationId.slice(-6)})`
          }}
          getPrescription={(prescriptionId) => rxById[prescriptionId]}
          canInteractWithDose={(doseLog) => canInteractWithDose(doseLog, userSettings?.timezone || 'UTC')}
          getStatusByDay={(doseLog) => statusByDay(doseLog, userSettings?.timezone || 'UTC')}
          selectedDate={selectedDate}
        />
      )}

      {/* Snooze Dialog */}
      {snoozeFor && <SnoozeDialog snoozeFor={snoozeFor} onClose={() => setSnoozeFor(null)} onSnooze={snoozeDose} />}

      {/* Add Medication Wizard */}
      <Drawer open={isAddOpen} onOpenChange={setIsAddOpen} direction="bottom">
        <DrawerTrigger asChild>
          <button className="fixed bottom-[90px] left-1/2 -translate-x-1/2 z-40 bg-[#0EA8BC] text-white rounded-full w-14 h-14 shadow-[0_10px_30px_rgba(14,168,188,0.4)] active:scale-95 transition">
            <Plus className="w-6 h-6 mx-auto" />
            <span className="sr-only">Add medication</span>
          </button>
        </DrawerTrigger>

        <DrawerContent className="p-0">
          <MedicationWizard
            mode="create"
            onClose={() => setIsAddOpen(false)}
            onSaved={async (draft) => {
              try {
                // Use complete medication workflow with advanced features
                const workflow = await pillMindService.setupCompleteMedicationWorkflow({
                  medication: {
                    name: draft.name,
                    brandName: draft.brandName,
                    form: draft.form,
                    strengthValue: draft.strengthValue,
                    strengthUnit: draft.strengthUnit,
                    route: draft.route,
                    notes: draft.notes,
                  },
                  inventory: {
                    currentQty: 30, // Default starting quantity
                    unit: draft.doseUnit || 'TAB',
                    lowThreshold: 10, // Default low threshold
                  },
                  prescription: {
                    indication: draft.indication,
                    asNeeded: draft.asNeeded,
                    maxDailyDose: draft.maxDailyDose,
                    instructions: draft.instructions,
                    startDate: new Date().toISOString(),
                  },
                  schedule:
                    !draft.asNeeded && draft.daysOfWeek && draft.times && userSettings
                      ? {
                          timezone: userSettings.timezone,
                          daysOfWeek: draft.daysOfWeek,
                          times: draft.times,
                          doseQuantity: draft.doseQuantity || 1,
                          doseUnit: draft.doseUnit || 'TAB',
                        }
                      : undefined,
                  generateDosesForWeeks: !draft.asNeeded ? 4 : undefined, // Generate 4 weeks of doses
                })

                // Refresh the store to get the new data
                await initialize()

                setIsAddOpen(false)
              } catch (error) {
                console.error('Failed to create medication workflow:', error)
                // Error is already handled in the store
              }
            }}
            timezone={userSettings?.timezone || 'UTC'}
            timeFormat={userSettings?.timeFormat || 'H24'}
          />
        </DrawerContent>
      </Drawer>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
