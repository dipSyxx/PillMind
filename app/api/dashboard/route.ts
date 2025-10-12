import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/prisma-client'
import { getUserIdFromSession } from '@/lib/session'

export async function GET() {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get current week dates
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + 1) // Monday
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6) // Sunday
    weekEnd.setHours(23, 59, 59, 999)

    // Get user's prescriptions
    const userPrescriptions = await prisma.prescription.findMany({
      where: { userId },
      select: { id: true },
    })

    const prescriptionIds = userPrescriptions.map(p => p.id)

    // Get medications count
    const medicationsCount = await prisma.medication.count({
      where: { userId },
    })

    // Get active prescriptions count
    const activePrescriptionsCount = await prisma.prescription.count({
      where: {
        userId,
        OR: [
          { endDate: null },
          { endDate: { gt: now } },
        ],
      },
    })

    // Get this week's dose logs
    const weekDoseLogs = await prisma.doseLog.findMany({
      where: {
        prescriptionId: { in: prescriptionIds },
        scheduledFor: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    })

    // Calculate weekly statistics
    const totalDoses = weekDoseLogs.length
    const takenDoses = weekDoseLogs.filter(dl => dl.status === 'TAKEN').length
    const missedDoses = weekDoseLogs.filter(dl => dl.status === 'MISSED').length
    const skippedDoses = weekDoseLogs.filter(dl => dl.status === 'SKIPPED').length
    const scheduledDoses = weekDoseLogs.filter(dl => dl.status === 'SCHEDULED').length

    const adherenceRate = totalDoses > 0
      ? Math.round((takenDoses / (takenDoses + missedDoses + skippedDoses)) * 100)
      : 100

    // Get low stock medications
    const lowStockMedications = await prisma.medication.findMany({
      where: {
        userId,
        inventory: {
          AND: [
            { lowThreshold: { not: null } },
            { currentQty: { lte: prisma.inventory.fields.lowThreshold } },
          ],
        },
      },
      include: {
        inventory: true,
      },
    })

    // Get upcoming doses (next 24 hours)
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const upcomingDoses = await prisma.doseLog.findMany({
      where: {
        prescriptionId: { in: prescriptionIds },
        scheduledFor: {
          gte: now,
          lte: tomorrow,
        },
        status: 'SCHEDULED',
      },
      include: {
        prescription: {
          include: {
            medication: true,
          },
        },
        schedule: true,
      },
      orderBy: { scheduledFor: 'asc' },
      take: 10,
    })

    // Get recent dose logs
    const recentDoses = await prisma.doseLog.findMany({
      where: {
        prescriptionId: { in: prescriptionIds },
        status: { in: ['TAKEN', 'SKIPPED'] },
      },
      include: {
        prescription: {
          include: {
            medication: true,
          },
        },
      },
      orderBy: { takenAt: 'desc' },
      take: 10,
    })

    return NextResponse.json({
      summary: {
        medicationsCount,
        activePrescriptionsCount,
        lowStockCount: lowStockMedications.length,
      },
      weeklyStats: {
        total: totalDoses,
        taken: takenDoses,
        missed: missedDoses,
        skipped: skippedDoses,
        scheduled: scheduledDoses,
        adherenceRate,
      },
      lowStockMedications,
      upcomingDoses,
      recentDoses,
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
