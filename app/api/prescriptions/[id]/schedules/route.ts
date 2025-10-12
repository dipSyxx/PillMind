import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/prisma-client'
import { getUserIdFromSession } from '@/lib/session'
import { z } from 'zod'

const scheduleSchema = z.object({
  timezone: z.string().min(1),
  daysOfWeek: z.array(z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'])),
  times: z.array(z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)), // HH:mm format
  doseQuantity: z.number().positive().optional(),
  doseUnit: z.enum(['MG', 'MCG', 'G', 'ML', 'IU', 'DROP', 'PUFF', 'UNIT', 'TAB', 'CAPS']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Check if prescription exists and belongs to user
    const prescription = await prisma.prescription.findFirst({
      where: { id: params.id, userId },
    })

    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    const schedules = await prisma.schedule.findMany({
      where: { prescriptionId: params.id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = scheduleSchema.parse(body)

    // Check if prescription exists and belongs to user
    const prescription = await prisma.prescription.findFirst({
      where: { id: params.id, userId },
    })

    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    const schedule = await prisma.schedule.create({
      data: {
        prescriptionId: params.id,
        timezone: validatedData.timezone,
        daysOfWeek: validatedData.daysOfWeek,
        times: validatedData.times,
        doseQuantity: validatedData.doseQuantity,
        doseUnit: validatedData.doseUnit,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
      },
    })

    return NextResponse.json(schedule, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error creating schedule:', error)
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 })
  }
}
