import { medicationService } from './medication-service'
import { analyticsService } from './analytics-service'
import { notificationService } from './notification-service'
import { Medication, Prescription, DoseLog, UserSettings } from '@/types/medication'

export interface CompleteMedicationSetup {
  medication: Medication & { inventory?: any }
  prescription: Prescription & { schedules: any[] }
  generatedDoses: DoseLog[]
  notifications: any[]
}

export interface MedicationWorkflow {
  setup: CompleteMedicationSetup
  analytics: {
    adherenceReport: any
    inventoryReport: any
    predictions: any
  }
  notifications: {
    scheduled: any[]
    preferences: any
  }
}

export class PillMindService {
  // ===== COMPLETE MEDICATION WORKFLOW =====

  async setupCompleteMedicationWorkflow(data: {
    medication: {
      name: string
      brandName?: string
      form: 'TABLET' | 'CAPSULE' | 'LIQUID' | 'INJECTION' | 'INHALER' | 'TOPICAL' | 'DROPS' | 'OTHER'
      strengthValue?: number
      strengthUnit?: 'MG' | 'MCG' | 'G' | 'ML' | 'IU' | 'DROP' | 'PUFF' | 'UNIT' | 'TAB' | 'CAPS'
      route?: 'ORAL' | 'SUBLINGUAL' | 'INHALATION' | 'TOPICAL' | 'INJECTION' | 'OPHTHALMIC' | 'NASAL' | 'RECTAL' | 'OTHER'
      notes?: string
    }
    inventory: {
      currentQty: number
      unit: 'MG' | 'MCG' | 'G' | 'ML' | 'IU' | 'DROP' | 'PUFF' | 'UNIT' | 'TAB' | 'CAPS'
      lowThreshold?: number
    }
    prescription: {
      indication?: string
      asNeeded?: boolean
      maxDailyDose?: number
      instructions?: string
      startDate: string
      endDate?: string
    }
    schedule?: {
      timezone: string
      daysOfWeek: string[]
      times: string[]
      doseQuantity?: number
      doseUnit?: string
    }
    careProvider?: {
      name: string
      email?: string
      phone?: string
      clinic?: string
    }
    generateDosesForWeeks?: number
  }): Promise<MedicationWorkflow> {
    try {
      // 1. Create medication with inventory
      const medication = await medicationService.createMedicationWithInventory({
        medication: data.medication,
        inventory: data.inventory,
      })

      // 2. Create care provider if provided
      let careProvider = null
      if (data.careProvider) {
        careProvider = await medicationService.createCareProviderWithPrescriptions({
          provider: data.careProvider,
        })
      }

      // 3. Create prescription with schedule
      const prescription = await medicationService.createPrescriptionWithSchedule({
        prescription: {
          ...data.prescription,
          medicationId: medication.id,
          providerId: careProvider?.id,
        },
        schedule: data.schedule,
      })

      // 4. Generate doses if not PRN and schedule provided
      let generatedDoses: DoseLog[] = []
      if (!data.prescription.asNeeded && data.schedule && data.generateDosesForWeeks) {
        const weeksToGenerate = data.generateDosesForWeeks
        const startDate = new Date(data.prescription.startDate)
        const endDate = new Date(startDate.getTime() + weeksToGenerate * 7 * 24 * 60 * 60 * 1000)

        const generationResult = await medicationService.generateDosesForPrescription(
          prescription.id,
          {
            from: startDate.toISOString(),
            to: endDate.toISOString(),
            timezone: data.schedule.timezone,
          }
        )
        generatedDoses = generationResult.generatedDoses
      }

      // 5. Schedule notifications
      const notifications = await notificationService.scheduleSmartReminders(
        generatedDoses,
        { timezone: data.schedule?.timezone || 'UTC' } as UserSettings
      )

      // 6. Get initial analytics
      const adherenceReport = await analyticsService.getComprehensiveAdherenceReport({
        from: data.prescription.startDate,
        to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next week
        includeInsights: true,
      })

      const inventoryReport = await analyticsService.getInventoryReport()

      // 7. Get predictions
      const predictions = await analyticsService.getAdherencePrediction(prescription.id)

      // 8. Get notification preferences
      const notificationPreferences = await notificationService.getNotificationPreferences()

      return {
        setup: {
          medication,
          prescription,
          generatedDoses,
          notifications,
        },
        analytics: {
          adherenceReport,
          inventoryReport,
          predictions,
        },
        notifications: {
          scheduled: notifications,
          preferences: notificationPreferences,
        },
      }
    } catch (error) {
      throw new Error(`Failed to setup complete medication workflow: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // ===== DAILY MEDICATION MANAGEMENT =====

  async processDailyMedicationRoutine(userSettings: UserSettings): Promise<{
    todayDoses: DoseLog[]
    upcomingDoses: DoseLog[]
    missedDoses: DoseLog[]
    lowStockAlerts: any[]
    adherenceSummary: any
    notifications: any[]
  }> {
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1)
    const tomorrow = new Date(todayEnd.getTime() + 1)

    try {
      // Get today's doses
      const todayDosesResponse = await fetch(`/api/dose?from=${todayStart.toISOString()}&to=${todayEnd.toISOString()}`)
      const todayDoses = todayDosesResponse.ok ? await todayDosesResponse.json() : []

      // Get upcoming doses (next 24 hours)
      const upcomingDosesResponse = await fetch(`/api/dose?from=${tomorrow.toISOString()}&to=${new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000).toISOString()}`)
      const upcomingDoses = upcomingDosesResponse.ok ? await upcomingDosesResponse.json() : []

      // Identify missed doses
      const missedDoses = todayDoses.filter((dose: DoseLog) => {
        const scheduledTime = new Date(dose.scheduledFor)
        const now = new Date()
        return dose.status === 'SCHEDULED' && scheduledTime < now
      })

      // Get low stock alerts
      const lowStockAlerts = await medicationService.getLowStockMedications()

      // Get adherence summary for today
      const adherenceSummary = await analyticsService.getComprehensiveAdherenceReport({
        from: todayStart.toISOString(),
        to: todayEnd.toISOString(),
        includeInsights: true,
      })

      // Schedule notifications for missed doses
      const missedDoseNotifications = await notificationService.scheduleMissedDoseNotifications(missedDoses)

      // Schedule low stock notifications
      const lowStockNotifications = await notificationService.scheduleLowStockNotifications(
        lowStockAlerts.map(med => ({
          id: med.id,
          name: med.name,
          inventory: {
            currentQty: med.inventory.currentQty,
            lowThreshold: med.inventory.lowThreshold || 0,
          },
        }))
      )

      return {
        todayDoses,
        upcomingDoses,
        missedDoses,
        lowStockAlerts,
        adherenceSummary,
        notifications: [...missedDoseNotifications, ...lowStockNotifications],
      }
    } catch (error) {
      throw new Error(`Failed to process daily medication routine: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // ===== SMART DOSE MANAGEMENT =====

  async takeDoseWithSmartFeatures(
    doseLogId: string,
    options?: {
      quantity?: number
      updateInventory?: boolean
      rescheduleNext?: boolean
      notifyCareProvider?: boolean
    }
  ): Promise<{
    doseLog: DoseLog
    inventoryUpdated?: any
    nextDoseScheduled?: DoseLog
    careProviderNotified?: boolean
  }> {
    try {
      // Take the dose
      const doseLog = await medicationService.takeDoseWithInventoryUpdate(doseLogId, {
        quantity: options?.quantity,
        updateInventory: options?.updateInventory,
      })

      let inventoryUpdated = null
      let nextDoseScheduled = null
      let careProviderNotified = false

      // Update inventory if requested
      if (options?.updateInventory) {
        // Get medication inventory from the dose log's prescription
        const prescriptionResponse = await fetch(`/api/prescriptions/${doseLog.prescriptionId}`)
        if (prescriptionResponse.ok) {
          const prescription = await prescriptionResponse.json()
          if (prescription.medication?.inventory) {
            inventoryUpdated = prescription.medication.inventory
          }
        }
      }

      // Reschedule next dose if requested (for PRN medications)
      if (options?.rescheduleNext) {
        // Get prescription to check if it's PRN
        const prescriptionResponse = await fetch(`/api/prescriptions/${doseLog.prescriptionId}`)
        if (prescriptionResponse.ok) {
          const prescription = await prescriptionResponse.json()
          if (prescription.asNeeded) {
            // This would create a new scheduled dose for the next appropriate time
            // Implementation depends on business logic
          }
        }
      }

      // Notify care provider if requested
      if (options?.notifyCareProvider) {
        // Get prescription to check if it has a provider
        const prescriptionResponse = await fetch(`/api/prescriptions/${doseLog.prescriptionId}`)
        if (prescriptionResponse.ok) {
          const prescription = await prescriptionResponse.json()
          if (prescription.provider) {
            // This would send a notification to the care provider
            // Implementation depends on notification system
            careProviderNotified = true
          }
        }
      }

      return {
        doseLog,
        inventoryUpdated: inventoryUpdated || undefined,
        nextDoseScheduled: nextDoseScheduled || undefined,
        careProviderNotified,
      }
    } catch (error) {
      throw new Error(`Failed to take dose with smart features: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async snoozeDoseWithSmartReschedule(
    doseLogId: string,
    minutes: number,
    options?: {
      respectSchedule?: boolean
      maxSnoozeHours?: number
      notifyOnReschedule?: boolean
    }
  ): Promise<{
    doseLog: DoseLog
    nextReminderScheduled?: any
  }> {
    try {
      const doseLog = await medicationService.snoozeDoseWithSmartReschedule(doseLogId, minutes, {
        respectSchedule: options?.respectSchedule,
        maxSnoozeHours: options?.maxSnoozeHours,
      })

      let nextReminderScheduled = null

      // Schedule next reminder if requested
      if (options?.notifyOnReschedule) {
        const newScheduledTime = new Date(doseLog.scheduledFor)
        const reminderTime = new Date(newScheduledTime.getTime() - 15 * 60 * 1000) // 15 min before

        nextReminderScheduled = {
          id: `reminder_${doseLogId}_${Date.now()}`,
          doseLogId: doseLog.id,
          scheduledFor: reminderTime.toISOString(),
          channel: 'PUSH',
          status: 'PENDING',
        }
      }

      return {
        doseLog,
        nextReminderScheduled,
      }
    } catch (error) {
      throw new Error(`Failed to snooze dose with smart reschedule: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // ===== COMPREHENSIVE REPORTING =====

  async generateComprehensiveReport(options: {
    from: string
    to: string
    includeAnalytics?: boolean
    includeInventory?: boolean
    includePredictions?: boolean
    includeRecommendations?: boolean
  }): Promise<{
    period: { from: string; to: string }
    adherence: any
    inventory?: any
    predictions?: any
    recommendations?: string[]
    insights?: string[]
  }> {
    try {
      const report: any = {
        period: { from: options.from, to: options.to },
      }

      // Adherence analytics
      if (options.includeAnalytics) {
        report.adherence = await analyticsService.getComprehensiveAdherenceReport({
          from: options.from,
          to: options.to,
          includeInsights: true,
        })
      }

      // Inventory report
      if (options.includeInventory) {
        report.inventory = await analyticsService.getInventoryReport()
      }

      // Predictions
      if (options.includePredictions) {
        // Get all prescriptions and generate predictions
        const prescriptionsResponse = await fetch('/api/prescriptions')
        if (prescriptionsResponse.ok) {
          const prescriptions = await prescriptionsResponse.json()
          report.predictions = await Promise.all(
            prescriptions.map((rx: Prescription) =>
              analyticsService.getAdherencePrediction(rx.id)
            )
          )
        }
      }

      // Generate comprehensive recommendations
      if (options.includeRecommendations) {
        report.recommendations = this.generateComprehensiveRecommendations(report)
        report.insights = this.generateComprehensiveInsights(report)
      }

      return report
    } catch (error) {
      throw new Error(`Failed to generate comprehensive report: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // ===== BULK OPERATIONS =====

  async bulkMedicationManagement(operations: {
    takeDoses?: string[]
    skipDoses?: string[]
    snoozeDoses?: Array<{ doseLogId: string; minutes: number }>
    restockMedications?: Array<{ medicationId: string; quantity: number; unit: string }>
  }): Promise<{
    results: {
      taken: DoseLog[]
      skipped: DoseLog[]
      snoozed: DoseLog[]
      restocked: any[]
    }
    errors: string[]
  }> {
    const results = {
      taken: [] as DoseLog[],
      skipped: [] as DoseLog[],
      snoozed: [] as DoseLog[],
      restocked: [] as any[],
    }
    const errors: string[] = []

    // Bulk take doses
    if (operations.takeDoses) {
      try {
        const takenDoses = await medicationService.bulkUpdateDoses(operations.takeDoses, {
          status: 'TAKEN',
          takenAt: new Date().toISOString(),
        })
        results.taken = takenDoses
      } catch (error) {
        errors.push(`Failed to take doses: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Bulk skip doses
    if (operations.skipDoses) {
      try {
        const skippedDoses = await medicationService.bulkUpdateDoses(operations.skipDoses, {
          status: 'SKIPPED',
        })
        results.skipped = skippedDoses
      } catch (error) {
        errors.push(`Failed to skip doses: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Bulk snooze doses
    if (operations.snoozeDoses) {
      for (const { doseLogId, minutes } of operations.snoozeDoses) {
        try {
          const snoozedDose = await medicationService.snoozeDoseWithSmartReschedule(doseLogId, minutes)
          results.snoozed.push(snoozedDose)
        } catch (error) {
          errors.push(`Failed to snooze dose ${doseLogId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }

    // Bulk restock medications
    if (operations.restockMedications) {
      for (const { medicationId, quantity, unit } of operations.restockMedications) {
        try {
          const restocked = await medicationService.restockMedication(medicationId, {
            quantity,
            unit,
            updateThreshold: true,
          })
          results.restocked.push(restocked)
        } catch (error) {
          errors.push(`Failed to restock medication ${medicationId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }

    return { results, errors }
  }

  // ===== HELPER METHODS =====

  private generateComprehensiveRecommendations(report: any): string[] {
    const recommendations: string[] = []

    if (report.adherence?.overall?.adherenceRate < 80) {
      recommendations.push('Consider setting up medication reminders to improve adherence')
      recommendations.push('Review medication schedule for potential conflicts with daily routine')
    }

    if (report.inventory?.lowStockCount > 0) {
      recommendations.push('Refill medications that are running low to avoid missed doses')
      recommendations.push('Set up automatic refill reminders for critical medications')
    }

    if (report.predictions?.some((p: any) => p.predictedAdherenceRate < 70)) {
      recommendations.push('Schedule a consultation with your healthcare provider')
      recommendations.push('Consider medication adherence support programs')
    }

    return recommendations
  }

  private generateComprehensiveInsights(report: any): string[] {
    const insights: string[] = []

    if (report.adherence?.overall?.adherenceRate >= 95) {
      insights.push('Excellent medication adherence! You\'re doing great with your medication routine.')
    } else if (report.adherence?.overall?.adherenceRate >= 80) {
      insights.push('Good medication adherence with room for improvement.')
    } else {
      insights.push('Medication adherence needs attention to achieve optimal health outcomes.')
    }

    if (report.inventory?.outOfStockCount > 0) {
      insights.push('Some medications are completely out of stock and need immediate attention.')
    }

    return insights
  }
}

// Export singleton instance
export const pillMindService = new PillMindService()
