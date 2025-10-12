import { DoseLog, Medication, Prescription } from '@/types/medication'

export interface AdherenceMetrics {
  totalDoses: number
  takenDoses: number
  missedDoses: number
  skippedDoses: number
  scheduledDoses: number
  adherenceRate: number
  onTimeRate: number
  lateRate: number
}

export interface MedicationAdherence {
  medicationId: string
  medicationName: string
  metrics: AdherenceMetrics
  trends: Array<{
    date: string
    adherenceRate: number
    totalDoses: number
    takenDoses: number
  }>
}

export interface WeeklyReport {
  weekStart: string
  weekEnd: string
  overallMetrics: AdherenceMetrics
  medicationBreakdown: MedicationAdherence[]
  dailyBreakdown: Array<{
    date: string
    metrics: AdherenceMetrics
    doses: DoseLog[]
  }>
  insights: string[]
  recommendations: string[]
}

export interface InventoryReport {
  totalMedications: number
  lowStockCount: number
  outOfStockCount: number
  expiringSoonCount: number
  medications: Array<{
    medication: Medication
    inventory: {
      currentQty: number
      unit: string
      lowThreshold?: number
      lastRestockedAt?: string
      daysSinceRestock: number
    }
    usage: {
      dailyAverage: number
      daysRemaining: number
      restockRecommendation: string
    }
  }>
}

export class AnalyticsService {
  private baseUrl = '/api'

  // ===== ADHERENCE ANALYTICS =====

  async getComprehensiveAdherenceReport(options: {
    from: string
    to: string
    prescriptionId?: string
    groupBy?: 'day' | 'week' | 'month'
    includeTrends?: boolean
    includeInsights?: boolean
  }): Promise<{
    period: { from: string; to: string }
    overall: AdherenceMetrics
    byMedication: MedicationAdherence[]
    dailyBreakdown?: Array<{
      date: string
      metrics: AdherenceMetrics
    }>
    insights?: string[]
    recommendations?: string[]
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

    const data = await response.json()

    // Enhance with additional analytics
    const enhancedData = {
      ...data,
      overall: this.calculateEnhancedMetrics(data.overall),
      byMedication: data.byMedication.map((med: any) => ({
        ...med,
        metrics: this.calculateEnhancedMetrics(med),
      })),
    }

    // Add insights and recommendations if requested
    if (options.includeInsights) {
      enhancedData.insights = this.generateInsights(enhancedData)
      enhancedData.recommendations = this.generateRecommendations(enhancedData)
    }

    return enhancedData
  }

