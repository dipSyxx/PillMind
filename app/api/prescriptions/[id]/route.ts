import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/prisma-client'
import { getUserIdFromSession } from '@/lib/session'
import { z } from 'zod'

const prescriptionUpdateSchema = z.object({
  providerId: z.string().optional(),
  indication: z.string().optional(),
  asNeeded: z.boolean().optional(),
  maxDailyDose: z.number().positive().optional(),
  instructions: z.string().optional(),
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
    const prescription = await prisma.prescription.findFirst({
      where: { id: params.id, userId },
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
        },
      },
    })

    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    return NextResponse.json(prescription)
  } catch (error) {
    console.error('Error fetching prescription:', error)
    return NextResponse.json({ error: 'Failed to fetch prescription' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = prescriptionUpdateSchema.parse(body)

    // Check if prescription exists and belongs to user
    const existingPrescription = await prisma.prescription.findFirst({
      where: { id: params.id, userId },
    })

    if (!existingPrescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
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

    const prescription = await prisma.prescription.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
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

    return NextResponse.json(prescription)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error updating prescription:', error)
    return NextResponse.json({ error: 'Failed to update prescription' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Check if prescription exists and belongs to user
    const existingPrescription = await prisma.prescription.findFirst({
      where: { id: params.id, userId },
    })

    if (!existingPrescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    await prisma.prescription.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Prescription deleted successfully' })
  } catch (error) {
    console.error('Error deleting prescription:', error)
    return NextResponse.json({ error: 'Failed to delete prescription' }, { status: 500 })
  }
}
