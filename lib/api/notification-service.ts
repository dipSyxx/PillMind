import { DoseLog, UserSettings } from '@/types/medication'

export interface NotificationPreferences {
  channels: ('EMAIL' | 'SMS' | 'PUSH')[]
  timing: {
    reminderMinutes: number[]
    snoozeOptions: number[]
    maxSnoozes: number
  }
  quietHours: {
    enabled: boolean
    start: string // HH:mm format
    end: string // HH:mm format
  }
  weekendSettings: {
    enabled: boolean
    differentTiming: boolean
    weekendTiming?: {
      reminderMinutes: number[]
    }
  }
}

export interface NotificationTemplate {
  id: string
  type: 'REMINDER' | 'MISSED' | 'LOW_STOCK' | 'ADHERENCE_REPORT'
  channel: 'EMAIL' | 'SMS' | 'PUSH'
  subject?: string
  message: string
  variables: string[]
}

export interface ScheduledNotification {
  id: string
  doseLogId: string
  scheduledFor: string
  channel: 'EMAIL' | 'SMS' | 'PUSH'
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'CANCELLED'
  attempts: number
  lastAttempt?: string
  error?: string
}

export class NotificationService {
  private baseUrl = '/api'

  // ===== NOTIFICATION PREFERENCES =====

  async updateNotificationPreferences(preferences: NotificationPreferences): Promise<NotificationPreferences> {
    // This would typically update user settings
    // For now, we'll store in localStorage as a fallback
    localStorage.setItem('notificationPreferences', JSON.stringify(preferences))
    return preferences
  }

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    const stored = localStorage.getItem('notificationPreferences')
    if (stored) {
      return JSON.parse(stored)
    }