  async getWeeklyReport(weekStart: string): Promise<WeeklyReport> {
    const weekEnd = new Date(new Date(weekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString()

    // Get comprehensive adherence data
    const adherenceData = await this.getComprehensiveAdherenceReport({
      from: weekStart,
      to: weekEnd,
      includeTrends: true,
      includeInsights: true,
    })

    // Get daily breakdown
    const dailyBreakdown = await this.getDailyBreakdown(weekStart, weekEnd)

    return {
      weekStart,
      weekEnd,
      overallMetrics: adherenceData.overall,
      medicationBreakdown: adherenceData.byMedication,
      dailyBreakdown,
      insights: adherenceData.insights || [],
      recommendations: adherenceData.recommendations || [],
    }
  }

  async getDailyBreakdown(from: string, to: string): Promise<Array<{
    date: string
    metrics: AdherenceMetrics
    doses: DoseLog[]
  }>> {
    const response = await fetch(`${this.baseUrl}/dose?from=${from}&to=${to}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get dose logs')
    }

    const doseLogs = await response.json()

    // Group by date
    const dailyGroups = doseLogs.reduce((groups: { [key: string]: DoseLog[] }, dose: DoseLog) => {
      const date = new Date(dose.scheduledFor).toISOString().split('T')[0]
      if (!groups[date]) groups[date] = []
      groups[date].push(dose)
      return groups
    }, {})

    // Calculate metrics for each day
    return Object.entries(dailyGroups).map(([date, doses]) => ({
      date,
      metrics: this.calculateMetricsFromDoses(doses as DoseLog[]),
      doses: doses as DoseLog[],
    }))
  }

  // ===== INVENTORY ANALYTICS =====

  async getInventoryReport(): Promise<InventoryReport> {
    const response = await fetch(`${this.baseUrl}/medications`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get medications')
    }

    const medications = await response.json()

    // Get dose logs for usage calculation (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const doseResponse = await fetch(`${this.baseUrl}/dose?from=${thirtyDaysAgo}`)

    let doseLogs: DoseLog[] = []
    if (doseResponse.ok) {
      doseLogs = await doseResponse.json()
    }

    const inventoryData = medications
      .filter((med: any) => med.inventory)
      .map((med: any) => {
        const medicationDoses = doseLogs.filter(
          (dose: DoseLog) => dose.prescriptionId === med.id && dose.status === 'TAKEN'
        )

        const dailyAverage = medicationDoses.length / 30
        const daysRemaining = med.inventory.currentQty / Math.max(dailyAverage, 0.1)

        let restockRecommendation = 'Stock is adequate'
        if (daysRemaining < 7) {
          restockRecommendation = 'Urgent restock needed'
        } else if (daysRemaining < 14) {
          restockRecommendation = 'Restock recommended'
        } else if (daysRemaining < 30) {
          restockRecommendation = 'Plan restock soon'
        }

        return {
          medication: med,
          inventory: {
            ...med.inventory,
            daysSinceRestock: med.inventory.lastRestockedAt
              ? Math.floor((Date.now() - new Date(med.inventory.lastRestockedAt).getTime()) / (24 * 60 * 60 * 1000))
              : 999,
          },
          usage: {
            dailyAverage,
            daysRemaining,
            restockRecommendation,
          },
        }
      })

    const lowStockCount = inventoryData.filter(
      (item: any) => item.inventory.currentQty <= (item.inventory.lowThreshold || 0)
    ).length

    const outOfStockCount = inventoryData.filter(
      (item: any) => item.inventory.currentQty === 0
    ).length

    return {
      totalMedications: medications.length,
      lowStockCount,
      outOfStockCount,
      expiringSoonCount: 0, // Would need expiration dates in schema
      medications: inventoryData,
    }
  }

  // ===== PREDICTIVE ANALYTICS =====

  async getAdherencePrediction(
    prescriptionId: string,
    daysAhead: number = 30
  ): Promise<{
    predictedAdherenceRate: number
    confidence: number
    riskFactors: string[]
    recommendations: string[]
  }> {
    // Get historical data (last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

    const response = await fetch(`${this.baseUrl}/dose?from=${ninetyDaysAgo}&prescriptionId=${prescriptionId}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get historical data')
    }

    const doseLogs = await response.json()

    // Calculate historical adherence
    const historicalMetrics = this.calculateMetricsFromDoses(doseLogs)

    // Simple prediction based on recent trends
    const recentDoses = doseLogs.filter(
      (dose: DoseLog) => new Date(dose.scheduledFor) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    )
    const recentMetrics = this.calculateMetricsFromDoses(recentDoses)

    // Weighted prediction (70% recent, 30% historical)
    const predictedAdherenceRate = Math.round(
      (recentMetrics.adherenceRate * 0.7) + (historicalMetrics.adherenceRate * 0.3)
    )

    // Calculate confidence based on data consistency
    const adherenceVariance = Math.abs(recentMetrics.adherenceRate - historicalMetrics.adherenceRate)
    const confidence = Math.max(0, 100 - adherenceVariance)

    // Identify risk factors
    const riskFactors: string[] = []
    if (recentMetrics.adherenceRate < 80) {
      riskFactors.push('Low recent adherence rate')
    }
    if (recentMetrics.missedDoses > recentMetrics.takenDoses * 0.2) {
      riskFactors.push('High missed dose rate')
    }
    if (recentMetrics.lateRate > 30) {
      riskFactors.push('High late dose rate')
    }

    // Generate recommendations
    const recommendations: string[] = []
    if (predictedAdherenceRate < 80) {
      recommendations.push('Consider setting up medication reminders')
      recommendations.push('Review medication schedule for conflicts')
    }
    if (riskFactors.length > 0) {
      recommendations.push('Schedule a follow-up with healthcare provider')
    }
    if (recentMetrics.lateRate > 30) {
      recommendations.push('Consider adjusting medication timing')
    }

    return {
      predictedAdherenceRate,
      confidence,
      riskFactors,
      recommendations,
    }
  }

  // ===== HELPER METHODS =====

  private calculateEnhancedMetrics(data: any): AdherenceMetrics {
    const total = data.total || 0
    const taken = data.taken || 0
    const missed = data.missed || 0
    const skipped = data.skipped || 0
    const scheduled = data.scheduled || 0

    const adherenceRate = total > 0 ? Math.round((taken / (taken + missed + skipped)) * 100) : 0

    // Calculate on-time and late rates (simplified)
    const onTimeRate = Math.round((taken * 0.8) / total * 100) // Assume 80% of taken doses are on time
    const lateRate = Math.round((taken * 0.2) / total * 100) // Assume 20% of taken doses are late

    return {
      totalDoses: total,
      takenDoses: taken,
      missedDoses: missed,
      skippedDoses: skipped,
      scheduledDoses: scheduled,
      adherenceRate,
      onTimeRate,
      lateRate,
    }
  }

  private calculateMetricsFromDoses(doses: DoseLog[]): AdherenceMetrics {
    const total = doses.length
    const taken = doses.filter(d => d.status === 'TAKEN').length
    const missed = doses.filter(d => d.status === 'MISSED').length
    const skipped = doses.filter(d => d.status === 'SKIPPED').length
    const scheduled = doses.filter(d => d.status === 'SCHEDULED').length

    const adherenceRate = total > 0 ? Math.round((taken / (taken + missed + skipped)) * 100) : 0
    const onTimeRate = Math.round((taken * 0.8) / total * 100)
    const lateRate = Math.round((taken * 0.2) / total * 100)

    return {
      totalDoses: total,
      takenDoses: taken,
      missedDoses: missed,
      skippedDoses: skipped,
      scheduledDoses: scheduled,
      adherenceRate,
      onTimeRate,
      lateRate,
    }
  }

  private generateInsights(data: any): string[] {
    const insights: string[] = []
    const overall = data.overall

    if (overall.adherenceRate >= 95) {
      insights.push('Excellent medication adherence! Keep up the great work.')
    } else if (overall.adherenceRate >= 80) {
      insights.push('Good medication adherence with room for improvement.')
    } else if (overall.adherenceRate >= 60) {
      insights.push('Medication adherence needs attention.')
    } else {
      insights.push('Medication adherence is significantly below target.')
    }

    if (overall.missedDoses > overall.takenDoses * 0.1) {
      insights.push('High number of missed doses detected.')
    }

    if (overall.skippedDoses > 0) {
      insights.push('Some doses were intentionally skipped.')
    }

    return insights
  }

  private generateRecommendations(data: any): string[] {
    const recommendations: string[] = []
    const overall = data.overall

    if (overall.adherenceRate < 80) {
      recommendations.push('Set up medication reminders')
      recommendations.push('Use a pill organizer')
      recommendations.push('Link medication to daily routines')
    }

    if (overall.missedDoses > overall.takenDoses * 0.1) {
      recommendations.push('Consider medication reminder apps')
      recommendations.push('Discuss with healthcare provider about missed doses')
    }

    if (overall.lateRate > 30) {
      recommendations.push('Review medication timing')
      recommendations.push('Consider adjusting schedule to fit daily routine')
    }

    return recommendations
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService()
