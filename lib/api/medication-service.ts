import { Medication, Prescription, Schedule, DoseLog, Inventory, CareProvider } from '@/types/medication'
import { tzDayRangeToUtc } from '@/lib/medication-utils'

export class MedicationService {
  private baseUrl = '/api'

  // ===== MEDICATION MANAGEMENT =====

  async createMedicationWithInventory(data: {
    medication: {
      name: string
      brandName?: string
      form: 'TABLET' | 'CAPSULE' | 'LIQUID' | 'INJECTION' | 'INHALER' | 'TOPICAL' | 'DROPS' | 'OTHER'
      strengthValue?: number
      strengthUnit?: 'MG' | 'MCG' | 'G' | 'ML' | 'IU' | 'DROP' | 'PUFF' | 'UNIT' | 'TAB' | 'CAPS'
      route?: 'ORAL' | 'SUBLINGUAL' | 'INHALATION' | 'TOPICAL' | 'INJECTION' | 'OPHTHALMIC' | 'NASAL' | 'RECTAL' | 'OTHER'
      notes?: string
    }
    inventory?: {
      currentQty: number
      unit: 'MG' | 'MCG' | 'G' | 'ML' | 'IU' | 'DROP' | 'PUFF' | 'UNIT' | 'TAB' | 'CAPS'
      lowThreshold?: number
    }
  }): Promise<Medication & { inventory?: Inventory }> {
    const response = await fetch(`${this.baseUrl}/medications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data.medication),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create medication')
    }

    const medication = await response.json()

    // Create inventory if provided
    if (data.inventory) {
      try {
        const inventoryResponse = await fetch(`${this.baseUrl}/medications/${medication.id}/inventory`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data.inventory),
        })

        if (inventoryResponse.ok) {
          const inventory = await inventoryResponse.json()
          return { ...medication, inventory }
        }
      } catch (error) {
        console.warn('Failed to create inventory, but medication was created:', error)
      }
    }

    return medication
  }

  async updateMedicationWithInventory(
    medicationId: string,
    data: {
      medication?: Partial<Medication>
      inventory?: Partial<Inventory>
    }
  ): Promise<Medication & { inventory?: Inventory }> {
    const updates: any = {}

    // Update medication if provided
    if (data.medication) {
      const medicationResponse = await fetch(`${this.baseUrl}/medications/${medicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.medication),
      })

      if (!medicationResponse.ok) {
        const error = await medicationResponse.json()
        throw new Error(error.error || 'Failed to update medication')
      }

