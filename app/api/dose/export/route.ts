import { shouldBeMarkedAsMissed } from '@/lib/dose-utils'
import { getUserIdFromSession } from '@/lib/session'
import prisma from '@/prisma/prisma-client'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Export dose logs to CSV format
 * GET /api/dose/export?from=...&to=...&status=...&prescriptionId=...
 */
export async function GET(request: NextRequest) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const prescriptionId = searchParams.get('prescriptionId')
    const status = searchParams.get('status')

    // Get user's prescriptions to filter dose logs
    const userPrescriptions = await prisma.prescription.findMany({
      where: { userId },
      select: { id: true },
    })

    const prescriptionIds = userPrescriptions.map((p) => p.id)

    const whereClause: any = {
      prescriptionId: { in: prescriptionIds },
    }

    if (from && to) {
      whereClause.scheduledFor = {
        gte: new Date(from),
        lte: new Date(to),
      }
    }

    if (prescriptionId) {
      whereClause.prescriptionId = prescriptionId
    }

    if (status) {
      whereClause.status = status
    }

    const doseLogs = await prisma.doseLog.findMany({
      where: whereClause,
      include: {
        prescription: {
          include: {
            medication: true,
          },
        },
        schedule: true,
      },
      orderBy: { scheduledFor: 'desc' },
    })

    // Get user's timezone and time format
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId },
    })
    const userTimezone = userSettings?.timezone || 'UTC'
    const timeFormat = userSettings?.timeFormat || 'H24'

    // Mark missed doses before exporting
    const now = new Date()
    const missedDoseIds: string[] = []

    for (const doseLog of doseLogs) {
      if (shouldBeMarkedAsMissed(doseLog as any, userTimezone, now)) {
        missedDoseIds.push(doseLog.id)
      }
    }

    // Update missed doses in database
    if (missedDoseIds.length > 0) {
      await prisma.doseLog.updateMany({
        where: {
          id: {
            in: missedDoseIds,
          },
        },
        data: {
          status: 'MISSED',
        },
      })

      // Update the doseLogs array to reflect the new status
      for (const doseLog of doseLogs) {
        if (missedDoseIds.includes(doseLog.id)) {
          doseLog.status = 'MISSED'
        }
      }
    }

    // Convert to CSV
    const csvRows: string[] = []

    // CSV Headers
    csvRows.push('Date,Time,Medication,Status,Taken At,Quantity,Unit,Notes')

    // CSV Data rows
    for (const log of doseLogs) {
      // Convert Date objects to timezone-aware dates
      const scheduledDate = log.scheduledFor instanceof Date ? log.scheduledFor : new Date(log.scheduledFor)
      const scheduledInTz = toZonedTime(scheduledDate, userTimezone)

      // Format date
      const dateStr = format(scheduledInTz, 'yyyy-MM-dd')

      // Format time based on user's time format
      const timeStr = timeFormat === 'H12' ? format(scheduledInTz, 'h:mm a') : format(scheduledInTz, 'HH:mm')

      // Format takenAt if exists
      let takenAtStr = ''
      if (log.takenAt) {
        const takenDate = log.takenAt instanceof Date ? log.takenAt : new Date(log.takenAt)
        const takenInTz = toZonedTime(takenDate, userTimezone)
        takenAtStr =
          timeFormat === 'H12' ? format(takenInTz, 'yyyy-MM-dd h:mm a') : format(takenInTz, 'yyyy-MM-dd HH:mm')
      }

      // Get medication name
      const medicationName = log.prescription?.medication?.name || 'Unknown Medication'

      // Escape CSV values (handle commas and quotes)
      const escapeCsv = (value: string | null | undefined): string => {
        if (!value) return ''
        const str = String(value)
        // If contains comma, quote, or newline, wrap in quotes and escape quotes
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }

      csvRows.push(
        [
          dateStr,
          timeStr,
          escapeCsv(medicationName),
          log.status,
          escapeCsv(takenAtStr),
          log.quantity?.toString() || '',
          log.unit || '',
          escapeCsv(log.notes),
        ].join(','),
      )
    }

    const csvContent = csvRows.join('\n')

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="pillmind-logs-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting dose logs:', error)
    return NextResponse.json({ error: 'Failed to export dose logs' }, { status: 500 })
  }
}
