import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/prisma-client'
import { getUserIdFromSession } from '@/lib/session'

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

    if (!from || !to) {
      return NextResponse.json({ error: 'from and to dates are required' }, { status: 400 })
    }

    // Get user's prescriptions to filter dose logs
    const userPrescriptions = await prisma.prescription.findMany({
      where: { userId },
      select: { id: true },
    })

    const prescriptionIds = userPrescriptions.map(p => p.id)

    const whereClause: any = {
      prescriptionId: { in: prescriptionIds },
      scheduledFor: {
        gte: new Date(from),
        lte: new Date(to),
      },
    }

    if (prescriptionId) {
      whereClause.prescriptionId = prescriptionId
    }

    const doseLogs = await prisma.doseLog.findMany({
      where: whereClause,
      include: {
        prescription: {
          include: {
            medication: true,
          },
        },
      },
    })

    // Calculate adherence statistics
    const totalDoses = doseLogs.length
    const takenDoses = doseLogs.filter(dl => dl.status === 'TAKEN').length
    const missedDoses = doseLogs.filter(dl => dl.status === 'MISSED').length
    const skippedDoses = doseLogs.filter(dl => dl.status === 'SKIPPED').length
    const scheduledDoses = doseLogs.filter(dl => dl.status === 'SCHEDULED').length

    const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / (takenDoses + missedDoses + skippedDoses)) * 100) : 100

    // Group by medication
    const medicationStats = doseLogs.reduce((acc, dl) => {
      const medId = dl.prescription.medication.id
      const medName = dl.prescription.medication.name

      if (!acc[medId]) {
        acc[medId] = {
          medicationId: medId,
          medicationName: medName,
          total: 0,
          taken: 0,
          missed: 0,
          skipped: 0,
          scheduled: 0,
          adherenceRate: 0,
        }
      }

      acc[medId].total++
      if (dl.status === 'TAKEN') acc[medId].taken++
      else if (dl.status === 'MISSED') acc[medId].missed++
      else if (dl.status === 'SKIPPED') acc[medId].skipped++
      else if (dl.status === 'SCHEDULED') acc[medId].scheduled++

      return acc
    }, {} as Record<string, any>)

    // Calculate adherence rate for each medication
    Object.values(medicationStats).forEach((stat: any) => {
      stat.adherenceRate = stat.total > 0
        ? Math.round((stat.taken / (stat.taken + stat.missed + stat.skipped)) * 100)
        : 100
    })

    return NextResponse.json({
      period: { from, to },
      overall: {
        total: totalDoses,
        taken: takenDoses,
        missed: missedDoses,
        skipped: skippedDoses,
        scheduled: scheduledDoses,
        adherenceRate,
      },
      byMedication: Object.values(medicationStats),
    })
  } catch (error) {
    console.error('Error calculating adherence:', error)
    return NextResponse.json({ error: 'Failed to calculate adherence' }, { status: 500 })
  }
}