      updates.medication = await medicationResponse.json()
    }

    // Update inventory if provided
    if (data.inventory) {
      const inventoryResponse = await fetch(`${this.baseUrl}/medications/${medicationId}/inventory`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.inventory),
      })

      if (!inventoryResponse.ok) {
        const error = await inventoryResponse.json()
        throw new Error(error.error || 'Failed to update inventory')
      }

      updates.inventory = await inventoryResponse.json()
    }

    return { ...updates.medication, inventory: updates.inventory }
  }

  async searchMedications(query: string, options?: {
    limit?: number
    includeInventory?: boolean
  }): Promise<(Medication & { inventory?: Inventory })[]> {
    const params = new URLSearchParams({ q: query })
    if (options?.limit) params.set('limit', options.limit.toString())

    const response = await fetch(`${this.baseUrl}/medications/search?${params}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to search medications')
    }

    return response.json()
  }

  // ===== TIMEZONE SYNCHRONIZATION =====

  async syncScheduleTimezones(timezone: string): Promise<{ updatedCount: number }> {
    const response = await fetch(`${this.baseUrl}/schedules/sync-timezone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timezone }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to sync schedule timezones')
    }

    return response.json()
  }

  // ===== PRESCRIPTION MANAGEMENT =====

  async createPrescriptionWithSchedule(data: {
    prescription: {
      medicationId: string
      providerId?: string
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
      startDate?: string
      endDate?: string
    }
  }): Promise<Prescription & { schedules: Schedule[] }> {
    // Create prescription
    const prescriptionResponse = await fetch(`${this.baseUrl}/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data.prescription),
    })

    if (!prescriptionResponse.ok) {
      const error = await prescriptionResponse.json()
      throw new Error(error.error || 'Failed to create prescription')
    }

    const prescription = await prescriptionResponse.json()

    // Create schedule if provided and not PRN
    if (data.schedule && !data.prescription.asNeeded) {
      try {
        const scheduleResponse = await fetch(`${this.baseUrl}/prescriptions/${prescription.id}/schedules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data.schedule),
        })

        if (scheduleResponse.ok) {
          const schedule = await scheduleResponse.json()
          return { ...prescription, schedules: [schedule] }
        }
      } catch (error) {
        console.warn('Failed to create schedule, but prescription was created:', error)
      }
    }

    return { ...prescription, schedules: [] }
  }

  async generateDosesForPrescription(
    prescriptionId: string,
    options: {
      from: string
      to: string
      timezone?: string
    }
  ): Promise<{ generatedDoses: DoseLog[]; message: string }> {
    const response = await fetch(`${this.baseUrl}/dose/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prescriptionId,
        from: options.from,
        to: options.to,
        timezone: options.timezone || 'UTC',
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to generate doses')
    }

    return response.json()
  }

  // ===== DOSE MANAGEMENT =====

  async takeDoseWithInventoryUpdate(
    doseLogId: string,
    options?: {
      quantity?: number
      updateInventory?: boolean
    }
  ): Promise<DoseLog> {
    // Update dose log
    const doseResponse = await fetch(`${this.baseUrl}/dose/${doseLogId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'TAKEN',
        takenAt: new Date().toISOString(),
        quantity: options?.quantity,
      }),
    })

    if (!doseResponse.ok) {
      const error = await doseResponse.json()
      throw new Error(error.error || 'Failed to take dose')
    }

    const doseLog = await doseResponse.json()

    // Update inventory if requested
    if (options?.updateInventory && doseLog.prescription?.medication?.inventory) {
      try {
        const currentInventory = doseLog.prescription.medication.inventory
        const newQuantity = Math.max(0, currentInventory.currentQty - (options.quantity || 1))

        await fetch(`${this.baseUrl}/medications/${doseLog.prescription.medication.id}/inventory`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentQty: newQuantity,
            unit: currentInventory.unit,
            lowThreshold: currentInventory.lowThreshold,
          }),
        })
      } catch (error) {
        console.warn('Failed to update inventory after taking dose:', error)
      }
    }

    return doseLog
  }

  async snoozeDoseWithSmartReschedule(
    doseLogId: string,
    minutes: number,
    options?: {
      respectSchedule?: boolean
      maxSnoozeHours?: number
    }
  ): Promise<DoseLog> {
    const maxSnoozeMs = (options?.maxSnoozeHours || 24) * 60 * 60 * 1000
    const snoozeMs = minutes * 60 * 1000

    if (snoozeMs > maxSnoozeMs) {
      throw new Error(`Snooze time cannot exceed ${options?.maxSnoozeHours || 24} hours`)
    }

    const newScheduledFor = new Date(Date.now() + snoozeMs)

    // If respecting schedule, find the next appropriate time slot
    if (options?.respectSchedule) {
      // This would require fetching the schedule and finding the next appropriate time
      // For now, we'll use the simple approach
    }

    const response = await fetch(`${this.baseUrl}/dose/${doseLogId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'SCHEDULED',
        scheduledFor: newScheduledFor.toISOString(),
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to snooze dose')
    }

    return response.json()
  }

  async createPRNDose(
    prescriptionId: string,
    options?: {
      quantity?: number
      unit?: string
      notes?: string
      updateInventory?: boolean
      userTimezone?: string
    }
  ): Promise<DoseLog> {
    const now = new Date()

    // Get prescription to check maxDailyDose
    const prescriptionResponse = await fetch(`${this.baseUrl}/prescriptions/${prescriptionId}`)
    if (!prescriptionResponse.ok) {
      throw new Error('Failed to get prescription')
    }
    const prescription = await prescriptionResponse.json()

    // Check maxDailyDose if specified
    if (prescription.maxDailyDose) {
      const userTimezone = options?.userTimezone || prescription.schedules[0]?.timezone || 'UTC'
      const todayRange = this.getTodayRangeInTimezone(userTimezone)

      // Get today's taken doses
      const todayDosesResponse = await fetch(
        `${this.baseUrl}/dose?prescriptionId=${prescriptionId}&from=${todayRange.start.toISOString()}&to=${todayRange.end.toISOString()}&status=TAKEN`
      )

      if (todayDosesResponse.ok) {
        const todayDoses = await todayDosesResponse.json()
        const totalTakenToday = todayDoses.reduce((sum: number, dose: any) => {
          return sum + (dose.quantity || prescription.schedules[0]?.doseQuantity || 1)
        }, 0)

        const requestedQuantity = options?.quantity || prescription.schedules[0]?.doseQuantity || 1

        if (totalTakenToday + requestedQuantity > prescription.maxDailyDose) {
          throw new Error(`Daily PRN limit reached. Already taken ${totalTakenToday}/${prescription.maxDailyDose} today.`)
        }
      }
    }

    const response = await fetch(`${this.baseUrl}/dose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prescriptionId,
        scheduledFor: now.toISOString(),
        takenAt: now.toISOString(),
        status: 'TAKEN',
        quantity: options?.quantity,
        unit: options?.unit,
        notes: options?.notes,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create PRN dose')
    }

    const doseLog = await response.json()

    // Update inventory if requested
    if (options?.updateInventory && doseLog.prescription?.medication?.inventory) {
      try {
        const currentInventory = doseLog.prescription.medication.inventory
        const newQuantity = Math.max(0, currentInventory.currentQty - (options.quantity || 1))

        await fetch(`${this.baseUrl}/medications/${doseLog.prescription.medication.id}/inventory`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentQty: newQuantity,
            unit: currentInventory.unit,
            lowThreshold: currentInventory.lowThreshold,
          }),
        })
      } catch (error) {
        console.warn('Failed to update inventory after PRN dose:', error)
      }
    }

    return doseLog
  }

  // Helper method to get today's range in timezone
  private getTodayRangeInTimezone(timezone: string): { start: Date; end: Date } {
    const now = new Date()
    return tzDayRangeToUtc(timezone, now)
  }

  // ===== INVENTORY MANAGEMENT =====

  async restockMedication(
    medicationId: string,
    data: {
      quantity: number
      unit: string
      updateThreshold?: boolean
      newThreshold?: number
    }
  ): Promise<Inventory> {
    // Get current inventory
    const currentResponse = await fetch(`${this.baseUrl}/medications/${medicationId}/inventory`)

    if (!currentResponse.ok) {
      const error = await currentResponse.json()
      throw new Error(error.error || 'Failed to get current inventory')
    }

    const currentInventory = await currentResponse.json()
    const newQuantity = currentInventory.currentQty + data.quantity

    const response = await fetch(`${this.baseUrl}/medications/${medicationId}/inventory`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentQty: newQuantity,
        unit: data.unit,
        lowThreshold: data.updateThreshold ? data.newThreshold : currentInventory.lowThreshold,
        lastRestockedAt: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to restock medication')
    }

    return response.json()
  }

  async getLowStockMedications(threshold?: number): Promise<(Medication & { inventory: Inventory })[]> {
    const response = await fetch(`${this.baseUrl}/medications`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get medications')
    }

    const medications = await response.json()

    return medications.filter((med: Medication & { inventory?: Inventory }) => {
      if (!med.inventory) return false
      const checkThreshold = threshold || med.inventory.lowThreshold || 0
      return med.inventory.currentQty <= checkThreshold
    })
  }

  // ===== ANALYTICS & REPORTING =====

  async getAdherenceReport(options: {
    from: string
    to: string
    prescriptionId?: string
    groupBy?: 'day' | 'week' | 'month'
  }): Promise<{
    period: { from: string; to: string }
    overall: {
      total: number
      taken: number
      missed: number
      skipped: number
      scheduled: number
      adherenceRate: number
    }
    byMedication: Array<{
      medicationId: string
      medicationName: string
      total: number
      taken: number
      missed: number
      skipped: number
      scheduled: number
      adherenceRate: number
    }>
    trends?: Array<{
      date: string
      adherenceRate: number
      totalDoses: number
      takenDoses: number
    }>
  }> {
    const params = new URLSearchParams({
      from: options.from,
      to: options.to,
    })

    if (options.prescriptionId) {
      params.set('prescriptionId', options.prescriptionId)
    }

    const response = await fetch(`${this.baseUrl}/analytics/adherence?${params}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get adherence report')
    }

    return response.json()
  }

  async getDashboardData(): Promise<{
    summary: {
      medicationsCount: number
      activePrescriptionsCount: number
      lowStockCount: number
    }
    weeklyStats: {
      total: number
      taken: number
      missed: number
      skipped: number
      scheduled: number
      adherenceRate: number
    }
    lowStockMedications: (Medication & { inventory: Inventory })[]
    upcomingDoses: DoseLog[]
    recentDoses: DoseLog[]
  }> {
    const response = await fetch(`${this.baseUrl}/dashboard`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get dashboard data')
    }

    return response.json()
  }

  // ===== CARE PROVIDER MANAGEMENT =====

  async createCareProviderWithPrescriptions(data: {
    provider: {
      name: string
      email?: string
      phone?: string
      clinic?: string
    }
    prescriptions?: Array<{
      medicationId: string
      indication?: string
      asNeeded?: boolean
      maxDailyDose?: number
      instructions?: string
      startDate: string
      endDate?: string
    }>
  }): Promise<CareProvider & { prescriptions: Prescription[] }> {
    // Create care provider
    const providerResponse = await fetch(`${this.baseUrl}/care-providers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data.provider),
    })

    if (!providerResponse.ok) {
      const error = await providerResponse.json()
      throw new Error(error.error || 'Failed to create care provider')
    }

    const provider = await providerResponse.json()

    // Create prescriptions if provided
    const prescriptions: Prescription[] = []
    if (data.prescriptions) {
      for (const prescriptionData of data.prescriptions) {
        try {
          const prescriptionResponse = await fetch(`${this.baseUrl}/prescriptions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...prescriptionData,
              providerId: provider.id,
            }),
          })

          if (prescriptionResponse.ok) {
            const prescription = await prescriptionResponse.json()
            prescriptions.push(prescription)
          }
        } catch (error) {
          console.warn('Failed to create prescription for provider:', error)
        }
      }
    }

    return { ...provider, prescriptions }
  }

  // ===== BULK OPERATIONS =====

  async bulkUpdateDoses(
    doseLogIds: string[],
    updates: {
      status?: 'SCHEDULED' | 'TAKEN' | 'SKIPPED' | 'MISSED'
      takenAt?: string
      scheduledFor?: string
    }
  ): Promise<DoseLog[]> {
    const results: DoseLog[] = []
    const errors: string[] = []

    // Process in batches to avoid overwhelming the server
    const batchSize = 10
    for (let i = 0; i < doseLogIds.length; i += batchSize) {
      const batch = doseLogIds.slice(i, i + batchSize)

      const batchPromises = batch.map(async (doseLogId) => {
        try {
          const response = await fetch(`${this.baseUrl}/dose/${doseLogId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          })

          if (response.ok) {
            return await response.json()
          } else {
            const error = await response.json()
            throw new Error(error.error || 'Failed to update dose')
          }
        } catch (error) {
          errors.push(`Dose ${doseLogId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          return null
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults.filter(Boolean))
    }

    if (errors.length > 0) {
      console.warn('Some doses failed to update:', errors)
    }

    return results
  }

  async bulkGenerateDoses(
    prescriptionIds: string[],
    options: {
      from: string
      to: string
    }
  ): Promise<{ [prescriptionId: string]: { generatedDoses: DoseLog[]; message: string } }> {
    const results: { [prescriptionId: string]: { generatedDoses: DoseLog[]; message: string } } = {}
    const errors: string[] = []

    for (const prescriptionId of prescriptionIds) {
      try {
        const result = await this.generateDosesForPrescription(prescriptionId, options)
        results[prescriptionId] = result
      } catch (error) {
        errors.push(`Prescription ${prescriptionId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    if (errors.length > 0) {
      console.warn('Some prescriptions failed to generate doses:', errors)
    }

    return results
  }
}

// Export singleton instance
export const medicationService = new MedicationService()
