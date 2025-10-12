import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/prisma-client'
import { getUserIdFromSession } from '@/lib/session'
import { z } from 'zod'

const prescriptionSchema = z.object({
  medicationId: z.string().min(1),
  providerId: z.string().optional(),
  indication: z.string().optional(),
  asNeeded: z.boolean().default(false),
  maxDailyDose: z.number().positive().optional(),
  instructions: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
})

export async function GET() {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const prescriptions = await prisma.prescription.findMany({
      where: { userId },
      include: {
        medication: {
          include: {
            inventory: true,
          },
        },
        schedules: true,
        provider: true,
        doseLogs: {
          orderBy: { scheduledFor: 'desc' },
          take: 10, // Last 10 dose logs
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(prescriptions)
  } catch (error) {
    console.error('Error fetching prescriptions:', error)
    return NextResponse.json({ error: 'Failed to fetch prescriptions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = prescriptionSchema.parse(body)

    // Check if medication exists and belongs to user
    const medication = await prisma.medication.findFirst({
      where: { id: validatedData.medicationId, userId },
    })

    if (!medication) {
      return NextResponse.json({ error: 'Medication not found' }, { status: 404 })
    }

    // Check if provider exists and belongs to user (if provided)
    if (validatedData.providerId) {
      const provider = await prisma.careProvider.findFirst({
        where: { id: validatedData.providerId, userId },
      })

      if (!provider) {
        return NextResponse.json({ error: 'Care provider not found' }, { status: 404 })
      }
    }

    const prescription = await prisma.prescription.create({
      data: {
        userId,
        medicationId: validatedData.medicationId,
        providerId: validatedData.providerId,
        indication: validatedData.indication,
        asNeeded: validatedData.asNeeded,
        maxDailyDose: validatedData.maxDailyDose,
        instructions: validatedData.instructions,
        startDate: new Date(validatedData.startDate),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
      },
      include: {
        medication: {
          include: {
            inventory: true,
          },
        },
        schedules: true,
        provider: true,
      },
    })

    return NextResponse.json(prescription, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error creating prescription:', error)
    return NextResponse.json({ error: 'Failed to create prescription' }, { status: 500 })
  }
}
