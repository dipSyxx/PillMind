import { getUserIdFromSession } from '@/lib/session'
import prisma from '@/prisma/prisma-client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const medicationUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  brandName: z.string().optional(),
  form: z.enum(['TABLET', 'CAPSULE', 'LIQUID', 'INJECTION', 'INHALER', 'TOPICAL', 'DROPS', 'OTHER']).optional(),
  strengthValue: z.number().positive().optional(),
  strengthUnit: z.enum(['MG', 'MCG', 'G', 'ML', 'IU', 'DROP', 'PUFF', 'UNIT', 'TAB', 'CAPS']).optional(),
  route: z
    .enum(['ORAL', 'SUBLINGUAL', 'INHALATION', 'TOPICAL', 'INJECTION', 'OPHTHALMIC', 'NASAL', 'RECTAL', 'OTHER'])
    .optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const medication = await prisma.medication.findFirst({
      where: { id, userId },
      include: {
        inventory: true,
        prescriptions: {
          include: {
            schedules: true,
          },
        },
      },
    })

    if (!medication) {
      return NextResponse.json({ error: 'Medication not found' }, { status: 404 })
    }

    return NextResponse.json(medication)
  } catch (error) {
    console.error('Error fetching medication:', error)
    return NextResponse.json({ error: 'Failed to fetch medication' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = medicationUpdateSchema.parse(body)

    // Check if medication exists and belongs to user
    const existingMedication = await prisma.medication.findFirst({
      where: { id, userId },
    })

    if (!existingMedication) {
      return NextResponse.json({ error: 'Medication not found' }, { status: 404 })
    }

    const medication = await prisma.medication.update({
      where: { id },
      data: validatedData,
      include: {
        inventory: true,
        prescriptions: {
          include: {
            schedules: true,
          },
        },
      },
    })

    return NextResponse.json(medication)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error updating medication:', error)
    return NextResponse.json({ error: 'Failed to update medication' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    // Check if medication exists and belongs to user
    const existingMedication = await prisma.medication.findFirst({
      where: { id, userId },
      include: {
        prescriptions: true,
      },
    })

    if (!existingMedication) {
      return NextResponse.json({ error: 'Medication not found' }, { status: 404 })
    }

    // Check if medication has active prescriptions
    if (existingMedication.prescriptions.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete medication with active prescriptions',
        },
        { status: 400 },
      )
    }

    await prisma.medication.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Medication deleted successfully' })
  } catch (error) {
    console.error('Error deleting medication:', error)
    return NextResponse.json({ error: 'Failed to delete medication' }, { status: 500 })
  }
}