    // Default preferences
    return {
      channels: ['PUSH', 'EMAIL'],
      timing: {
        reminderMinutes: [15, 5, 0], // 15 min before, 5 min before, at time
        snoozeOptions: [5, 15, 30, 60], // minutes
        maxSnoozes: 3,
      },
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00',
      },
      weekendSettings: {
        enabled: true,
        differentTiming: false,
      },
    }
  }

  // ===== SMART REMINDER SCHEDULING =====

  async scheduleSmartReminders(
    doseLogs: DoseLog[],
    userSettings: UserSettings,
    preferences?: NotificationPreferences
  ): Promise<ScheduledNotification[]> {
    const prefs = preferences || await this.getNotificationPreferences()
    const scheduledNotifications: ScheduledNotification[] = []

    for (const doseLog of doseLogs) {
      if (doseLog.status !== 'SCHEDULED') continue

      const scheduledTime = new Date(doseLog.scheduledFor)
      const now = new Date()

      // Skip if dose is in the past
      if (scheduledTime <= now) continue

      // Check quiet hours
      if (this.isInQuietHours(scheduledTime, prefs.quietHours)) {
        continue
      }

      // Schedule reminders for each channel
      for (const channel of prefs.channels) {
        for (const minutesBefore of prefs.timing.reminderMinutes) {
          const reminderTime = new Date(scheduledTime.getTime() - minutesBefore * 60 * 1000)

          // Don't schedule reminders in the past
          if (reminderTime <= now) continue

          const notification: ScheduledNotification = {
            id: `${doseLog.id}_${channel}_${minutesBefore}`,
            doseLogId: doseLog.id,
            scheduledFor: reminderTime.toISOString(),
            channel,
            status: 'PENDING',
            attempts: 0,
          }

          scheduledNotifications.push(notification)
        }
      }
    }

    return scheduledNotifications
  }

  async scheduleMissedDoseNotifications(
    missedDoses: DoseLog[],
    preferences?: NotificationPreferences
  ): Promise<ScheduledNotification[]> {
    const prefs = preferences || await this.getNotificationPreferences()
    const notifications: ScheduledNotification[] = []

    for (const dose of missedDoses) {
      const missedTime = new Date(dose.scheduledFor)
      const now = new Date()

      // Only notify about doses missed in the last 24 hours
      if (now.getTime() - missedTime.getTime() > 24 * 60 * 60 * 1000) continue

      for (const channel of prefs.channels) {
        const notification: ScheduledNotification = {
          id: `missed_${dose.id}_${channel}`,
          doseLogId: dose.id,
          scheduledFor: new Date(missedTime.getTime() + 30 * 60 * 1000).toISOString(), // 30 min after missed
          channel,
          status: 'PENDING',
          attempts: 0,
        }

        notifications.push(notification)
      }
    }

    return notifications
  }

  // ===== LOW STOCK NOTIFICATIONS =====

  async scheduleLowStockNotifications(
    lowStockMedications: Array<{ id: string; name: string; inventory: { currentQty: number; lowThreshold?: number } }>,
    preferences?: NotificationPreferences
  ): Promise<ScheduledNotification[]> {
    const prefs = preferences || await this.getNotificationPreferences()
    const notifications: ScheduledNotification[] = []

    for (const medication of lowStockMedications) {
      const severity = this.getStockSeverity(medication.inventory.currentQty, medication.inventory.lowThreshold || 0)

      // Only notify for critical or low stock
      if (severity === 'adequate') continue

      for (const channel of prefs.channels) {
        const notification: ScheduledNotification = {
          id: `low_stock_${medication.id}_${channel}`,
          doseLogId: '', // Not related to a specific dose
          scheduledFor: new Date().toISOString(), // Send immediately
          channel,
          status: 'PENDING',
          attempts: 0,
        }

        notifications.push(notification)
      }
    }

    return notifications
  }

  // ===== ADHERENCE REPORTS =====

  async scheduleAdherenceReports(
    userSettings: UserSettings,
    preferences?: NotificationPreferences
  ): Promise<ScheduledNotification[]> {
    const prefs = preferences || await this.getNotificationPreferences()
    const notifications: ScheduledNotification[] = []

    // Schedule weekly report (every Monday at 9 AM)
    const now = new Date()
    const nextMonday = new Date(now)
    nextMonday.setDate(now.getDate() + (1 + 7 - now.getDay()) % 7)
    nextMonday.setHours(9, 0, 0, 0)

    // If it's already Monday and past 9 AM, schedule for next week
    if (now.getDay() === 1 && now.getHours() >= 9) {
      nextMonday.setDate(nextMonday.getDate() + 7)
    }

    for (const channel of prefs.channels) {
      const notification: ScheduledNotification = {
        id: `weekly_report_${nextMonday.toISOString().split('T')[0]}_${channel}`,
        doseLogId: '',
        scheduledFor: nextMonday.toISOString(),
        channel,
        status: 'PENDING',
        attempts: 0,
      }

      notifications.push(notification)
    }

    return notifications
  }

  // ===== NOTIFICATION TEMPLATES =====

  getNotificationTemplates(): NotificationTemplate[] {
    return [
      {
        id: 'reminder_push',
        type: 'REMINDER',
        channel: 'PUSH',
        message: 'Time to take your {{medicationName}} ({{doseQuantity}} {{doseUnit}})',
        variables: ['medicationName', 'doseQuantity', 'doseUnit'],
      },
      {
        id: 'reminder_email',
        type: 'REMINDER',
        channel: 'EMAIL',
        subject: 'Medication Reminder: {{medicationName}}',
        message: 'Hi {{userName}},\n\nIt\'s time to take your {{medicationName}} ({{doseQuantity}} {{doseUnit}}).\n\nScheduled time: {{scheduledTime}}\n\nTake care!',
        variables: ['userName', 'medicationName', 'doseQuantity', 'doseUnit', 'scheduledTime'],
      },
      {
        id: 'missed_push',
        type: 'MISSED',
        channel: 'PUSH',
        message: 'You missed your {{medicationName}} dose. Take it now or mark as skipped.',
        variables: ['medicationName'],
      },
      {
        id: 'low_stock_email',
        type: 'LOW_STOCK',
        channel: 'EMAIL',
        subject: 'Low Stock Alert: {{medicationName}}',
        message: 'Hi {{userName}},\n\nYour {{medicationName}} is running low ({{currentQty}} {{unit}} remaining).\n\nConsider refilling your prescription soon.\n\nTake care!',
        variables: ['userName', 'medicationName', 'currentQty', 'unit'],
      },
      {
        id: 'adherence_report_email',
        type: 'ADHERENCE_REPORT',
        channel: 'EMAIL',
        subject: 'Weekly Medication Adherence Report',
        message: 'Hi {{userName}},\n\nHere\'s your weekly medication adherence summary:\n\nOverall Adherence: {{adherenceRate}}%\nTotal Doses: {{totalDoses}}\nTaken: {{takenDoses}}\nMissed: {{missedDoses}}\n\n{{insights}}\n\n{{recommendations}}\n\nKeep up the great work!',
        variables: ['userName', 'adherenceRate', 'totalDoses', 'takenDoses', 'missedDoses', 'insights', 'recommendations'],
      },
    ]
  }

  // ===== NOTIFICATION PROCESSING =====

  async processScheduledNotifications(): Promise<{
    processed: number
    sent: number
    failed: number
    errors: string[]
  }> {
    // This would typically be called by a background job
    // For now, we'll simulate the processing

    const response = await fetch(`${this.baseUrl}/notifications`)

    if (!response.ok) {
      throw new Error('Failed to get notifications')
    }

    const notifications = await response.json()
    const pendingNotifications = notifications.filter((n: any) => n.status === 'PENDING')

    let processed = 0
    let sent = 0
    let failed = 0
    const errors: string[] = []

    for (const notification of pendingNotifications) {
      processed++

      try {
        await this.sendNotification(notification)
        sent++
      } catch (error) {
        failed++
        errors.push(`Notification ${notification.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return { processed, sent, failed, errors }
  }

  private async sendNotification(notification: ScheduledNotification): Promise<void> {
    // Simulate sending notification
    // In a real implementation, this would integrate with email/SMS/push services

    const template = this.getNotificationTemplates().find(
      t => t.type === 'REMINDER' && t.channel === notification.channel
    )

    if (!template) {
      throw new Error(`No template found for ${notification.channel} notifications`)
    }

    // Simulate API call to send notification
    await new Promise(resolve => setTimeout(resolve, 100))

    // Update notification status
    await fetch(`${this.baseUrl}/notifications/${notification.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'SENT',
        sentAt: new Date().toISOString(),
      }),
    })
  }

  // ===== HELPER METHODS =====

  private isInQuietHours(time: Date, quietHours: { enabled: boolean; start: string; end: string }): boolean {
    if (!quietHours.enabled) return false

    const timeStr = time.toTimeString().slice(0, 5) // HH:mm format
    const start = quietHours.start
    const end = quietHours.end

    if (start <= end) {
      // Same day quiet hours (e.g., 22:00 to 23:00)
      return timeStr >= start && timeStr <= end
    } else {
      // Overnight quiet hours (e.g., 22:00 to 08:00)
      return timeStr >= start || timeStr <= end
    }
  }

  private getStockSeverity(currentQty: number, lowThreshold: number): 'critical' | 'low' | 'adequate' {
    if (currentQty === 0) return 'critical'
    if (currentQty <= lowThreshold) return 'low'
    return 'adequate'
  }

  // ===== BULK OPERATIONS =====

  async bulkScheduleNotifications(
    notifications: Omit<ScheduledNotification, 'id' | 'status' | 'attempts'>[]
  ): Promise<ScheduledNotification[]> {
    const scheduledNotifications: ScheduledNotification[] = []

    for (const notification of notifications) {
      const scheduledNotification: ScheduledNotification = {
        ...notification,
        id: `${notification.doseLogId}_${notification.channel}_${Date.now()}`,
        status: 'PENDING',
        attempts: 0,
      }

      scheduledNotifications.push(scheduledNotification)
    }

    return scheduledNotifications
  }

  async cancelNotifications(notificationIds: string[]): Promise<{
    cancelled: number
    errors: string[]
  }> {
    let cancelled = 0
    const errors: string[] = []

    for (const id of notificationIds) {
      try {
        await fetch(`${this.baseUrl}/notifications/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'CANCELLED' }),
        })
        cancelled++
      } catch (error) {
        errors.push(`Failed to cancel notification ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return { cancelled, errors }
  }
}

// Export singleton instance
export const notificationService = new NotificationService()
