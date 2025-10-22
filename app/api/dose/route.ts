import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/prisma-client'
import { getUserIdFromSession } from '@/lib/session'
import { z } from 'zod'

const doseLogSchema = z.object({
  prescriptionId: z.string().min(1),
  scheduleId: z.string().optional(),
  scheduledFor: z.string().datetime(),
  takenAt: z.string().datetime().optional(),
  status: z.enum(['SCHEDULED', 'TAKEN', 'SKIPPED', 'MISSED']),
  quantity: z.number().positive().optional(),
  unit: z.enum(['MG', 'MCG', 'G', 'ML', 'IU', 'DROP', 'PUFF', 'UNIT', 'TAB', 'CAPS']).optional(),
  notes: z.string().optional(),
})

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


    const prescriptionIds = userPrescriptions.map(p => p.id)

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
            medication: {
              include: {
                inventory: true,
              },
            },
            provider: true,
          },
        },
        schedule: true,
      },
      orderBy: { scheduledFor: 'desc' },
    })

    return NextResponse.json(doseLogs)
  } catch (error) {
    console.error('Error fetching dose logs:', error)
    return NextResponse.json({ error: 'Failed to fetch dose logs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = doseLogSchema.parse(body)

    // Verify that the prescription belongs to the user
    const prescription = await prisma.prescription.findFirst({
      where: { id: validatedData.prescriptionId, userId },
    })

    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    // Verify that the schedule belongs to the prescription (if provided)
    if (validatedData.scheduleId) {
      const schedule = await prisma.schedule.findFirst({
        where: {
          id: validatedData.scheduleId,
          prescriptionId: validatedData.prescriptionId,
        },
      })

      if (!schedule) {
        return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
      }
    }

    const doseLog = await prisma.doseLog.create({
      data: {
        prescriptionId: validatedData.prescriptionId,
        scheduleId: validatedData.scheduleId,
        scheduledFor: new Date(validatedData.scheduledFor),
        takenAt: validatedData.takenAt ? new Date(validatedData.takenAt) : null,
        status: validatedData.status,
        quantity: validatedData.quantity,
        unit: validatedData.unit,
        notes: validatedData.notes,
      },
      include: {
        prescription: {
          include: {
            medication: {
              include: {
                inventory: true,
              },
            },
            provider: true,
          },
        },
        schedule: true,
      },
    })

    return NextResponse.json(doseLog, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error creating dose log:', error)
    return NextResponse.json({ error: 'Failed to create dose log' }, { status: 500 })
  }
}
